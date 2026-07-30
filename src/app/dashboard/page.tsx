import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { coverLetters, resumes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";
import { normalizeContent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/?auth=1&next=/dashboard");

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

  const serialized = rows.map((r) => ({
    ...r,
    template: r.template as "minimalist" | "tech" | "executive",
    content: normalizeContent(r.content),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <Dashboard
      user={{ id: user.id, name: user.name, email: user.email, provider: user.provider }}
      initialResumes={serialized}
    />
  );
}
