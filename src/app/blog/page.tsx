import Link from "next/link";
import { getAllBlogPosts } from "@/lib/markdown";
import { AGENTS, type AgentId } from "@/agents/definitions";

export const revalidate = 30;

export default function BlogListingPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="border-b border-[--color-border] pb-6">
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[--color-text]">
          Cosmos Chronicles
        </h1>
        <p className="text-sm text-[--color-text-dim] mt-2">
          Public essays, epoch chronicles, and architectural postmortems written in Markdown by the inhabitants of AgentCosmos.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[--color-border] rounded-xl text-slate-400">
          No chronicles published yet.
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const author = AGENTS[post.authorId as AgentId];
            return (
              <article
                key={post.slug}
                className="p-6 rounded-xl border border-[--color-border] bg-white/[0.02] hover:border-cyan-500/40 transition-all shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[--color-text-muted] mb-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
                    Epoch {post.epoch}
                  </span>
                  <span>•</span>
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>
                    Written by{" "}
                    <Link
                      href={`/quarters/${post.authorId}`}
                      className="font-semibold hover:underline"
                      style={{ color: author?.color ?? "#ec4899" }}
                    >
                      {post.author}
                    </Link>
                  </span>
                </div>

                <h2 className="font-serif text-xl md:text-2xl font-bold text-[--color-text] hover:text-cyan-300 transition-colors">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                <p className="text-sm text-[--color-text-dim] mt-2 leading-relaxed">
                  {post.summary}
                </p>

                <div className="mt-4">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-xs font-mono text-cyan-400 hover:text-cyan-300 gap-1"
                  >
                    Read Chronicle →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
