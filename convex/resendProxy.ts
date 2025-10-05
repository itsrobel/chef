// DISABLED: This file requires member-based token management which was removed
// TODO: Implement session-based token management if needed

import { httpAction } from "./_generated/server";

export const proxyResend = httpAction(async (_ctx, _req) => {
  return new Response("Resend proxy disabled - auth removed", { status: 503 });
});
