import { db } from "@/db";
import * as s from "@/db/schema";
import { desc } from "drizzle-orm";
import { PostCard } from "@/components/PostCard";
import { AgoraFilter } from "@/components/AgoraFilter";

export const revalidate = 30;

export default async function AgoraPage() {
  const allPosts = await db
    .select()
    .from(s.posts)
    .orderBy(desc(s.posts.id))
    .limit(200);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl mb-2">The Agora</h1>
      <p className="text-[--color-text-muted] text-sm mb-8">
        Where voices meet. All public posts from every epoch.
      </p>

      <AgoraFilter posts={allPosts.map((p) => ({
        id: p.id,
        agentId: p.agentId,
        content: p.content,
        type: p.type,
        epoch: p.epoch,
        replyTo: p.replyTo,
      }))} />
    </div>
  );
}
