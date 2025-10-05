import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { apiKeyValidator } from "./schema";

export const apiKeyForCurrentMember = query({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.union(v.null(), apiKeyValidator),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }
    return session.apiKey ?? null;
  },
});

export const setApiKeyForCurrentMember = mutation({
  args: {
    sessionId: v.id("sessions"),
    apiKey: apiKeyValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new ConvexError({ code: "NotFound", message: "Session not found" });
    }

    await ctx.db.patch(args.sessionId, { apiKey: args.apiKey });
    return null;
  },
});

export const deleteApiKeyForCurrentMember = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new ConvexError({ code: "NotFound", message: "Session not found" });
    }

    await ctx.db.patch(args.sessionId, { apiKey: undefined });
    return null;
  },
});

export const deleteAnthropicApiKeyForCurrentMember = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new ConvexError({ code: "NotFound", message: "Session not found" });
    }
    if (!session.apiKey) {
      return null;
    }
    await ctx.db.patch(args.sessionId, {
      apiKey: {
        ...session.apiKey,
        value: undefined,
      },
    });
    return null;
  },
});

export const deleteOpenaiApiKeyForCurrentMember = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new ConvexError({ code: "NotFound", message: "Session not found" });
    }
    if (!session.apiKey) {
      return null;
    }
    await ctx.db.patch(args.sessionId, {
      apiKey: {
        ...session.apiKey,
        openai: undefined,
      },
    });
    return null;
  },
});

export const deleteXaiApiKeyForCurrentMember = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new ConvexError({ code: "NotFound", message: "Session not found" });
    }
    if (!session.apiKey) {
      return null;
    }
    await ctx.db.patch(args.sessionId, {
      apiKey: {
        ...session.apiKey,
        xai: undefined,
      },
    });
    return null;
  },
});

export const deleteGoogleApiKeyForCurrentMember = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new ConvexError({ code: "NotFound", message: "Session not found" });
    }
    if (!session.apiKey) {
      return null;
    }
    await ctx.db.patch(args.sessionId, {
      apiKey: {
        ...session.apiKey,
        google: undefined,
      },
    });
    return null;
  },
});

export const validateAnthropicApiKey = action({
  args: {
    sessionId: v.id("sessions"),
    apiKey: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "test" }],
      }),
    });

    if (response.status === 401) {
      return false;
    }
    return true;
  },
});

export const validateOpenaiApiKey = action({
  args: {
    sessionId: v.id("sessions"),
    apiKey: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
      },
    });

    if (response.status === 401) {
      return false;
    }
    return true;
  },
});

export const validateGoogleApiKey = action({
  args: {
    sessionId: v.id("sessions"),
    apiKey: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${args.apiKey}`);

    if (response.status === 400) {
      return false;
    }
    return true;
  },
});

export const validateXaiApiKey = action({
  args: {
    sessionId: v.id("sessions"),
    apiKey: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
      },
    });
    if (response.status === 401) {
      return false;
    }
    return true;
  },
});
