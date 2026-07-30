import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, createSession, hashPassword, isValidEmail } from "@/lib/auth";
import { sampleContent } from "@/lib/types";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (name.length < 2) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists. Try signing in instead." }, { status: 409 });
  }

  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash: hashPassword(password), provider: "email" })
    .returning();

  // Seed a starter resume pre-filled with example content so the workspace
  // never feels empty — users edit it into their own resume.
  const { resumes } = await import("@/db/schema");
  const demo = sampleContent();
  demo.personal.fullName = demo.personal.fullName || name;
  demo.personal.email = demo.personal.email || email;
  const [seededResume] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      title: "My first resume",
      template: "minimalist",
      content: demo,
    })
    .returning();

  const token = await createSession(user.id);
  const res = NextResponse.json(
    { user: { id: user.id, email: user.email, name: user.name }, resumeId: seededResume.id },
    { status: 201 },
  );
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
