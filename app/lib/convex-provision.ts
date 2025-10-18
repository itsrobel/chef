/**
 * Convex Deployment Provisioning via Management API v1
 *
 * Uses Convex Platform Management API to create projects and deployments
 * API Docs: https://docs.convex.dev/management-api
 */

const CONVEX_MANAGEMENT_API_BASE = 'https://api.convex.dev/v1';

export interface DeploymentCredentials {
  deployKey: string;
  deploymentUrl: string;
  deploymentName: string;
  projectId: number;
  teamId: string;
}

interface TokenDetails {
  teamId: string;
  name: string;
  createTime: number;
  type: 'teamToken';
}

interface CreateProjectResponse {
  projectId: number;
  deploymentName: string;
  deploymentUrl: string;
}

interface CreateDeployKeyResponse {
  deployKey: string;
}

/**
 * Get team ID from access token
 */
export async function getTeamId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${CONVEX_MANAGEMENT_API_BASE}/token_details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get token details:', response.status, errorText);
      return null;
    }

    const data: TokenDetails = await response.json();

    if (!data.teamId) {
      console.error('Token details missing teamId:', data);
      return null;
    }

    return data.teamId;
  } catch (error) {
    console.error('Error getting token details:', error);
    return null;
  }
}

/**
 * Create a new project with deployment
 */
export async function createProject(
  accessToken: string,
  teamId: string,
  projectName: string = 'chef-project',
  deploymentType: 'dev' | 'prod' = 'dev',
): Promise<CreateProjectResponse | null> {
  try {
    const response = await fetch(`${CONVEX_MANAGEMENT_API_BASE}/teams/${teamId}/create_project`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectName,
        deploymentType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create project:', response.status, errorText);
      return null;
    }

    const data: CreateProjectResponse = await response.json();

    if (!data.deploymentName || !data.deploymentUrl) {
      console.error('Create project response missing required fields:', data);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

/**
 * Create a deploy key for a deployment
 */
export async function createDeployKey(
  accessToken: string,
  deploymentName: string,
  keyName: string = 'chef-webcontainer-key',
): Promise<string | null> {
  try {
    const response = await fetch(
      `${CONVEX_MANAGEMENT_API_BASE}/deployments/${deploymentName}/create_deploy_key`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: keyName,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create deploy key:', response.status, errorText);
      return null;
    }

    const data: CreateDeployKeyResponse = await response.json();

    if (!data.deployKey) {
      console.error('Create deploy key response missing deployKey:', data);
      return null;
    }

    return data.deployKey;
  } catch (error) {
    console.error('Error creating deploy key:', error);
    return null;
  }
}

/**
 * Complete flow: get team, create project, and get deploy key
 */
export async function provisionDeployment(accessToken: string): Promise<DeploymentCredentials | null> {
  // Step 1: Get team ID
  const teamId = await getTeamId(accessToken);
  if (!teamId) {
    console.error('Failed to get team ID');
    return null;
  }

  console.log('Got team ID:', teamId);

  // Step 2: Create project
  const projectName = `chef-${Date.now()}`;
  const project = await createProject(accessToken, teamId, projectName, 'dev');
  if (!project) {
    console.error('Failed to create project');
    return null;
  }

  console.log('Created project:', project.deploymentName);

  // Step 3: Create deploy key
  const deployKey = await createDeployKey(accessToken, project.deploymentName);
  if (!deployKey) {
    console.error('Failed to create deploy key');
    return null;
  }

  console.log('Created deploy key');

  return {
    deployKey,
    deploymentUrl: project.deploymentUrl,
    deploymentName: project.deploymentName,
    projectId: project.projectId,
    teamId,
  };
}
