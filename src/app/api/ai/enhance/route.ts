import { enhanceBullets, enhanceSummary, tailorSkills } from "@/lib/ai";
import { ApiError, requireUser } from "@/lib/auth";
import { jsonResponse, preflight, rateLimit } from "@/lib/security";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    await requireUser();
    const body = (await req.json()) as {
      kind?: "bullets" | "summary" | "skills";
      role?: string;
      company?: string;
      notes?: string;
      jobTitle?: string;
      skills?: string[];
      jobDescription?: string;
      experiences?: number;
      lang?: string;
    };

    switch (body.kind) {
      case "bullets": {
        const result = await enhanceBullets({
          role: body.role ?? "",
          company: body.company ?? "",
          notes: body.notes ?? "",
          lang: body.lang,
        });
        return jsonResponse(req, result);
      }
      case "summary": {
        const result = await enhanceSummary({
          jobTitle: body.jobTitle ?? "",
          skills: body.skills ?? [],
          notes: body.notes ?? "",
          experiences: body.experiences ?? 0,
          lang: body.lang,
        });
        return jsonResponse(req, result);
      }
      case "skills": {
        const result = await tailorSkills({
          jobTitle: body.jobTitle ?? "",
          skills: body.skills ?? [],
          jobDescription: body.jobDescription ?? "",
          lang: body.lang,
        });
        return jsonResponse(req, result);
      }
      default:
        return jsonResponse(req, { error: "Unknown enhance kind." }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof ApiError) return jsonResponse(req, { error: e.message }, { status: e.status });
    return jsonResponse(req, { error: "AI enhancement failed." }, { status: 500 });
  }
}
