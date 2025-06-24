import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    name: v.string(),
  }),

  users: defineTable({
    name: v.string(),
    createdAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_last_active", ["lastActiveAt"]),

  threads: defineTable({
    channelId: v.id("channels"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_updated", ["updatedAt"]),

  messages: defineTable({
    // Make threadId optional to handle existing messages without it
    threadId: v.optional(v.id("threads")),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    // createdAt is optional in the schema but will always be set by the application
    createdAt: v.optional(v.number()),
  })
    .index("by_thread", ["threadId"])
    .index("by_channel", ["channelId"]),
});
