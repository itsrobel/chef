export type CheckTokenUsageResponse =
  | {
      status: 'success';
      centitokensUsed: number;
      centitokensQuota: number;
      isTeamDisabled: boolean;
      isPaidPlan: boolean;
    }
  | {
      status: 'error';
      httpStatus: number;
      httpBody: string;
    };

export function disabledText(isPaidPlan: boolean) {
  return isPaidPlan
    ? 'You have exceeded your spending limits, so your deployments have been disabled. ' +
        'Please increase your spending limit on the Convex dashboard or wait until limits reset.'
    : 'You have exceeded the free plan limits, so your deployments have been disabled. ' +
        'Please upgrade your plan or reach out to us at support@convex.dev for help.';
}

export function renderTokenCount(tokens: number) {
  const renderedTokens = Math.max(1, tokens);
  return renderedTokens.toLocaleString();
}

export function noTokensText(centitokensUsed: number, centitokensQuota: number) {
  return (
    `No remaining tokens available. ` +
    `Used ${renderTokenCount(Math.floor(centitokensUsed / 100))} of ${renderTokenCount(Math.floor(centitokensQuota / 100))}.`
  );
}

// Stubbed for anonymous mode - no Big Brain API calls
export async function getTokenUsage(
  _provisionHost: string,
  _convexAuthToken: string,
  _teamSlug: string,
): Promise<CheckTokenUsageResponse> {
  return {
    status: 'success',
    centitokensUsed: 0,
    centitokensQuota: Infinity,
    isTeamDisabled: false,
    isPaidPlan: false,
  };
}
