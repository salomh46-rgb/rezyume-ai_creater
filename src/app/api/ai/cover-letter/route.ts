import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { generateCoverLetter } from "@/lib/ai";
import { ApiError, requireUser } from "@/lib/auth";
import { jsonResponse, preflight, rateLimit } from "@/lib/security";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const user = await requireUser();
    const body = (await req.json()) as {
      resumeId?: string;
      company?: string;
      role?: string;
      jobDescription?: string;
      tone?: string;
      lang?: string;
    };
    if (!body.resumeId || !UUID_RE.test(body.resumeId)) throw new ApiError(400, "Invalid resume id.");

    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, body.resumeId), eq(resumes.userId, user.id)))
      .limit(1);
    if (!resume) throw new ApiError(404, "Resume not found.");

    const company = (body.company ?? "").trim();
    const role = (body.role ?? "").trim() || resume.content.targetJobTitle;
    const jobDescription = body.jobDescription ?? "";
    const tone = body.tone ?? "professional";

    if (!company && !jobDescription) {
      throw new ApiError(400, "Add a company name or paste a job description first.");
    }

    const { content, provider } = await generateCoverLetter({
      resume: resume.content,
      company,
      role,
      jobDescription,
      tone,
      lang: body.lang,
    });

    const [existing] = await db.select().from(coverLetters).where(eq(coverLetters.resumeId, resume.id)).limit(1);
    const cover = existing
      ? (await db
          .update(coverLetters)
          .set({ company, role, jobDescription, tone, content, updatedAt: new Date() })
          .where(eq(coverLetters.resumeId, resume.id))
          .returning())[0]
      : (await db
          .insert(coverLetters)
          .values({ resumeId: resume.id, userId: user.id, company, role, jobDescription, tone, content })
          .returning())[0];

    return jsonResponse(req, { content, provider, cover });
  } catch (e) {
    if (e instanceof ApiError) return jsonResponse(req, { error: e.message }, { status: e.status });
    return jsonResponse(req, { error: "Cover letter generation failed." }, { status: 500 });
  }
}
