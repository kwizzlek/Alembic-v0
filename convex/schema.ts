import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    name: v.string(),
  }),

  users: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  threads: defineTable({
    channelId: v.id("channels"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_updated", ["updatedAt"]),

  messages: defineTable({
    threadId: v.id("threads"),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_channel", ["channelId"]),
});
