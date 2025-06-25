import { v } from "convex/values";
// --- THIS IS THE KEY FIX ---
// Import the original builders AND our new custom ones
import { queryWithAuth, mutationWithAuth } from "./utils"; 
// ----------------------------
import { ConvexError } from "convex/values";

// ---- Update the 'list' query ----
export const list = queryWithAuth({
  args: { 
    channelId: v.id("channels"),
  },
  // The 'returns' part can be removed if you want, as it's inferred now, but keeping it is fine.
  // The handler now automatically has `ctx.user` and `ctx.identity` available and typed!
  handler: async (ctx, { channelId }) => {
    // No need to check for identity here, it's already done!
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) { ... }

    const docs = await ctx.db
      .query("documents")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .order("desc")
      .collect();

    return docs as any;
  },
});

// ---- Update the 'upload' mutation ----
export const upload = mutationWithAuth({
  args: {
    name: v.string(),
    type: v.string(),
    content: v.bytes(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, { name, type, content, channelId }) => {
    // ... (keep the rest of the handler the same, you don't need the identity check)
    // Validate file type
    if (!isAllowedFileType(type)) {
      throw new ConvexError(`Unsupported file type: ${type}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }
    // ... rest of function
  },
});

// ---- Update 'remove' mutation ----
export const remove = mutationWithAuth({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
     // ... (keep the rest of the handler the same)
  },
});

// ---- Update 'getDocumentById' query ----
export const getDocumentById = queryWithAuth({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, { documentId }) => {
    // ... (keep the rest of the handler the same)
  },
});

// ---- Update 'generateUploadUrl' mutation ----
export const generateUploadUrl = mutationWithAuth({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ---- Update 'saveStorageId' mutation ----
export const saveStorageId = mutationWithAuth({
  args: {
    name: v.string(),
    type: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    channelId: v.id("channels"),
  },
  handler: async (ctx, { name, type, size, storageId, channelId }) => {
    // ... (keep the rest of the handler the same)
  },
});


// ... (keep the rest of the file the same)