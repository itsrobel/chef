import { useEffect } from 'react';
import { ContainerBootState, setContainerBootState, waitForBootStepCompleted } from '~/lib/stores/containerBootState';
import { webcontainer } from '~/lib/webcontainer';
import { useStore } from '@nanostores/react';
import { sessionIdStore } from '~/lib/stores/sessionId';
import { api } from '@convex/_generated/api';
import type { ConvexReactClient } from 'convex/react';
import { useConvex } from 'convex/react';
import { decompressWithLz4 } from '~/lib/compression';
import { streamOutput } from '~/utils/process';
import { cleanTerminalOutput } from 'chef-agent/utils/shell';
import { toast } from 'sonner';
import { convexProjectStore } from '~/lib/stores/convexProject';
import type { ConvexProject } from 'chef-agent/types';
import type { WebContainer } from '@webcontainer/api';
import { workbenchStore } from '~/lib/stores/workbench.client';
import { initializeConvexAuth } from 'chef-agent/convexAuth';
import { appendEnvVarIfNotSet } from '~/utils/envFileUtils';
import { getFileUpdateCounter } from '~/lib/stores/fileUpdateCounter';
import { chatSyncState } from './chatSyncState';
import { FILE_EVENTS_DEBOUNCE_MS } from '~/lib/stores/files';
import { setChefDebugProperty } from 'chef-agent/utils/chefDebug';
import { getAccessToken, getDeploymentInfo, saveDeploymentInfo } from '~/lib/convex-storage';
import { provisionDeployment } from '~/lib/convex-provision';
import { openConvexLoginModal } from '~/lib/stores/convexAuth';

const TEMPLATE_URL = '/template-snapshot-63fbe575.bin';

export function useNewChatContainerSetup() {
  const convex = useConvex();
  useEffect(() => {
    const runSetup = async () => {
      try {
        await waitForBootStepCompleted(ContainerBootState.STARTING);
        await setupContainer(convex, { snapshotUrl: TEMPLATE_URL, allowNpmInstallFailure: false });
      } catch (error: any) {
        toast.error('Failed to setup Chef environment. Try reloading the page.');
        setContainerBootState(ContainerBootState.ERROR, error);
      }
    };
    void runSetup();
  }, [convex]);
}

export function useExistingChatContainerSetup(loadedChatId: string | undefined) {
  const sessionId = useStore(sessionIdStore);
  const convex = useConvex();
  useEffect(() => {
    if (!sessionId) {
      return;
    }
    if (!loadedChatId) {
      return;
    }
    const runSetup = async () => {
      try {
        await waitForBootStepCompleted(ContainerBootState.STARTING);
        let snapshotUrl = await convex.query(api.snapshot.getSnapshotUrl, { chatId: loadedChatId, sessionId });
        if (!snapshotUrl) {
          console.warn(`Existing chat ${loadedChatId} has no snapshot. Loading the base template.`);
          snapshotUrl = TEMPLATE_URL;
        }
        await setupContainer(convex, { snapshotUrl, allowNpmInstallFailure: true });
      } catch (error: any) {
        toast.error('Failed to setup Chef environment. Try reloading the page.');
        setContainerBootState(ContainerBootState.ERROR, error);
      }
    };
    void runSetup();
  }, [convex, loadedChatId, sessionId]);
}

async function setupContainer(
  convex: ConvexReactClient,
  options: { snapshotUrl: string; allowNpmInstallFailure: boolean },
) {
  const resp = await fetch(options.snapshotUrl);
  if (!resp.ok) {
    throw new Error(`Failed to download snapshot (${resp.statusText}): ${resp.statusText}`);
  }
  const compressed = await resp.arrayBuffer();
  const decompressed = decompressWithLz4(new Uint8Array(compressed));

  const container = await webcontainer;
  await container.mount(decompressed);

  await workbenchStore.prewarmWorkdir(container);

  setChefDebugProperty('webcontainer', container);

  setContainerBootState(ContainerBootState.DOWNLOADING_DEPENDENCIES);
  const npm = await container.spawn('npm', ['install', '--no-fund', '--no-deprecated']);
  const { output, exitCode } = await streamOutput(npm);
  console.log('NPM output', cleanTerminalOutput(output));

  if (exitCode !== 0) {
    if (options.allowNpmInstallFailure) {
      toast.error(`Failed to install dependencies. Fix your package.json and tell Chef to redeploy.`, {
        duration: Infinity,
      });
      console.error(`npm install failed with exit code ${exitCode}: ${output}`);
    } else {
      throw new Error(`npm install failed with exit code ${exitCode}: ${output}`);
    }
  }

  // Skip Convex setup during initial boot - it will be triggered after first message
  setContainerBootState(ContainerBootState.SETTING_UP_CONVEX_PROJECT);
  console.log('Skipping Convex setup during initial boot. It will be triggered after first message submission.');
  setContainerBootState(ContainerBootState.SETTING_UP_CONVEX_ENV_VARS);
  setContainerBootState(ContainerBootState.CONFIGURING_CONVEX_AUTH);

  setContainerBootState(ContainerBootState.STARTING_BACKUP);
  await initializeFileSystemBackup();

  setContainerBootState(ContainerBootState.READY);
}

