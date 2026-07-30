import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { resumes, users } from "@/db/schema";
import { SESSION_COOKIE, createSession } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/security";
import { sampleContent } from "@/lib/types";

const GOOGLE_STATE_COOKIE = "resumai_google_state";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

async function ensureLatestResume(userId: string): Promise<string> {
  let [latest] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(1);

  if (!latest) {
    const [seeded] = await db
      .insert(resumes)
      .values({ userId, title: "My first resume", template: "tech", content: sampleContent() })
      .returning();
    latest = { id: seeded.id };
  }
  return latest.id;
}

function safeNext(next: string | undefined, resumeId: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && next !== "/dashboard") return next;
  return `/builder/${resumeId}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const base = getAppBaseUrl(req);

  const fail = (message: string) => NextResponse.redirect(`${base}/?auth=1&error=${encodeURIComponent(message)}`);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return fail("Google OAuth is not configured.");
  }
  if (!code || !state) return fail("Missing Google OAuth code/state.");

  const cookieHeader = req.headers.get("cookie") ?? "";
  const rawStateCookie = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${GOOGLE_STATE_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  let expected: { state: string; next?: string } | null = null;
  try {
    expected = rawStateCookie ? JSON.parse(decodeURIComponent(rawStateCookie)) : null;
  } catch {
    expected = null;
  }

  if (!expected?.state || expected.state !== state) return fail("Invalid Google OAuth state.");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${base}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    return fail(tokenJson.error_description ?? tokenJson.error ?? "Google token exchange failed.");
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = (await userRes.json()) as GoogleUserInfo;

  if (!userRes.ok || !profile.email) return fail("Could not read Google profile.");
  if (profile.email_verified === false) return fail("Google email is not verified.");

  let [user] = await db.select().from(users).where(eq(users.email, profile.email.toLowerCase())).limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email: profile.email.toLowerCase(), name: profile.name ?? profile.email, provider: "google" })
      .returning();
  }

  const resumeId = await ensureLatestResume(user.id);
  const token = await createSession(user.id);
  const res = NextResponse.redirect(`${base}${safeNext(expected.next, resumeId)}`);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const dynamic = "force-dynamic";
