import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (!UUID_RE.test(id)) throw new ApiError(400, "Invalid resume id.");

    const [source] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
      .limit(1);
    if (!source) throw new ApiError(404, "Resume not found.");

    const [copy] = await db
      .insert(resumes)
      .values({
        userId: user.id,
        title: `${source.title} (Copy)`.slice(0, 120),
        template: source.template,
        content: source.content,
      })
      .returning();

    // Carry the cover letter over too, if one exists.
    const [cover] = await db.select().from(coverLetters).where(eq(coverLetters.resumeId, source.id)).limit(1);
    if (cover) {
      await db.insert(coverLetters).values({
        resumeId: copy.id,
        userId: user.id,
        company: cover.company,
        role: cover.role,
        jobDescription: cover.jobDescription,
        tone: cover.tone,
        content: cover.content,
      });
    }

    return NextResponse.json({ resume: copy }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to duplicate resume." }, { status: 500 });
  }
}
