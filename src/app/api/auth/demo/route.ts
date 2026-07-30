import { randomBytes } from "crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { resumes, users } from "@/db/schema";
import { SESSION_COOKIE, createSession, getSessionUser } from "@/lib/auth";
import { sampleContent } from "@/lib/types";

/**
 * One-click demo access.
 *
 * Provisions a throwaway demo account (or reuses the caller's existing
 * session), seeds it with the pre-filled sample resume, and returns the
 * resume id so the client can jump straight into the Builder Studio —
 * no sign-in modal, no credentials.
 */
export async function POST() {
  try {
    // Already signed in? Just hand back their most recent resume.
    const existingUser = await getSessionUser();
    if (existingUser) {
      const [latest] = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(eq(resumes.userId, existingUser.id))
        .orderBy(desc(resumes.updatedAt))
        .limit(1);

      if (latest) {
        return NextResponse.json({
          user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
          resumeId: latest.id,
          reused: true,
        });
      }

      const [seeded] = await db
        .insert(resumes)
        .values({ userId: existingUser.id, title: "Demo resume", template: "tech", content: sampleContent() })
        .returning();
      return NextResponse.json({
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
        resumeId: seeded.id,
        reused: true,
      });
    }

    // Fresh demo identity so concurrent visitors never share a workspace.
    const suffix = randomBytes(4).toString("hex");
    const email = `demo.${suffix}@resumai.demo`;
    const name = "Demo Foydalanuvchi";

    const [user] = await db.insert(users).values({ email, name, provider: "demo" }).returning();

    const [resume] = await db
      .insert(resumes)
      .values({
        userId: user.id,
        title: "Demo resume",
        template: "tech",
        content: sampleContent(),
      })
      .returning();

    const token = await createSession(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      resumeId: resume.id,
      reused: false,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Could not start demo session." }, { status: 500 });
  }
}
