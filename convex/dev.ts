// DISABLED: Dev utilities that relied on member-based auth
// This file can be deleted or reimplemented for session-based usage

import { query } from "./_generated/server";
import { v } from "convex/values";

export const placeholder = query({
  args: {},
  returns: v.null(),
  handler: async () => {
    return null;
  },
});
