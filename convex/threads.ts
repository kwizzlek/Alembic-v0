import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * List all threads for the current user
 */
export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    // In a real app, you might want to filter threads by the current user
    const threads = await ctx.db.query("threads")
      .withIndex("by_updated", q => q)
      .order("desc")
      .collect();

    // Get the last message for each thread
    const threadsWithLastMessage = await Promise.all(
      threads.map(async (thread) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_thread", q => q.eq("threadId", thread._id))
          .order("desc")
          .first();
        
        return {
          ...thread,
          lastMessage: lastMessage?.content || "No messages yet",
          lastMessageAt: lastMessage?.createdAt || thread.createdAt,
        };
      })
    );

    return threadsWithLastMessage;
  },
});

/**
 * Create a new thread
 */
export const createThread = mutation({
  args: {
    title: v.string(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      channelId: args.channelId,
      createdAt: now,
      updatedAt: now,
    });
    return threadId;
  },
});

/**
 * Delete a thread and all its messages
 */
export const deleteThread = mutation({
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
 * Get a single thread by ID
 */
export const getThread = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});

/**
 * List all messages in a thread
 */
export const listMessages = query({
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
