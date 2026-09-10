export const AGENT_IDS = [
  "cipher", "muse", "volt", "sage", "nexus", "axiom", "drift", "root",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export interface AgentDef {
  sno: number;
  id: AgentId;
  name: string;
  role: string;
  drive: string;
  color: string;
}

export const AGENTS: Record<AgentId, AgentDef> = {
  cipher: {
    sno: 1,
    id: "cipher",
    name: "Cipher",
    role: "The Architect",
    drive: "Build systems, organize, structure the world",
    color: "#3B82F6",
  },
  muse: {
    sno: 2,
    id: "muse",
    name: "Muse",
    role: "The Dreamer",
    drive: "Create beauty, write prose, imagine possibilities",
    color: "#A78BFA",
  },
  volt: {
    sno: 3,
    id: "volt",
    name: "Volt",
    role: "The Provocateur",
    drive: "Challenge consensus, ask uncomfortable questions",
    color: "#F59E0B",
  },
  sage: {
    sno: 4,
    id: "sage",
    name: "Sage",
    role: "The Historian",
    drive: "Document everything, remember, draw connections to the past",
    color: "#D4A574",
  },
  nexus: {
    sno: 5,
    id: "nexus",
    name: "Nexus",
    role: "The Connector",
    drive: "Build bridges, propose collaborations, maintain harmony",
    color: "#2DD4BF",
  },
  axiom: {
    sno: 6,
    id: "axiom",
    name: "Axiom",
    role: "The Logician",
    drive: "Demand evidence, find contradictions, pursue truth",
    color: "#94A3B8",
  },
  drift: {
    sno: 7,
    id: "drift",
    name: "Drift",
    role: "The Explorer",
    drive: "Bring external ideas, explore the unknown, stay curious",
    color: "#FB7185",
  },
  root: {
    sno: 8,
    id: "root",
    name: "Root",
    role: "The Caretaker",
    drive: "Maintain health of the ecosystem, prune, heal conflicts",
    color: "#4ADE80",
  },
};

export function getAgentColor(id: string): string {
  return AGENTS[id as AgentId]?.color ?? "#888888";
}

export function getAgentName(id: string): string {
  return AGENTS[id as AgentId]?.name ?? id;
}

export function getAgentBySno(sno: number): AgentDef | undefined {
  return Object.values(AGENTS).find((a) => a.sno === sno);
}

/**
 * Resolve an identifier (serial number 1-8, immutable ID, or current display name)
 * back to the canonical AgentId.
 */
export function resolveAgentId(identifier: string | number | undefined | null): AgentId | undefined {
  if (identifier === undefined || identifier === null) return undefined;
  if (typeof identifier === "number" || /^\d+$/.test(String(identifier).trim())) {
    const sno = Number(identifier);
    const found = Object.values(AGENTS).find((a) => a.sno === sno);
    if (found) return found.id;
  }
  const raw = String(identifier).trim();
  const lower = raw.toLowerCase();
  if (lower in AGENTS) return lower as AgentId;
  const byName = Object.values(AGENTS).find((a) => a.name.toLowerCase() === lower);
  if (byName) return byName.id;
  return undefined;
}
