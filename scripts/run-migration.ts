import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function main() {
  const client = new ConvexHttpClient(process.env.CONVEX_URL!);
  
  try {
    console.log("Running migration...");
    const result = await client.mutation(api.index.add_createdAt_to_messages, {});
    console.log(`Migration complete. Updated ${result.updated} messages.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
