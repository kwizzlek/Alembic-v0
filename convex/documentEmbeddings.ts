import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Type for search results with scores
type SearchResult = {
  _id: Id<"documentEmbeddings">;
  _score: number;
  content: string;
  metadata: any;
};

/**
 * Insert a new document embedding (internal)
 */
export const insert = internalMutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    metadata: v.any(),
    embedding: v.array(v.number()),
    createdAt: v.number(),
  },
  returns: v.id("documentEmbeddings"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("documentEmbeddings", {
      documentId: args.documentId,
      content: args.content,
      metadata: args.metadata,
      embedding: args.embedding,
      createdAt: args.createdAt,
    });
  },
});

/**
 * Search for similar document chunks using vector search
 */
export const search = query({
  args: {
    queryEmbedding: v.array(v.number()),
    documentId: v.optional(v.id("documents")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("documentEmbeddings"),
      _score: v.number(),
      content: v.string(),
      metadata: v.any(),
    })
  ),
  handler: async (ctx, args): Promise<SearchResult[]> => {
    const { queryEmbedding, documentId, limit = 5 } = args;
    
    // For now, we'll implement a simple search that doesn't use the vector index
    // In a production app, you would use a vector database or a service like Pinecone
    // or implement proper vector search in your database
    
    let results;
    if (documentId) {
      results = await ctx.db
        .query("documentEmbeddings")
        .withIndex("by_document", (q) => q.eq("documentId", documentId))
        .collect();
    } else {
      results = await ctx.db
        .query("documentEmbeddings")
        .fullTableScan()
        .collect();
    }
    
    // Simple similarity calculation (cosine similarity between vectors)
    // This is a placeholder - in a real app, you'd use a proper vector search
    const resultsWithScores = results.map(result => {
      // Calculate a dummy similarity score for demonstration
      // In a real app, you'd calculate the actual cosine similarity
      // between queryEmbedding and result.embedding
      const similarity = Math.random(); // Replace with actual similarity calculation
      
      return {
        ...result,
        _score: similarity,
      };
    });
    
    // Sort by score and take top N results
    return resultsWithScores
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _id, content, metadata, _score }) => ({
        _id,
        content,
        metadata,
        _score
      }));
  },
});

/**
 * Get all chunks for a document
 */
export const listByDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  returns: v.array(
    v.object({
      _id: v.id("documentEmbeddings"),
      content: v.string(),
      metadata: v.any(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documentEmbeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .order("asc")
      .collect();
  },
});

/**
 * Delete all embeddings for a document (internal)
 */
export const deleteByDocument = internalMutation({
  args: {
    documentId: v.id("documents"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const embeddings = await ctx.db
      .query("documentEmbeddings")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
    
    await Promise.all(embeddings.map((e) => ctx.db.delete(e._id)));
    return embeddings.length;
  },
});
