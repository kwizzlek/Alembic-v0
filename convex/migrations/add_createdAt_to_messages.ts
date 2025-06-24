import { mutation } from "../_generated/server";

export const add_createdAt_to_messages = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all messages that are missing createdAt
    const messages = await ctx.db.query("messages")
      .filter(q => q.eq(q.field("createdAt"), undefined))
      .collect();
    
    // Update each message with a default createdAt timestamp
    const now = Date.now();
    await Promise.all(messages.map(message => 
      ctx.db.patch(message._id, { createdAt: now })
    ));
    
    return { updated: messages.length };
  },
});
