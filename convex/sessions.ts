import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const verifySession = query({
  args: {
    sessionId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const sessionId = ctx.db.normalizeId("sessions", args.sessionId);
    if (!sessionId) {
      return false;
    }
    const session = await ctx.db.get(sessionId);
    return !!session;
  },
});

export async function isValidSession(ctx: QueryCtx, args: { sessionId: Id<"sessions"> }) {
  const session = await ctx.db.get(args.sessionId);
  return !!session;
}

export const startAnonymousSession = mutation({
  args: {},
  returns: v.id("sessions"),
  handler: async (ctx) => {
    return ctx.db.insert("sessions", {});
  },
});
