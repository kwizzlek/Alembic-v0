import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export default internalQuery({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.object({
    _id: v.id("threads"),
    channelId: v.id("channels"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    _creationTime: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    
    // Explicitly return only the fields we want
    return {
      _id: thread._id,
      channelId: thread.channelId,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      _creationTime: (thread as any)._creationTime,
    };
  },
});
