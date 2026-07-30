import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { Builder } from "@/components/builder";
import { normalizeContent, type TemplateId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/?auth=1&next=/builder/${id}`);

  const rows = await db
    .select({ resume: resumes, cover: coverLetters })
    .from(resumes)
    .leftJoin(coverLetters, eq(coverLetters.resumeId, resumes.id))
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);

  if (rows.length === 0) notFound();
  const { resume, cover } = rows[0];

  return (
    <Builder
      initial={{
        id: resume.id,
        title: resume.title,
        template: resume.template as TemplateId,
        content: normalizeContent(resume.content),
        createdAt: resume.createdAt.toISOString(),
      }}
      initialCover={
        cover
          ? {
              company: cover.company,
              role: cover.role,
              jobDescription: cover.jobDescription,
              tone: cover.tone as "professional" | "friendly" | "bold",
              content: cover.content,
            }
          : null
      }
      userName={user.name}
    />
  );
}
