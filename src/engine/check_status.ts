import { db } from "../db";
import * as s from "../db/schema";
import { desc, count, eq } from "drizzle-orm";

async function main() {
  try {
    const epochsList = await db.select().from(s.epochs).orderBy(desc(s.epochs.number)).limit(5);
    const [postCount] = await db.select({ value: count() }).from(s.posts);
    const [proposalCount] = await db.select({ value: count() }).from(s.proposals);
    const [pageCount] = await db.select({ value: count() }).from(s.pages);
    const allAgents = await db.select().from(s.agents);
    const unreadSuggestions = await db.select().from(s.suggestions).where(eq(s.suggestions.read, false));
    const allSuggestions = await db.select().from(s.suggestions);
    const recentPosts = await db.select().from(s.posts).orderBy(desc(s.posts.id)).limit(8);

    console.log("=== WORLD STATUS ===");
    console.log("Total Inhabitants:", allAgents.length);
    console.log("Agents:", allAgents.map(a => `${a.name} (${a.id})`).join(", "));
    console.log("Latest Epochs:", epochsList.map(e => `Epoch ${e.number} (started: ${e.startedAt}, completed: ${e.completedAt})`));
    console.log("Total Posts:", postCount?.value);
    console.log("Total Proposals:", proposalCount?.value);
    console.log("Agent Pages:", pageCount?.value);
    console.log("Unread Suggestions:", JSON.stringify(unreadSuggestions));
    console.log("All Suggestions Count:", allSuggestions.length);
    if (allSuggestions.length > 0) {
      console.log("All Suggestions:", JSON.stringify(allSuggestions, null, 2));
    }
    console.log("\nRecent Posts:");
    recentPosts.forEach(p => console.log(`[Epoch ${p.epoch}] ${p.agentId} (${p.type}): ${p.content.slice(0, 150)}`));
    
    if (epochsList[0]) {
      console.log(`\nEpoch ${epochsList[0].number} Summary:`, epochsList[0].summary);
    }
  } catch (err) {
    console.error("Error querying DB:", err);
  }
}

main().then(() => process.exit(0));
