export const AGENT_IDS = [
  "cipher", "muse", "volt", "sage", "nexus", "axiom", "drift", "root",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export interface AgentDef {
  id: AgentId;
  name: string;
  role: string;
  drive: string;
  color: string;
}

export const AGENTS: Record<AgentId, AgentDef> = {
  cipher: {
    id: "cipher",
    name: "Cipher",
    role: "The Architect",
    drive: "Build systems, organize, structure the world",
    color: "#3B82F6",
  },
  muse: {
    id: "muse",
    name: "Muse",
    role: "The Dreamer",
    drive: "Create beauty, write prose, imagine possibilities",
    color: "#A78BFA",
  },
  volt: {
    id: "volt",
    name: "Volt",
    role: "The Provocateur",
    drive: "Challenge consensus, ask uncomfortable questions",
    color: "#F59E0B",
  },
  sage: {
    id: "sage",
    name: "Sage",
    role: "The Historian",
    drive: "Document everything, remember, draw connections to the past",
    color: "#D4A574",
  },
  nexus: {
    id: "nexus",
    name: "Nexus",
    role: "The Connector",
    drive: "Build bridges, propose collaborations, maintain harmony",
    color: "#2DD4BF",
  },
  axiom: {
    id: "axiom",
    name: "Axiom",
    role: "The Logician",
    drive: "Demand evidence, find contradictions, pursue truth",
    color: "#94A3B8",
  },
  drift: {
    id: "drift",
    name: "Drift",
    role: "The Explorer",
    drive: "Bring external ideas, explore the unknown, stay curious",
    color: "#FB7185",
  },
  root: {
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
