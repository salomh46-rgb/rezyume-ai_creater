import { randomBytes } from "crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { resumes, users } from "@/db/schema";
import { SESSION_COOKIE, createSession } from "@/lib/auth";
import { sampleContent } from "@/lib/types";
import { getAppBaseUrl, jsonResponse, preflight, rateLimit } from "@/lib/security";

const GOOGLE_STATE_COOKIE = "resumai_google_state";
const GOOGLE_SCOPE = "openid email profile";

function googleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
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

function buildGoogleAuthUrl(req: Request, state: string): string {
  const base = getAppBaseUrl(req);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${base}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  return url.toString();
}

function issueOAuthStart(req: Request, next = "/dashboard"): NextResponse {
  const state = randomBytes(24).toString("hex");
  const authUrl = buildGoogleAuthUrl(req, state);
  const res = jsonResponse(req, { authUrl, provider: "google", mode: "oauth" });
  res.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}

async function issueDevGoogleSession(req: Request): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as { fresh?: boolean };
  const fresh = !!body.fresh;
  const email = fresh ? `alex.morgan+${randomBytes(3).toString("hex")}@gmail.com` : "alex.morgan@gmail.com";
  const name = "Alex Morgan";

  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({ email, name, provider: "google-dev" }).returning();
  }

  const resumeId = await ensureLatestResume(user.id);
  const token = await createSession(user.id);
  const res = jsonResponse(req, {
    user: { id: user.id, email: user.email, name: user.name },
    resumeId,
    mode: "development-fallback",
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function OPTIONS(req: Request) {
  return preflight(req);
}

/**
 * Browser redirect entrypoint. Use this directly as the Google OAuth callback URL trigger.
 */
export async function GET(req: Request) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/?auth=1", req.url));
  }

  const next = new URL(req.url).searchParams.get("next") ?? "/dashboard";
  const state = randomBytes(24).toString("hex");
  const authUrl = buildGoogleAuthUrl(req, state);
  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
  return res;
}

/**
 * Client modal entrypoint. In production it returns a real Google auth URL;
 * in local/demo environments without credentials it keeps the safe test-user fallback.
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  if (googleConfigured()) {
    const body = (await req.json().catch(() => ({}))) as { next?: string };
    return issueOAuthStart(req, body.next && body.next.startsWith("/") ? body.next : "/dashboard");
  }

  return issueDevGoogleSession(req);
}

export const dynamic = "force-dynamic";
