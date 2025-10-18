/**
 * Convex OAuth Authorization Code Flow
 *
 * Implements OAuth 2.0 Authorization Code Grant with PKCE (RFC 7636)
 * Uses Convex Platform API for authentication
 */

const CONVEX_AUTH_ISSUER = 'https://auth.convex.dev';
const CONVEX_OAUTH_AUTHORIZE_URL = 'https://dashboard.convex.dev/oauth/authorize/team';
const CONVEX_OAUTH_TOKEN_URL = 'https://api.convex.dev/oauth/token';

export interface PKCEChallenge {
  verifier: string;
  challenge: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Generate a cryptographically secure random string for PKCE
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

/**
 * Create SHA-256 hash and base64url encode it
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const verifier = generateRandomString(128);
  const challenge = await sha256(verifier);

  return {
    verifier,
    challenge,
  };
}

/**
 * Build the OAuth authorization URL with PKCE
 */
export function getAuthorizationUrl(codeChallenge: string, redirectUri: string): string {
  const clientId = import.meta.env.VITE_CONVEX_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error('VITE_CONVEX_OAUTH_CLIENT_ID is not configured');
  }

  const state = generateRandomString(32);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  // Store state for verification in callback
  sessionStorage.setItem('oauth_state', state);

  return `${CONVEX_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token (SERVER-SIDE ONLY)
 * This function should only be called from Remix loaders/actions
 */
export async function exchangeCodeForTokenServer(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenResponse | null> {
  // eslint-disable-next-line local/no-direct-process-env
  const clientId = process.env.VITE_CONVEX_OAUTH_CLIENT_ID;
  // eslint-disable-next-line local/no-direct-process-env
  const clientSecret = process.env.CONVEX_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('OAuth client credentials not configured');
    return null;
  }

  try {
    const response = await fetch(CONVEX_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to exchange code for token:', response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

/**
 * Helper to parse PKCE verifier from cookies (SERVER-SIDE)
 */
export function getPKCEVerifierFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'convex_pkce_verifier') {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Verify OAuth state parameter to prevent CSRF attacks
 */
export function verifyState(receivedState: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return storedState === receivedState;
}
