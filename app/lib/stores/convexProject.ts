import { atom } from 'nanostores';
import type { ConvexProject } from 'chef-agent/types';

export const convexProjectStore = atom<ConvexProject | null>(null);

export function waitForConvexProjectConnection(): Promise<ConvexProject | null> {
  return new Promise((resolve) => {
    if (convexProjectStore.get() !== null) {
      resolve(convexProjectStore.get()!);
      return;
    }

    // Short timeout - don't block chat if no Convex project is available
    const timeout = setTimeout(() => {
      console.log('No Convex deployment available - continuing without backend');
      resolve(null);
    }, 2000);

    const unsubscribe = convexProjectStore.subscribe((project) => {
      if (project !== null) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(project);
      }
    });
  });
}
