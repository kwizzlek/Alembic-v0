import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Define types for our vector search results
type SearchResult = {
  _id: Id<"documentEmbeddings">;
  _creationTime: number;
  content: string;
  metadata: any;
  documentId: string;
  score: number;
};

type SearchResponse = {
  results: SearchResult[];
  isDone: boolean;
  continueCursor?: string;
};

export function useVectorSearch() {
  const searchDocuments = useQuery(api.vector.searchDocuments);
  const createDocument = useMutation(api.vector.createDocument);

  const search = async (
    query: string, 
    documentId?: string
  ): Promise<SearchResult[]> => {
    if (!searchDocuments) return [];
    
    try {
      // In a real app, you would generate the embedding here
      // For now, we'll just pass an empty array
      const embedding: number[] = []; // You would generate this using OpenAI's API
      
      const results = await searchDocuments({
        queryEmbedding: embedding,
        limit: 5,
        filter: documentId ? { documentId } : undefined,
      });

      return results?.results || [];
    } catch (error) {
      console.error("Error searching documents:", error);
      return [];
    }
  };

  const addDocument = async (
    content: string, 
    metadata: Record<string, any> = {}
  ): Promise<string | null> => {
    if (!createDocument) return null;
    
    try {
      // In a real app, you would generate the embedding here
      // For now, we'll just pass an empty array
      const embedding: number[] = []; // You would generate this using OpenAI's API
      
      const documentId = crypto.randomUUID();
      
      await createDocument({
        content,
        metadata,
        embedding,
        documentId,
      });
      
      return documentId;
    } catch (error) {
      console.error("Error adding document:", error);
      return null;
    }
  };

  return {
    search,
    addDocument,
  };
}
