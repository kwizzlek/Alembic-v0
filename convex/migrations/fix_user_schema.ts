import { mutation } from "../_generated/server";

export default mutation({
  args: {},
  handler: async (ctx) => {
    // Find all users that are missing required fields
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      // If user is missing createdAt or lastActiveAt, add them
      if (user.createdAt === undefined || user.lastActiveAt === undefined) {
        await ctx.db.patch(user._id, {
          // Use current time if createdAt is missing, otherwise keep existing
          createdAt: user.createdAt || Date.now(),
          // Use current time if lastActiveAt is missing, otherwise keep existing
          lastActiveAt: user.lastActiveAt || Date.now(),
        });
      }
    }
    
    return { success: true };
  },
});
