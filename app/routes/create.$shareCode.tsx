import { waitForConvexSessionId } from '~/lib/stores/sessionId';
import { json } from '@vercel/remix';
import type { LoaderFunctionArgs } from '@vercel/remix';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from '~/components/ui/Toaster';
import { waitForSelectedTeamSlug } from '~/lib/stores/convexTeams';
import { useTeamsInitializer } from '~/lib/stores/startup/useTeamsInitializer';
import { ChefAuthProvider, useChefAuth } from '~/components/chat/ChefAuthWrapper';
import { useParams } from '@remix-run/react';
import { Loading } from '~/components/Loading';
import type { MetaFunction } from '@vercel/remix';
import { Button } from '@ui/Button';
import { ConvexError } from 'convex/values';
import { Sheet } from '@ui/Sheet';

export const meta: MetaFunction = () => {
  return [
    { title: 'Cooked with Chef' },
    {
      name: 'description',
      content: 'Someone shared with you a project cooked with Chef, the full-stack AI coding agent from Convex',
    },
    {
      property: 'og:image',
      content: 'https://chef.convex.dev/social_preview_share.png',
    },
  ];
};

export const loader = async (args: LoaderFunctionArgs) => {
  const url = new URL(args.request.url);
  let code: string | null = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (state) {
    code = null;
  }
  return json({ code });
};

export default function ShareProject() {
  return (
    <>
      <ChefAuthProvider redirectIfUnauthenticated={false}>
        <ShareProjectContent />
      </ChefAuthProvider>
      <Toaster />
    </>
  );
}

function ShareProjectContent() {
  const { shareCode } = useParams();

  if (!shareCode) {
    throw new Error('shareCode is required');
  }

  useTeamsInitializer();
  const chefAuthState = useChefAuth();

  const cloneChat = useMutation(api.share.clone);
  const getShareDescription = useQuery(api.share.getShareDescription, { code: shareCode });

  const handleCloneChat = useCallback(async () => {
    const sessionId = await waitForConvexSessionId('useInitializeChat');
    await waitForSelectedTeamSlug('useInitializeChat');

    try {
      const { id: chatId } = await cloneChat({ shareCode, sessionId });
      window.location.href = `/chat/${chatId}`;
    } catch (e) {
      if (e instanceof ConvexError) {
        toast.error(`Error cloning chat: ${e.data.message}`);
      } else {
        toast.error('Unexpected error cloning chat');
      }
    }
  }, [cloneChat, shareCode]);

  if (chefAuthState.kind === 'loading') {
    return <Loading />;
  }

  if (chefAuthState.kind !== 'fullyLoggedIn') {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Sheet className="w-full max-w-md space-y-6 border p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-center font-semibold">Clone Project</h1>
          {getShareDescription?.description && <p className="text-base">{getShareDescription.description}</p>}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-center">Clone Project</h2>
            <p className="text-center text-sm text-content-secondary">This project will be cloned to your account</p>
          </div>
        </div>

        <Button
          className="flex w-full items-center justify-center gap-2 px-6 py-3"
          onClick={handleCloneChat}
          disabled={chefAuthState.kind !== 'fullyLoggedIn'}
        >
          Clone Project
        </Button>
      </Sheet>
    </div>
  );
}
