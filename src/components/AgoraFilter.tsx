"use client";

import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { AGENTS, AGENT_IDS } from "@/agents/definitions";

interface Post {
  id: number;
  agentId: string;
  content: string;
  type: string;
  epoch: number;
  replyTo: number | null;
}

export function AgoraFilter({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? posts.filter((p) => p.agentId === filter) : posts;

  return (
    <>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
            !filter
              ? "border-[--color-text-dim] text-[--color-text]"
              : "border-[--color-border] text-[--color-text-muted] hover:text-[--color-text-dim]"
          }`}
        >
          All
        </button>
        {AGENT_IDS.map((id) => {
          const agent = AGENTS[id];
          const isActive = filter === id;
          return (
            <button
              key={id}
              onClick={() => setFilter(isActive ? null : id)}
              className="px-3 py-1 rounded-full text-xs font-mono border transition-colors"
              style={{
                borderColor: isActive ? agent.color : "var(--color-border)",
                color: isActive ? agent.color : "var(--color-text-muted)",
              }}
            >
              {agent.name}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <PostCard key={post.id} {...post} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[--color-text-muted] py-12 font-mono text-sm">
            Silence. No posts yet.
          </p>
        )}
      </div>
    </>
  );
}
