import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to get the user from the database based on their identity
async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("User is not authenticated.");
  }

  // Get user from your users table
  const user = await ctx.db
    .query("users")
    .withIndex("by_name", (q) => q.eq("name", identity.email!))
    .unique();

  if (!user) {
    throw new ConvexError("User not found in database.");
  }
  
  return { user, identity };
}


const authCtx = customCtx(async (ctx) => {
  try {
    const { user, identity } = await getUser(ctx);
    return { user, identity };
  } catch (error) {
    // If it's a ConvexError, just rethrow it.
    if (error instanceof ConvexError) {
      throw error;
    }
    // Otherwise, wrap it to provide more context.
    throw new ConvexError(`Authentication failed: ${error}`);
  }
});


export const queryWithAuth = customQuery(query, authCtx);
export const mutationWithAuth = customMutation(mutation, authCtx);