import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { resumes, users } from "@/db/schema";
import { SESSION_COOKIE, createSession, isValidEmail, verifyPassword } from "@/lib/auth";
import { sampleContent } from "@/lib/types";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Always hand back a resume id so the client can open the Builder directly.
  let [latest] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(resumes.updatedAt))
    .limit(1);

  if (!latest) {
    const [seeded] = await db
      .insert(resumes)
      .values({ userId: user.id, title: "My first resume", template: "minimalist", content: sampleContent() })
      .returning();
    latest = { id: seeded.id };
  }

  const token = await createSession(user.id);
  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, resumeId: latest.id });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
