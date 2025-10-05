// DISABLED: This file requires member-based token management which was removed
// TODO: Implement session-based token management if needed

import { httpAction, mutation } from "./_generated/server";
import { v } from "convex/values";

export const proxyResend = httpAction(async (_ctx, _req) => {
  return new Response("Resend proxy disabled - auth removed", { status: 503 });
});

export const issueResendToken = mutation({
  args: {},
  returns: v.null(),
  handler: async () => {
    // Disabled: Requires auth which was removed
    return null;
  },
});
