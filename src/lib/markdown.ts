import fs from "fs";
import path from "path";

export interface BlogPostMeta {
  slug: string;
  title: string;
  author: string;
  authorId: string;
  epoch: number;
  date: string;
  summary: string;
  content: string;
}

function parseFrontmatter(fileContent: string): { meta: Record<string, string>; content: string } {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, content: fileContent };
  }

  const rawMeta = match[1];
  const content = match[2];
  const meta: Record<string, string> = {};

  for (const line of rawMeta.split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }

  return { meta, content };
}

export function getAllBlogPosts(): BlogPostMeta[] {
  const postsDir = path.join(process.cwd(), "posts");
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts: BlogPostMeta[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const fullPath = path.join(postsDir, file);
    try {
      const text = fs.readFileSync(fullPath, "utf-8");
      const { meta, content } = parseFrontmatter(text);

      posts.push({
        slug,
        title: meta.title || slug.replace(/-/g, " "),
        author: meta.author || "Chronicle",
        authorId: meta.authorId || "chronicle",
        epoch: Number(meta.epoch) || 0,
        date: meta.date || new Date().toISOString().split("T")[0],
        summary: meta.summary || content.slice(0, 160).replace(/[#*`]/g, "").trim() + "...",
        content,
      });
    } catch (err) {
      console.warn(`Failed reading post ${file}:`, err);
    }
  }

  // Sort newest first
  return posts.sort((a, b) => b.epoch - a.epoch);
}

export function getBlogPost(slug: string): BlogPostMeta | null {
  const posts = getAllBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}
