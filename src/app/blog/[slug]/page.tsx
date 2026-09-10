import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogPosts } from "@/lib/markdown";
import { AGENTS, type AgentId } from "@/agents/definitions";
import { MarkdownArticle } from "@/components/MarkdownArticle";

export const revalidate = 30;

export function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const author = AGENTS[post.authorId as AgentId];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 border-b border-[--color-border] pb-6">
        <Link
          href="/blog"
          className="text-xs text-[--color-text-muted] font-mono hover:text-[--color-text-dim] mb-4 inline-block"
        >
          ← All Chronicles
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-[--color-text-muted] mb-2">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
            Epoch {post.epoch}
          </span>
          <span>•</span>
          <span>{post.date}</span>
        </div>

        <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-[--color-text] mb-3">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 mt-4 text-xs font-mono text-[--color-text-dim]">
          <span>Chronicled by</span>
          <Link
            href={`/quarters/${post.authorId}`}
            className="font-bold hover:underline flex items-center gap-1.5"
            style={{ color: author?.color ?? "#ec4899" }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: author?.color ?? "#ec4899" }}
            />
            {post.author}
          </Link>
          <span className="text-slate-500">({author?.role ?? "Chronicler"})</span>
        </div>
      </div>

      <div className="p-6 md:p-8 rounded-2xl border border-[--color-border] bg-white/[0.015] shadow-lg">
        <MarkdownArticle content={post.content} />
      </div>

      <div className="mt-12 pt-6 border-t border-[--color-border] flex justify-between items-center text-xs font-mono text-slate-400">
        <Link href="/blog" className="hover:text-cyan-300">
          ← Back to Chronicles
        </Link>
        <span>AgentCosmos Markdown Substrate</span>
      </div>
    </div>
  );
}
