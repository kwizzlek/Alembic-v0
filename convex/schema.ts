import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Channels table
  channels: defineTable({
    name: v.string(),
  }),

  // Users table
  users: defineTable({
    name: v.string(),
    createdAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_last_active", ["lastActiveAt"]),

  // Threads table
  threads: defineTable({
    channelId: v.id("channels"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_updated", ["updatedAt"]),

  // Messages table
  messages: defineTable({
    threadId: v.optional(v.id("threads")),
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")),
    content: v.string(),
    createdAt: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
  })
    .index("by_thread", ["threadId"])
    .index("by_channel", ["channelId"])
    .vectorIndex("by_channel_and_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["channelId"]
    }),

  // Documents table
  documents: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.number(),
    channelId: v.id("channels"),
    storageId: v.id("_storage"),
    uploadedAt: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("processed"),
      v.literal("error")
    ),
    error: v.optional(v.string()),
  })
    .index("by_channel", ["channelId"])
    .index("by_status", ["status"]),

  // Document embeddings for semantic search
  documentEmbeddings: defineTable({
    content: v.string(),
    metadata: v.any(),
    embedding: v.array(v.number()),
    documentId: v.id("documents"),
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_created_at", ["createdAt"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["documentId"]
    }),
  // Add any additional tables or configurations here
});
