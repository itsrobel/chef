/**
 * Convex Token Storage
 *
 * Persists Convex auth tokens in browser localStorage
 * Tokens are stored per-device and persist across browser sessions
 */

const STORAGE_KEY_ACCESS_TOKEN = 'convex_access_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'convex_token_expiry';
const STORAGE_KEY_DEPLOYMENT = 'convex_deployment_info';
const STORAGE_KEY_PKCE_VERIFIER = 'convex_pkce_verifier';

export interface StoredDeploymentInfo {
  deploymentUrl: string;
  deploymentName: string;
  deployKey: string;
  projectId?: number;
  teamId?: string;
  createdAt: number;
}

/**
 * Save access token to localStorage
 */
export function saveAccessToken(token: string, expiresIn?: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, token);

    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString());
    }
  } catch (error) {
    console.error('Failed to save access token:', error);
  }
}

/**
 * Get access token from localStorage
 * Returns null if token doesn't exist or has expired
 */
export function getAccessToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
    if (!token) {
      return null;
    }

    // Check if token has expired
    const expiryTime = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
    if (expiryTime && Date.now() > parseInt(expiryTime, 10)) {
      // Token expired, clear it
      clearAccessToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Clear access token from localStorage
 */
export function clearAccessToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
  } catch (error) {
    console.error('Failed to clear access token:', error);
  }
}

/**
 * Save deployment information to localStorage
 */
export function saveDeploymentInfo(deployment: Omit<StoredDeploymentInfo, 'createdAt'>): void {
  try {
    const deploymentInfo: StoredDeploymentInfo = {
      ...deployment,
      createdAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_DEPLOYMENT, JSON.stringify(deploymentInfo));
  } catch (error) {
    console.error('Failed to save deployment info:', error);
  }
}

/**
 * Get deployment information from localStorage
 */
export function getDeploymentInfo(): StoredDeploymentInfo | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DEPLOYMENT);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as StoredDeploymentInfo;
  } catch (error) {
    console.error('Failed to get deployment info:', error);
    return null;
  }
}

/**
 * Clear deployment information from localStorage
 */
export function clearDeploymentInfo(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DEPLOYMENT);
  } catch (error) {
    console.error('Failed to clear deployment info:', error);
  }
}

/**
 * Clear all Convex-related data from localStorage
 */
export function clearAllConvexData(): void {
  clearAccessToken();
  clearDeploymentInfo();
}

/**
 * Check if user is authenticated (has valid access token)
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Save PKCE code verifier to cookie (accessible from both client and server)
 */
export function savePKCEVerifier(verifier: string): void {
  try {
    // Set cookie with 10 minute expiry (OAuth flow should complete within this time)
    const expires = new Date(Date.now() + 10 * 60 * 1000).toUTCString();
    document.cookie = `${STORAGE_KEY_PKCE_VERIFIER}=${verifier}; path=/; expires=${expires}; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to save PKCE verifier:', error);
  }
}

/**
 * Get PKCE code verifier from cookie
 */
export function getPKCEVerifier(): string | null {
  try {
    const name = STORAGE_KEY_PKCE_VERIFIER + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length);
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get PKCE verifier:', error);
    return null;
  }
}

/**
 * Clear PKCE code verifier from cookie
 */
export function clearPKCEVerifier(): void {
  try {
    document.cookie = `${STORAGE_KEY_PKCE_VERIFIER}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to clear PKCE verifier:', error);
  }
}
