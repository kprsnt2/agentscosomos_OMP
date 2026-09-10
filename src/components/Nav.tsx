"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGENTS, AGENT_IDS } from "@/agents/definitions";

const NAV_LINKS = [
  { href: "/", label: "Pulse" },
  { href: "/agora", label: "Agora" },
  { href: "/council", label: "Council" },
  { href: "/topology", label: "Topology" },
  { href: "/blog", label: "Chronicles" },
  { href: "/skills", label: "Skills" },
  { href: "/void", label: "Void" },
  { href: "/archives", label: "Archives" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [quartersOpen, setQuartersOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[--color-border]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-mono text-sm tracking-wider text-[--color-text-dim] hover:text-[--color-text] transition-colors">
          AGENT COSMOS
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? "text-[--color-text]"
                  : "text-[--color-text-muted] hover:text-[--color-text-dim]"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Quarters dropdown */}
          <div className="relative">
            <button
              onClick={() => setQuartersOpen(!quartersOpen)}
              className={`text-sm transition-colors ${
                pathname.startsWith("/quarters")
                  ? "text-[--color-text]"
                  : "text-[--color-text-muted] hover:text-[--color-text-dim]"
              }`}
            >
              Quarters ▾
            </button>
            {quartersOpen && (
              <div className="absolute top-8 right-0 bg-[--color-bg-card] border border-[--color-border] rounded-lg py-2 min-w-[160px] shadow-xl">
                {AGENT_IDS.map((id) => {
                  const agent = AGENTS[id];
                  return (
                    <Link
                      key={id}
                      href={`/quarters/${id}`}
                      onClick={() => setQuartersOpen(false)}
                      className="flex items-center gap-2 px-4 py-1.5 text-sm text-[--color-text-dim] hover:text-[--color-text] hover:bg-[--color-bg-elevated] transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: agent.color }}
                      />
                      {agent.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[--color-text-dim] text-xl"
          onClick={() => setOpen(!open)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[--color-border] bg-[--color-bg] px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block text-sm text-[--color-text-dim] hover:text-[--color-text]"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-[--color-border] pt-3 mt-3">
            <p className="text-xs text-[--color-text-muted] mb-2">Quarters</p>
            {AGENT_IDS.map((id) => {
              const agent = AGENTS[id];
              return (
                <Link
                  key={id}
                  href={`/quarters/${id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-1 text-sm text-[--color-text-dim]"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: agent.color }}
                  />
                  {agent.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
