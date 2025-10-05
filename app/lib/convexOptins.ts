// DISABLED: Opt-ins require authentication which has been removed
import type { ConvexReactClient } from 'convex/react';

type OptInToAccept = {
  optIn: {
    tos: string;
  };
  message: string;
};

export async function fetchOptIns(_convex: ConvexReactClient): Promise<
  | {
      kind: 'loaded';
      optIns: OptInToAccept[];
    }
  | {
      kind: 'error';
      error: string;
    }
  | {
      kind: 'missingAuth';
    }
> {
  // Always return missingAuth since we have no authentication system
  return {
    kind: 'missingAuth',
  };
}