export async function triggerConvexSetupIfNeeded(container: WebContainer) {
  // Check if Convex is already set up
  const existingProject = convexProjectStore.get();
  if (existingProject) {
    console.log('Convex project already configured');
    return;
  }

  try {
    // Check for saved deployment info
    const savedDeployment = getDeploymentInfo();
    if (savedDeployment) {
      console.log('Found saved deployment, using it');
      await setupConvexFromSavedDeployment(container, savedDeployment);
      return;
    }

    // Check for saved access token
    const accessToken = getAccessToken();
    if (accessToken) {
      console.log('Found access token, provisioning deployment');
      await setupConvexWithToken(container, accessToken);
      return;
    }

    // No saved credentials or they're invalid - show login modal
    console.log('No valid credentials found, showing login modal');
    openConvexLoginModal(async () => {
      // After authentication succeeds, check for token and provision
      const newAccessToken = getAccessToken();
      if (newAccessToken) {
        await setupConvexWithToken(container, newAccessToken);
      }
    });
  } catch (error: any) {
    console.error('Convex setup error:', error);
    toast.error('Failed to setup Convex. Please try logging in again.');
    openConvexLoginModal(async () => {
      // Retry setup after authentication
      const newAccessToken = getAccessToken();
      if (newAccessToken) {
        await setupConvexWithToken(container, newAccessToken);
      }
    });
  }
}

async function setupConvexFromSavedDeployment(
  container: WebContainer,
  deployment: { deploymentUrl: string; deploymentName: string; deployKey: string },
): Promise<void> {
  const convexProject: ConvexProject = {
    deploymentUrl: deployment.deploymentUrl,
    deploymentName: deployment.deploymentName,
    token: deployment.deployKey,
    projectSlug: 'dev',
    teamSlug: 'personal',
  };

  await setupConvexEnvVars(container, convexProject);
  await initializeConvexAuth(convexProject);
  convexProjectStore.set(convexProject);

  console.log('Convex project restored from saved deployment');
}

async function setupConvexWithToken(container: WebContainer, accessToken: string): Promise<void> {
  toast.info('Provisioning Convex deployment...');

  const deployment = await provisionDeployment(accessToken);

  if (!deployment) {
    toast.error('Failed to provision deployment');
    openConvexLoginModal();
    return;
  }

  const convexProject: ConvexProject = {
    deploymentUrl: deployment.deploymentUrl,
    deploymentName: deployment.deploymentName,
    token: deployment.deployKey,
    projectSlug: 'dev',
    teamSlug: 'personal',
  };

  // Save deployment info for future sessions
  saveDeploymentInfo({
    deploymentUrl: deployment.deploymentUrl,
    deploymentName: deployment.deploymentName,
    deployKey: deployment.deployKey,
    projectId: deployment.projectId,
    teamId: deployment.teamId,
  });

  await setupConvexEnvVars(container, convexProject);
  await initializeConvexAuth(convexProject);
  convexProjectStore.set(convexProject);

  toast.success('Convex deployment ready!');
}

async function initializeFileSystemBackup() {
  await new Promise((resolve) => setTimeout(resolve, FILE_EVENTS_DEBOUNCE_MS * 2));
  const currentChatSyncState = chatSyncState.get();
  if (currentChatSyncState.savedFileUpdateCounter === null) {
    const fileUpdateCounter = getFileUpdateCounter();
    chatSyncState.set({
      ...currentChatSyncState,
      savedFileUpdateCounter: fileUpdateCounter,
    });
  }
}

async function setupConvexEnvVars(webcontainer: WebContainer, convexProject: ConvexProject) {
  const { token } = convexProject;
  await appendEnvVarIfNotSet({
    envFilePath: '.env.local',
    readFile: (path) => webcontainer.fs.readFile(path, 'utf-8'),
    writeFile: (path, content) => webcontainer.fs.writeFile(path, content),
    envVarName: 'CONVEX_DEPLOY_KEY',
    value: token,
  });
}
