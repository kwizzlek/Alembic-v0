// convex/auth.ts

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * A non-throwing version to check authentication status.
 * @returns {Promise<boolean>} - Returns true if authenticated, false otherwise.
 */
export const check = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  }
});