import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TONES = ["professional", "friendly", "bold", "confident", "modern"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (!UUID_RE.test(id)) throw new ApiError(400, "Invalid resume id.");

    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
      .limit(1);
    if (!resume) throw new ApiError(404, "Resume not found.");

    const body = (await req.json()) as {
      company?: string;
      role?: string;
      jobDescription?: string;
      tone?: string;
      content?: string;
    };

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.company === "string") values.company = body.company.slice(0, 200);
    if (typeof body.role === "string") values.role = body.role.slice(0, 200);
    if (typeof body.jobDescription === "string") values.jobDescription = body.jobDescription.slice(0, 12000);
    if (body.tone && VALID_TONES.includes(body.tone)) values.tone = body.tone;
    if (typeof body.content === "string") values.content = body.content.slice(0, 20000);

    const [existing] = await db.select().from(coverLetters).where(eq(coverLetters.resumeId, id)).limit(1);
    const row = existing
      ? (await db.update(coverLetters).set(values).where(eq(coverLetters.resumeId, id)).returning())[0]
      : (await db
          .insert(coverLetters)
          .values({ resumeId: id, userId: user.id, company: "", role: "", jobDescription: "", tone: "professional", content: "", ...values })
          .returning())[0];

    return NextResponse.json({ cover: row });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to save cover letter." }, { status: 500 });
  }
}
