import { useConvex } from 'convex/react';
import { waitForConvexSessionId } from '~/lib/stores/sessionId';
import { useCallback } from 'react';
import { api } from '@convex/_generated/api';
import { ContainerBootState, waitForBootStepCompleted } from '~/lib/stores/containerBootState';

export function useHomepageInitializeChat(chatId: string, setChatInitialized: (chatInitialized: boolean) => void) {
  const convex = useConvex();
  return useCallback(async () => {
    const sessionId = await waitForConvexSessionId('useInitializeChat');

    await convex.mutation(api.messages.initializeChat, {
      id: chatId,
      sessionId,
    });

    setChatInitialized(true);

    // Wait for the WebContainer to have its snapshot loaded before sending a message.
    await waitForBootStepCompleted(ContainerBootState.LOADING_SNAPSHOT);
    return true;
  }, [convex, chatId, setChatInitialized]);
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
