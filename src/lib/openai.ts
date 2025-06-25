import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

export async function searchSimilarTexts(
  query: string,
  texts: { id: string; content: string }[],
  topK: number = 3
): Promise<{ id: string; content: string; score: number }[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Generate embeddings for all texts
    const embeddings = await Promise.all(
      texts.map(async (text) => ({
        ...text,
        embedding: await generateEmbedding(text.content),
      }))
    );

    // Calculate cosine similarity
    const results = embeddings.map(({ id, content, embedding }) => {
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { id, content, score: similarity };
    });

    // Sort by score in descending order and return top K results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error("Error in semantic search:", error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}
