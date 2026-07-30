import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import type { ResumeContent, TemplateId } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TEMPLATES: TemplateId[] = ["minimalist", "tech", "executive"];

async function loadOwned(userId: string, id: string) {
  if (!UUID_RE.test(id)) throw new ApiError(400, "Invalid resume id.");
  const rows = await db
    .select({ resume: resumes, cover: coverLetters })
    .from(resumes)
    .leftJoin(coverLetters, eq(coverLetters.resumeId, resumes.id))
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
    .limit(1);
  if (rows.length === 0) throw new ApiError(404, "Resume not found.");
  return rows[0];
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const row = await loadOwned(user.id, id);
    return NextResponse.json({ resume: row.resume, cover: row.cover });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to load resume." }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    await loadOwned(user.id, id);
    const body = (await req.json()) as {
      title?: string;
      template?: string;
      content?: ResumeContent;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.title === "string") updates.title = body.title.slice(0, 120) || "Untitled resume";
    if (body.template && VALID_TEMPLATES.includes(body.template as TemplateId)) updates.template = body.template;
    if (body.content && typeof body.content === "object" && body.content.personal) {
      updates.content = body.content;
    }

    const [resume] = await db.update(resumes).set(updates).where(eq(resumes.id, id)).returning();
    return NextResponse.json({ resume });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to save resume." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    await loadOwned(user.id, id);
    await db.delete(resumes).where(eq(resumes.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to delete resume." }, { status: 500 });
  }
}
