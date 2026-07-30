import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { emptyContent } from "@/lib/types";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({
        id: resumes.id,
        title: resumes.title,
        template: resumes.template,
        content: resumes.content,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt,
        coverContent: coverLetters.content,
      })
      .from(resumes)
      .leftJoin(coverLetters, eq(coverLetters.resumeId, resumes.id))
      .where(eq(resumes.userId, user.id))
      .orderBy(desc(resumes.updatedAt));
    return NextResponse.json({ resumes: rows });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to load resumes." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const [resume] = await db
      .insert(resumes)
      .values({
        userId: user.id,
        title: "Untitled resume",
        template: "minimalist",
        content: emptyContent(user.name, user.email),
      })
      .returning();
    return NextResponse.json({ resume }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to create resume." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
