/**
 * Convex Authentication Store
 *
 * Manages Convex login modal state and authentication status
 */

import { atom } from 'nanostores';

export const convexLoginModalOpenStore = atom<boolean>(false);

// Callback to be invoked after successful authentication
let authSuccessCallback: (() => void | Promise<void>) | null = null;

export function openConvexLoginModal(onSuccess?: () => void | Promise<void>) {
  if (onSuccess) {
    authSuccessCallback = onSuccess;
  }
  convexLoginModalOpenStore.set(true);
}

export function closeConvexLoginModal() {
  convexLoginModalOpenStore.set(false);
}

export function getAuthSuccessCallback() {
  return authSuccessCallback;
}

export function clearAuthSuccessCallback() {
  authSuccessCallback = null;
}
