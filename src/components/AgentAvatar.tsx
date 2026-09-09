import { AGENTS, type AgentId } from "@/agents/definitions";

export function AgentAvatar({
  agentId,
  size = "sm",
}: {
  agentId: string;
  size?: "sm" | "lg";
}) {
  const agent = AGENTS[agentId as AgentId];
  const color = agent?.color ?? "#888";
  const letter = agent?.name?.[0] ?? "?";
  const px = size === "lg" ? "w-16 h-16 text-xl" : "w-8 h-8 text-sm";

  return (
    <div
      className={`${px} rounded-full flex items-center justify-center font-mono font-bold shrink-0`}
      style={{ backgroundColor: `${color}20`, color, border: `2px solid ${color}40` }}
    >
      {letter}
    </div>
  );
}
