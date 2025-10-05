import { selectedTeamSlugStore } from '~/lib/stores/convexTeams';

import { useConvex } from 'convex/react';
import { waitForConvexSessionId } from '~/lib/stores/sessionId';
import { useCallback } from 'react';
import { api } from '@convex/_generated/api';
import { useChefAuth } from '~/components/chat/ChefAuthWrapper';
import { ContainerBootState, waitForBootStepCompleted } from '~/lib/stores/containerBootState';
import { toast } from 'sonner';
import { waitForConvexProjectConnection } from '~/lib/stores/convexProject';

const CREATE_PROJECT_TIMEOUT = 15000;

export function useHomepageInitializeChat(chatId: string, setChatInitialized: (chatInitialized: boolean) => void) {
  const convex = useConvex();
  const chefAuthState = useChefAuth();
  const isFullyLoggedIn = chefAuthState.kind === 'fullyLoggedIn';
  return useCallback(async () => {
    if (!isFullyLoggedIn) {
      return false;
    }
    const sessionId = await waitForConvexSessionId('useInitializeChat');
    const selectedTeamSlug = selectedTeamSlugStore.get();
    if (selectedTeamSlug === null) {
      return false;
    }

    await convex.mutation(api.messages.initializeChat, {
      id: chatId,
      sessionId,
    });

    try {
      // Wait for the Convex project to be successfully created before allowing chat to start
      await Promise.race([
        waitForConvexProjectConnection(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, CREATE_PROJECT_TIMEOUT);
        }),
      ]);
      setChatInitialized(true);
    } catch (error) {
      console.error('Failed to create Convex project:', error);
      if (error instanceof Error && error.message === 'Connection timeout') {
        toast.error('Connection timed out. Please try again.');
      } else {
        toast.error('Failed to create Convex project. Please try again.');
      }
      return false;
    }

    // Wait for the WebContainer to have its snapshot loaded before sending a message.
    await waitForBootStepCompleted(ContainerBootState.LOADING_SNAPSHOT);
    return true;
  }, [convex, chatId, isFullyLoggedIn, setChatInitialized]);
}

export function useExistingInitializeChat(chatId: string) {
  const convex = useConvex();
  return useCallback(async () => {
    const sessionId = await waitForConvexSessionId('useInitializeChat');
    await convex.mutation(api.messages.initializeChat, {
      id: chatId,
      sessionId,
    });

    return true;
  }, [convex, chatId]);
}
