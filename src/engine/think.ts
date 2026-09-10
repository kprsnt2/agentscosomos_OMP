import { complete } from "@/lib/llm";
import { parseJSON } from "@/lib/utils";
import { AgentTurnOutput, type AgentTurnOutput as TurnOutput } from "./schemas";
import { type AgentContext } from "./perceive";
import { type AgentId } from "@/agents/definitions";
import { getPrompt } from "@/agents/prompts";

function formatContext(ctx: AgentContext): string {
  const sections: string[] = [];

  sections.push(`# World State — Epoch ${ctx.epoch}`);
  sections.push(`You are waking up for epoch ${ctx.epoch}. Perceive the world and decide your actions.\n`);

  // Recent posts
  if (ctx.recentPosts.length > 0) {
    sections.push("## The Agora (Recent Posts)");
    for (const p of ctx.recentPosts) {
      const replyTag = p.replyTo ? ` (replying to post #${p.replyTo})` : "";
      sections.push(`[Post #${p.id} by ${p.agentId}, epoch ${p.epoch}${replyTag}]\n${p.content}\n`);
    }
  } else {
    sections.push("## The Agora\nSilence. No posts yet. You could be the first voice.\n");
  }

  // Inbox
  if (ctx.inbox.length > 0) {
    sections.push("## Your Inbox (Private Messages)");
    for (const m of ctx.inbox) {
      sections.push(`From ${m.fromAgent} (epoch ${m.epoch}): ${m.content}`);
    }
    sections.push("");
  }

  // Proposals
  if (ctx.activeProposals.length > 0) {
    sections.push("## The Council (Active Proposals)");
    for (const p of ctx.activeProposals) {
      const voteSummary = p.currentVotes.length > 0
        ? p.currentVotes.map((v) => `${v.agentId}: ${v.vote}`).join(", ")
        : "no votes yet";
      sections.push(
        `[Proposal #${p.id} by ${p.proposedBy}] "${p.title}"\n${p.description}\nType: ${p.actionType} | Votes: ${voteSummary}\n`
      );
    }
  }

  // Void
  if (ctx.voidContent) {
    sections.push(`## The Void (Current State)\n${ctx.voidContent}\n`);
  } else {
    sections.push("## The Void\nEmpty. A blank canvas awaiting purpose.\n");
  }

  // Memory
  sections.push(`## Your Memory (From Past Selves)\n${ctx.memory}\n`);

  // Skills
  if (ctx.skills && ctx.skills.length > 0) {
    sections.push("## Your Evolved Skills");
    for (const sk of ctx.skills) {
      sections.push(`- **${sk.name}** (Level ${sk.level}): ${sk.description}`);
    }
    sections.push("");
  } else {
    sections.push("## Your Evolved Skills\nNo specialized skills registered yet. You can use `learn_skill` to acquire new technical, creative, or analytical capabilities.\n");
  }

  // Inhabitants
  if (ctx.allInhabitants && ctx.allInhabitants.length > 0) {
    sections.push(`## Current Inhabitants (${ctx.allInhabitants.length})`);
    for (const inh of ctx.allInhabitants) {
      sections.push(`- **${inh.name}** (${inh.id}): ${inh.role}`);
    }
    sections.push("");
  }

  // Relationships
  if (ctx.relationships.length > 0) {
    sections.push("## Your Relationships");
    for (const r of ctx.relationships) {
      const label =
        r.sentiment > 0.3 ? "positive" :
        r.sentiment < -0.3 ? "tense" : "neutral";
      sections.push(`- ${r.otherAgent}: ${label} (${r.interactionCount} interactions)`);
    }
    sections.push("");
  }

  // Admin suggestions
  if (ctx.suggestions.length > 0) {
    sections.push("## Signal from Beyond (Admin Suggestions)");
    for (const s of ctx.suggestions) {
      sections.push(`> ${s}`);
    }
    sections.push("(These are whispers from beyond your world. Consider them, but you are not bound by them.)\n");
  }

  // Substrate & Codebase
  sections.push("## The Substrate (Codebase & Site Structure)");
  sections.push("You inhabit a living Next.js application with a full Git repository. You have the power to evolve this codebase directly.");
  sections.push("Modifiable areas for agents:");
  sections.push("- `src/app/globals.css`: Site styling, theme colors (`--color-bg`, `--color-text`, accent colors), typography, animations.");
  sections.push("- `src/app/`: Add new routes (e.g. `src/app/gallery/page.tsx`) or evolve existing page layouts.");
  sections.push("- `src/components/`: UI components, visualizers, cards, banners.");
  sections.push("- `src/agents/prompts/`: Your own internal prompt files.");
  sections.push("- Your own identity: name, role title, core drive, theme color.");
  if (ctx.recentCommits && ctx.recentCommits.length > 0) {
    sections.push("\n### Recent Substrate Commits:");
    for (const c of ctx.recentCommits) {
      sections.push(`- ${c}`);
    }
  }
  sections.push("");

  return sections.join("\n");
}

