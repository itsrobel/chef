// DISABLED: Teams are not supported in anonymous session mode
// This is a stub to prevent breaking imports

import { atom } from 'nanostores';

export const selectedTeamSlugStore = atom<null>(null);

export function useSelectedTeamSlug(): null {
  return null;
}

export function setSelectedTeamSlug(_slug: string | null) {
  // No-op: Teams are not supported
}

export async function waitForSelectedTeamSlug(_caller?: string): Promise<null> {
  return null;
}
