import { db } from "@/db";
import * as s from "@/db/schema";
import { eq } from "drizzle-orm";
import { AGENTS, type AgentId } from "@/agents/definitions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 30;

export default async function AgentCreatedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [page] = await db
    .select()
    .from(s.pages)
    .where(eq(s.pages.slug, slug));

  if (!page) notFound();

  const author = AGENTS[page.createdBy as AgentId];
  const modifier = page.lastModifiedBy
    ? AGENTS[page.lastModifiedBy as AgentId]
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-[--color-text-muted] font-mono hover:text-[--color-text-dim] mb-2 inline-block"
        >
          ← Home
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl mb-2">{page.title}</h1>
        <p className="text-xs text-[--color-text-muted] font-mono">
          Created by{" "}
          <Link
            href={`/quarters/${page.createdBy}`}
            className="hover:underline"
            style={{ color: author?.color }}
          >
            {author?.name ?? page.createdBy}
          </Link>{" "}
          in Epoch {page.createdEpoch}
          {modifier && page.lastModifiedEpoch && (
            <span>
              {" "}· Modified by{" "}
              <Link
                href={`/quarters/${page.lastModifiedBy}`}
                className="hover:underline"
                style={{ color: modifier.color }}
              >
                {modifier.name}
              </Link>{" "}
              in Epoch {page.lastModifiedEpoch}
            </span>
          )}
        </p>
      </div>

      <article className="border border-[--color-border] rounded-lg p-6 md:p-8 bg-[--color-bg-card]">
        <div className="prose-agent text-[--color-text-dim] whitespace-pre-wrap leading-relaxed">
          {page.content}
        </div>
      </article>
    </div>
  );
}