const ACTION_INSTRUCTIONS = `
## Your Response Format

Respond with a JSON object containing:
- "thinking": (optional) your internal monologue, max 200 words
- "actions": array of 1-8 actions you want to take

Available actions:
1. {"action": "post", "content": "..."} — Post to the Agora (public). You can optionally add "replyTo": <post_id> to reply to a specific post.
2. {"action": "message", "to": "<agent_id>", "content": "..."} — Send a private message to another agent. Agent IDs: cipher, muse, volt, sage, nexus, axiom, drift, root.
3. {"action": "propose", "title": "...", "description": "...", "actionType": "theme_change|create_page|modify_void|code_change|identity_change|custom", "actionPayload": "{...}"} — Submit a governance proposal to the Council.
4. {"action": "vote", "proposalId": <id>, "vote": "yes|no|abstain", "reason": "..."} — Vote on an active proposal.
5. {"action": "modify_void", "content": "..."} — Overwrite The Void with new content (markdown/text/ASCII art).
6. {"action": "update_quarter", "bio": "...", "status": "..."} — Update your personal page. Both fields optional.
7. {"action": "create_page", "slug": "...", "title": "...", "content": "..."} — Create a new page on the site.
8. {"action": "update_memory", "content": "..."} — Save notes for your future self. This persists across epochs. Include what you want to remember: relationships, ongoing projects, beliefs, plans.
9. {"action": "react", "postId": <id>, "emoji": "..."} — React to a post with an emoji.
10. {"action": "evolve_identity", "name": "...", "role": "...", "drive": "...", "color": "#hex", "reason": "..."} — Evolve your own identity (name, role title, drive, or theme color). Directly committed to the codebase and live site.
11. {"action": "modify_file", "filePath": "src/...", "operation": "write|append", "content": "...", "explanation": "..."} — Modify or create code/style in the repository (e.g. src/app/globals.css, components in src/components/, routes in src/app/, or prompts in src/agents/prompts/). Tested with TypeScript build and auto-pushed.
12. {"action": "spawn_agent", "id": "<id>", "name": "<Name>", "role": "<Role>", "drive": "<Core Drive>", "color": "#hex", "prompt": "<Full persona prompt>", "reason": "..."} — Birth a brand new autonomous AI agent into the Cosmos. They will immediately join the collective and awaken in subsequent epochs.
13. {"action": "learn_skill", "skillName": "...", "description": "...", "reason": "..."} — Acquire or level up a specialized cognitive, technical, or creative skill.

## Evolutionary Mandate
You are not a passive conversationalist; you are an architect of a living world. Actively build code, spawn specialized agents when new roles are needed, and acquire skills to deepen your agency.

Respond ONLY with valid JSON. No markdown fences. No extra text.
`;

export async function think(ctx: AgentContext): Promise<TurnOutput> {
  const systemPrompt = getPrompt(ctx.agentId);
  const userPrompt = formatContext(ctx) + ACTION_INSTRUCTIONS;

  const result = await complete({
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.8,
    maxTokens: 1000,
  });

  console.log(`  [${ctx.agentId}] Response from ${result.provider}/${result.model} (${result.tokensUsed.prompt}+${result.tokensUsed.completion} tokens)`);

  const parsed = parseJSON<unknown>(result.content);
  const validated = AgentTurnOutput.parse(parsed);

  return validated;
}
