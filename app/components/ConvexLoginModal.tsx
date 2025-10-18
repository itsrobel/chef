/**
 * Convex Login Modal
 *
 * Displays a modal prompting the user to authenticate with Convex via OAuth
 */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { generatePKCEChallenge, getAuthorizationUrl } from '~/lib/convex-auth';
import { savePKCEVerifier } from '~/lib/convex-storage';

interface ConvexLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConvexLoginModal({ open, onClose }: ConvexLoginModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setIsRedirecting(true);
    setError(null);

    try {
      // Generate PKCE challenge
      const { verifier, challenge } = await generatePKCEChallenge();

      // Save verifier for later use in callback
      savePKCEVerifier(verifier);

      // Build authorization URL
      const redirectUri = `${window.location.origin}/auth/callback`;
      const authUrl = getAuthorizationUrl(challenge, redirectUri);

      // Redirect to Convex authorization page
      window.location.href = authUrl;
    } catch (err: any) {
      console.error('Failed to initiate OAuth flow:', err);
      setError(err.message || 'Failed to start authentication');
      setIsRedirecting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && !isRedirecting && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-bolt-elements-background-depth-2 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <Dialog.Title className="text-lg font-semibold text-content-primary">
            Connect to Convex
          </Dialog.Title>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-content-secondary">
              Chef needs access to your Convex account to create and manage deployments for your projects.
            </p>

            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {isRedirecting ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <p className="text-sm text-content-secondary">Redirecting to Convex...</p>
              </div>
            ) : (
              <>
                <div className="rounded-md bg-bolt-elements-background-depth-3 p-4">
                  <p className="text-xs text-content-tertiary mb-2">You'll be redirected to:</p>
                  <p className="text-sm text-content-secondary">dashboard.convex.dev</p>
                </div>

                <button
                  onClick={handleLogin}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Login with Convex
                </button>

                <p className="text-xs text-content-tertiary">
                  By continuing, you authorize Chef to create and manage Convex deployments on your behalf.
                </p>
              </>
            )}
          </div>

          {!isRedirecting && (
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-300 dark:data-[state=open]:bg-gray-800">
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
