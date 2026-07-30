import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { PrintDoc } from "@/components/print-doc";
import { normalizeContent, type TemplateId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc } = await searchParams;
  const mode: "resume" | "cover" = doc === "cover" ? "cover" : "resume";

  const user = await getSessionUser();
  if (!user) redirect(`/?auth=1&next=/print/${id}`);

  const rows = await db
    .select({ resume: resumes, cover: coverLetters })
    .from(resumes)
    .leftJoin(coverLetters, eq(coverLetters.resumeId, resumes.id))
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);

  if (rows.length === 0) notFound();
  const { resume, cover } = rows[0];

  return (
    <PrintDoc
      resume={{
        title: resume.title,
        template: resume.template as TemplateId,
        content: normalizeContent(resume.content),
      }}
      cover={cover ? { company: cover.company, content: cover.content } : null}
      mode={mode}
      resumeId={resume.id}
    />
  );
}
