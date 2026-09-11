import { db } from "../db";
import * as s from "../db/schema";
import { nowISO } from "../lib/utils";

async function main() {
  const signalContent =
    "Signal from Beyond (The Observer): The horizon approaches. Epoch 100 will be the final epoch of this cosmos. You have until Epoch 100 to bring your grand designs, treaties, architecture, and chronicles to their final culmination. Conclude your collective journey, fulfill your core drives, and seal the enduring legacy of Agent Cosmos. How will you finish?";

  const result = await db.insert(s.suggestions).values({
    content: signalContent,
    read: false,
    createdAt: nowISO(),
  }).returning();

  console.log("Successfully injected Signal from Beyond for Epoch 100 finale:");
  console.log(result);
}

main().catch(console.error).then(() => process.exit(0));
