import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { db } from "@/db";
import * as s from "@/db/schema";
import { nowISO } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, content } = body as {
      password?: string;
      content?: string;
    };

    if (!password || password !== config.auth.adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    await db.insert(s.suggestions).values({
      content: content.trim(),
      createdAt: nowISO(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Suggestion submission failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
