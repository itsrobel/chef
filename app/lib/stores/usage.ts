// DISABLED: Usage tracking requires teams/authentication which has been removed

import { map } from 'nanostores';

export type TeamUsageState = {
  readonly isLoading: boolean;
  readonly tokenUsage: null;
};

export type UsageData = {
  status: 'error';
};

export const serverTeamUsageStore = map<Record<string, TeamUsageState>>({});

export function useTokenUsage(_teamSlug: string | null): TeamUsageState {
  return { isLoading: false, tokenUsage: null };
}

export function useUsage({ teamSlug: _teamSlug }: { teamSlug: string | null }) {
  return {
    isLoadingUsage: false,
    usagePercentage: 0,
    isPaidPlan: false,
    used: 0,
    quota: 0,
    refetch: () => {
      // No-op: Usage tracking disabled
    },
  };
}
