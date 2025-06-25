// No need to import the original query/mutation if not used directly
// import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
// This import is incorrect and should be removed.
// import { isAuthenticated } from "./auth.config";
import { queryWithAuth, mutationWithAuth } from "./utils";

/**
 * Get a single thread by ID
 */
export const getThread = queryWithAuth({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});

/**
 * Create a new thread
 */
export const createThread = mutationWithAuth({
  args: {
    title: v.string(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      channelId: args.channelId,
      // You can now access the authenticated user's token identifier directly
      createdBy: ctx.identity.tokenIdentifier, 
      createdAt: now,
      updatedAt: now,
    });
    return threadId;
  },
});

/**
 * Delete a thread and all its messages
 */
export const deleteThread = mutationWithAuth({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    // First, delete all messages in the thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", q => q.eq("threadId", args.threadId))
      .collect();
    
    await Promise.all(messages.map(message => 
      ctx.db.delete(message._id)
    ));
    
    // Then delete the thread itself
    await ctx.db.delete(args.threadId);
    
    return { success: true };
  },
});

/**
 * List all messages in a thread
 */
export const listMessages = queryWithAuth({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", q => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
    
    return messages;
  },
});