/**
 * OAuth Callback Route
 *
 * Handles the redirect back from Convex OAuth authorization
 * Exchanges authorization code for access token (server-side)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@vercel/remix';
import { exchangeCodeForTokenServer, getPKCEVerifierFromCookie, verifyState } from '~/lib/convex-auth';
import { saveAccessToken, clearPKCEVerifier } from '~/lib/convex-storage';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Check for OAuth errors
  if (error) {
    return json({
      success: false,
      error: errorDescription || `OAuth error: ${error}`,
    });
  }

  // Validate required parameters
  if (!code || !state) {
    return json({
      success: false,
      error: 'Missing required OAuth parameters',
    });
  }

  // Get PKCE verifier from cookie
  const cookieHeader = request.headers.get('Cookie');
  const codeVerifier = getPKCEVerifierFromCookie(cookieHeader);

  if (!codeVerifier) {
    return json({
      success: false,
      error: 'Missing PKCE code verifier. Please try logging in again.',
    });
  }

  // Exchange code for access token (server-side)
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/auth/callback`;

  const tokenResponse = await exchangeCodeForTokenServer(code, codeVerifier, redirectUri);

  if (!tokenResponse || !tokenResponse.access_token) {
    return json({
      success: false,
      error: 'Failed to exchange authorization code for access token',
    });
  }

  // Return access token to client
  return json({
    success: true,
    accessToken: tokenResponse.access_token,
    expiresIn: tokenResponse.expires_in,
  });
}

export default function AuthCallback() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    if (loaderData.success) {
      // Save access token to localStorage
      saveAccessToken(loaderData.accessToken, loaderData.expiresIn);

      // Clear PKCE verifier cookie
      clearPKCEVerifier();

      // Success!
      setStatus('success');

      // Redirect back to home page after a brief delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } else {
      // Error occurred
      setStatus('error');
    }
  }, [loaderData, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bolt-elements-background-depth-1">
      <div className="w-full max-w-md rounded-lg bg-bolt-elements-background-depth-2 p-8 shadow-lg">
        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <h2 className="text-xl font-semibold text-content-primary">Completing authentication...</h2>
            <p className="text-sm text-content-secondary">Please wait while we connect to Convex</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-content-primary">Authentication successful!</h2>
            <p className="text-sm text-content-secondary">Redirecting you back to Chef...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-content-primary">Authentication failed</h2>
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{loaderData.error}</p>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
