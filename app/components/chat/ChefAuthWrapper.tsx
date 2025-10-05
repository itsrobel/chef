import { useConvex } from 'convex/react';
import { createContext, useContext, useEffect } from 'react';

import { sessionIdStore } from '~/lib/stores/sessionId';

import { useConvexSessionIdOrNullOrLoading } from '~/lib/stores/sessionId';
import type { Id } from '@convex/_generated/dataModel';
import { useLocalStorage } from '@uidotdev/usehooks';
import { api } from '@convex/_generated/api';
import { setChefDebugProperty } from 'chef-agent/utils/chefDebug';

type ChefAuthState =
  | {
      kind: 'loading';
    }
  | {
      kind: 'unauthenticated';
    }
  | {
      kind: 'fullyLoggedIn';
      sessionId: Id<'sessions'>;
    };

const ChefAuthContext = createContext<{
  state: ChefAuthState;
}>(null as unknown as { state: ChefAuthState });

export function useChefAuth() {
  const state = useContext(ChefAuthContext);
  if (state === null) {
    throw new Error('useChefAuth must be used within a ChefAuthProvider');
  }
  return state.state;
}

export function useChefAuthContext() {
  const state = useContext(ChefAuthContext);
  if (state === null) {
    throw new Error('useChefAuth must be used within a ChefAuthProvider');
  }
  return state;
}

export const SESSION_ID_KEY = 'sessionIdForConvex';

export const ChefAuthProvider = ({
  children,
  redirectIfUnauthenticated,
}: {
  children: React.ReactNode;
  redirectIfUnauthenticated: boolean;
}) => {
  const sessionId = useConvexSessionIdOrNullOrLoading();
  const convex = useConvex();
  const [sessionIdFromLocalStorage, setSessionIdFromLocalStorage] = useLocalStorage<Id<'sessions'> | null>(
    SESSION_ID_KEY,
    null,
  );

  useEffect(() => {
    function setSessionId(sessionId: Id<'sessions'> | null) {
      setSessionIdFromLocalStorage(sessionId);
      sessionIdStore.set(sessionId);
      if (sessionId) {
        setChefDebugProperty('sessionId', sessionId);
      }
    }

    async function createAnonymousSession() {
      if (sessionIdFromLocalStorage) {
        let isValid: boolean = false;
        try {
          isValid = await convex.query(api.sessions.verifySession, {
            sessionId: sessionIdFromLocalStorage as Id<'sessions'>,
          });
        } catch (error) {
          console.error('Error verifying session', error);
          setSessionId(null);
        }
        if (isValid) {
          setSessionId(sessionIdFromLocalStorage as Id<'sessions'>);
        } else {
          setSessionId(null);
        }
      }

      if (!sessionIdFromLocalStorage || sessionId === null) {
        try {
          const newSessionId = await convex.mutation(api.sessions.startAnonymousSession);
          setSessionId(newSessionId);
        } catch (error) {
          console.error('Error creating anonymous session', error);
          setSessionId(null);
        }
      }
    }

    void createAnonymousSession();
  }, [convex, sessionId, sessionIdFromLocalStorage, setSessionIdFromLocalStorage]);

  const isLoading = sessionId === undefined;
  const state: ChefAuthState = isLoading
    ? { kind: 'loading' }
    : sessionId === null
      ? { kind: 'unauthenticated' }
      : { kind: 'fullyLoggedIn', sessionId: sessionId as Id<'sessions'> };

  if (redirectIfUnauthenticated && state.kind === 'unauthenticated') {
    console.log('redirecting to /');
    window.location.href = '/';
  }

  return <ChefAuthContext.Provider value={{ state }}>{children}</ChefAuthContext.Provider>;
};
