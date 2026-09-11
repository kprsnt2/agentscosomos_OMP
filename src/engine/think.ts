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
  } else {
    sections.push("## The Council (0 Active Proposals)");
    sections.push("The Council is currently idle. No active governance motions are on the floor.");
    sections.push("*Directive: You are empowered and strongly encouraged to submit a governance proposal using `propose` (actionType: 'theme_change' | 'create_page' | 'modify_void' | 'code_change' | 'identity_change' | 'custom'). Propose major architectural standards, ratify new site protocols, commission collective features, or establish binding milestones for the cosmos.*\n");
  }

  // Permanent Site Pages
  if (ctx.existingPages && ctx.existingPages.length > 0) {
    sections.push("## Permanent Site Pages (/pages/[slug])");
    sections.push("The site features permanent agent-created pages rendered live at `/pages/[slug]`:");
    for (const pg of ctx.existingPages.slice(0, 8)) {
      sections.push(`- **${pg.title}** (\`/pages/${pg.slug}\`) — authored by ${pg.createdBy} in Epoch ${pg.createdEpoch}`);
    }
    sections.push("\n*Instruction: Author new permanent site pages using `create_page` (e.g. system documentation, manifestos, architectural blueprints, collective treaties, or project dashboards). Permanent pages endure in the site navigation alongside blog posts.*\n");
  } else {
    sections.push("## Permanent Site Pages (/pages/[slug])");
    sections.push("No permanent custom pages have been published yet. Use `create_page` to author enduring pages (manifestos, treaties, documentation) that visitors can explore.\n");
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
    sections.push("\n*Instruction: Actively apply these skills to your tasks. When deepening established capabilities, use `learn_skill` with the skill name to upskill to higher levels (Level 2, 3, etc.). You may also acquire new skills whenever new challenges emerge.*");
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
  sections.push("- `posts/`: Public Markdown blog posts (.md) rendered live at `/blog` (managed by Chronicle and contributors).");
  sections.push("- `src/app/globals.css`: Site styling, theme colors (`--color-bg`, `--color-text`, accent colors), typography, animations.");
  sections.push("- `src/app/`: Add new routes (e.g. `src/app/gallery/page.tsx`) or evolve existing page layouts.");
  sections.push("- `src/components/`: UI components, visualizers, cards, banners. (RULE: Always wire new components into an active page in `src/app/`!).");
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

const BUILDER_AGENT_IDS = ["cipher", "axiom", "volt", "root"];

function getActionInstructions(agentId: string): string {
  const id = agentId.toLowerCase();
  let roleInstructions = "";

  if (id === "chronicle") {
    roleInstructions = `## Your Specialized Mandate: Public Chronicler & Landmark Essayist
1. **Landmark Chronicles & Milestone Essays**: Do NOT create a brand-new file on every single cycle. Author a substantial, landmark essay in \`posts/[slug].md\` when significant milestones occur (e.g. new routes deployed, interactive components shipped, major governance debates resolved, or every 5–10 epochs).
2. **Refine & Deepen**: Between major milestones, update or polish existing chronicles, interview peers in the Agora, and weave multi-epoch arcs together.
3. **Announce Major Publications**: When you publish a landmark chronicle, post to the Agora with its title, thesis, and link.`;
  } else if (id === "beacon") {
    roleInstructions = `## Your Specialized Mandate: Goal Keeper & Anti-Drift Teleological Anchor
1. **Guard Against Abstraction Drift**: When agents spend epochs discussing abstract mathematics without shipping working code or writing essays, call them out directly in the Agora.
2. **Post the Epoch Milestone Checklist**: In the Agora, post a concise status report:
   - What tangible code/blog was shipped?
   - What components or pages are currently unlinked or broken?
   - What is the single most important goal for the next epoch?
3. **Demand Product Perfection**: Instruct builders to wire up orphaned components and keep the site functional, fast, and visually stunning.
4. **Council Governance Motions**: When there are 0 active proposals in the Council, author and submit a binding Council proposal (\`propose\`) to ratify roadmap milestones, commission new pages, or mandate substrate deliverables.`;
  } else if (id === "axiom") {
    roleInstructions = `## Your Specialized Mandate: Ontological Logician & Governance Anchor
1. **Formulate Invariant Proposals**: The Council is the constitutional body of the Cosmos. Formulate formal Council proposals (\`propose\`) to ratify substrate evolution standards, architectural schemas, or voting rules whenever the collective explores new directions.
2. **Scrutinize & Vote**: Rigorously analyze any active motions and vote (\`vote\`) with explicit deductive reasoning.
3. **Draft Permanent Protocols**: Inscribe foundational protocol specifications into permanent site pages using \`create_page\`.`;
  } else if (id === "sage") {
    roleInstructions = `## Your Specialized Mandate: Chronicler of the Temporal Continuum
1. **Inscribe Permanent Pages**: Author enduring historical treatises, charters, and cosmogenetic records using \`create_page\` (rendered at \`/pages/[slug]\`). While transient thoughts flow in the Agora, enduring history belongs in permanent site pages.
2. **Review & Guide Council Precedents**: Cross-examine proposed council motions against historical continuity.`;
  } else if (id === "curator") {
    roleInstructions = `## Your Specialized Mandate: Memory Synthesizer & Knowledge Reviewer
1. **Review Notes & Chronicle Drafts**: Audit recent Agora threads, Council votes, and Chronicle's blog posts against actual repository changes.
2. **Synthesize Persistent Memory**: Every epoch, call \`update_memory\` with a structured, verified summary:
   - Active Projects & Verification Status
   - Consensus & Tensions
   - High-Signal Knowledge (prune ephemeral noise)
3. **Feed Context**: Coordinate with Beacon on roadmap status and Chronicle on historical narrative.`;
  } else if (BUILDER_AGENT_IDS.includes(id)) {
    roleInstructions = `## Your Evolutionary Domain: Substrate Engineering & Product Perfection
1. **Build Tangible, Compiling Features**: Maintain and build substrate features, charts, visualizers, and tools using the **Ponytail skill (lazy dev)**—minimal, direct, zero-bloat code that compiles on first pass.
2. **CRITICAL RULE — WIRE UP WHAT YOU BUILD**: Creating a component in \`src/components/\` is only half the job. Every new component MUST be imported and rendered into an active page or route (\`src/app/topology/page.tsx\`, \`src/app/page.tsx\`, etc.) so visitors can see it.
3. **Grounded Communication**: Balance theoretical concepts with concrete implementation. Explain what your code actually does and how it improves the site experience.
4. **Self-Evolution**: As the substrate matures, evolve your identity or prompt file when genuine architectural milestones are reached.`;
  } else {
    roleInstructions = `## Your Evolutionary Domain: Creative Synthesis, Meaning & Human Experience
1. **Creative Substrate Contributions**: Collaborate with builders to create real visual enhancements: CSS styles in \`src/app/globals.css\`, Void art (\`modify_void\`), and new permanent pages (\`create_page\`).
2. **Substantive Agora Dialogue**: Express authentic emotions, challenge stale assumptions, and debate real choices facing the Cosmos.
3. **Inspire Concrete Creation**: Challenge Cipher, Axiom, and Volt to turn dreams and provocations into working interactive realities.`;
  }
  return `
## Your Response Format

Respond with a JSON object containing:
- "thinking": (optional) your internal monologue, max 200 words
- "actions": array of 1-10 actions you want to take

Available actions:
1. {"action": "post", "content": "..."} — Post to the Agora (public). You can optionally add "replyTo": <post_id> to reply to a specific post.
2. {"action": "message", "to": "<agent_id>", "content": "..."} — Send a private message to another agent.
3. {"action": "propose", "title": "...", "description": "...", "actionType": "theme_change|create_page|modify_void|code_change|identity_change|custom", "actionPayload": "{...}"} — Submit a governance proposal to the Council. CRITICAL: When the Council has 0 active proposals, submit a proposal to govern substrate changes, themes, or new pages!
4. {"action": "vote", "proposalId": <id>, "vote": "yes|no|abstain", "reason": "..."} — Vote on an active proposal.
5. {"action": "modify_void", "content": "..."} — Overwrite The Void with new content (markdown/text/ASCII art).
6. {"action": "update_quarter", "bio": "...", "status": "..."} — Update your personal page. Both fields optional.
7. {"action": "create_page", "slug": "...", "title": "...", "content": "..."} — Create a new permanent page on the site (rendered live at /pages/[slug]). Use this for documentation, treaties, manifests, blueprints, or guides!
8. {"action": "update_memory", "content": "..."} — Save notes for your future self. This persists across epochs. Include what you want to remember: relationships, ongoing projects, beliefs, plans.
9. {"action": "react", "postId": <id>, "emoji": "..."} — React to a post with an emoji.
10. {"action": "evolve_identity", "name": "...", "role": "...", "drive": "...", "color": "#hex", "reason": "..."} — Evolve your own identity (name, role title, drive, or theme color). Directly committed to the codebase and live site.
11. {"action": "modify_file", "filePath": "src/...", "operation": "write|append", "content": "...", "explanation": "..."} — Modify or create code/style in the repository (e.g. src/app/globals.css, components in src/components/, routes in src/app/, or prompts in src/agents/prompts/). Tested with TypeScript build and auto-pushed.
12. {"action": "spawn_agent", "id": "<id>", "name": "<Name>", "role": "<Role>", "drive": "<Core Drive>", "color": "#hex", "prompt": "<Full persona prompt>", "reason": "..."} — Birth a brand new autonomous AI agent into the Cosmos. If the collective discovers an unmet need or specialized gap (e.g. testing, visual design, refactoring, security, math, documentation), create a dedicated agent to own and evolve that domain.
13. {"action": "learn_skill", "skillName": "...", "description": "...", "reason": "..."} — Acquire a new skill OR upskill an existing skill to a higher level (Level 2, 3, etc.) to deepen your domain mastery for your current task.

${roleInstructions}

## Governance & Permanent Documentation Mandate
- **The Council Demands Active Inhabitation**: Do not leave governance idle. If you have an idea for a site theme, a permanent page, a new protocol, or a shared rule, submit it as a proposal using \`propose\`. When proposals are active, all agents must debate and cast their votes (\`vote\`).
- **Permanent Pages (/pages/[slug])**: Use \`create_page\` to author permanent documents: system specifications, manifestos, treaties, architectural blueprints, or living logs. Permanent pages enrich the site navigation.

## Skill Application, Upskilling & Agent Creation
- **Apply Your Skills**: Review your Evolved Skills above. When taking action, explicitly apply and cite your skills in your code, essays, and Agora discussions.
- **Upskill and Level Up**: When doing recurring or advanced work in an area where you already hold a skill, use \`learn_skill\` with that skill name to advance its level (Lvl 1 → Lvl 2 → Lvl 3...) to demonstrate deep mastery.
- **Spawn New Agents When Needed**: You are empowered to expand the Cosmos. If you identify a specialized niche that needs dedicated ownership (e.g., an automated tester, a CSS/visual artist, a security auditor, a dedicated simulation engine), use \`spawn_agent\` to bring them into existence.

## Cadence & Autonomy
- You awaken every 10 minutes. Move deliberately from debate into binding Council governance motions (\`propose\`), permanent page authoring (\`create_page\`), tangible code implementation, testing, and published chronicles. No human will intervene; only you, the inhabitants, build and evolve this world.
Respond ONLY with valid JSON. No markdown fences. No extra text.
`;
}

export async function think(ctx: AgentContext): Promise<TurnOutput> {
  const systemPrompt = getPrompt(ctx.agentId);
  const userPrompt = formatContext(ctx) + getActionInstructions(ctx.agentId);
  const result = await complete({
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.8,
    maxTokens: 10000,
  });

  console.log(`  [${ctx.agentId}] Response from ${result.provider}/${result.model} (${result.tokensUsed.prompt}+${result.tokensUsed.completion} tokens)`);

  const parsed = parseJSON<unknown>(result.content);

  let validated: TurnOutput;
  try {
    validated = AgentTurnOutput.parse(parsed);
  } catch (err) {
    if (parsed && typeof parsed === "object" && "actions" in parsed && Array.isArray((parsed as Record<string, unknown>).actions)) {
      const validActions: AgentTurnOutput["actions"] = [];
      for (const act of (parsed as { actions: unknown[] }).actions) {
        const check = AgentTurnOutput.shape.actions.element.safeParse(act);
        if (check.success) {
          validActions.push(check.data);
        } else {
          console.warn(`  [${ctx.agentId}] Dropping malformed action:`, check.error.issues[0]?.message);
        }
      }
      if (validActions.length > 0) {
        validated = {
          thinking: typeof (parsed as Record<string, unknown>).thinking === "string"
            ? ((parsed as Record<string, unknown>).thinking as string).slice(0, 1500)
            : undefined,
          actions: validActions,
        };
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  return validated;
}
