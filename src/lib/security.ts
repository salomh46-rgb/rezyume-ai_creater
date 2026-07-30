import { NextResponse, type NextRequest } from "next/server";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_ALLOWED_METHODS = "GET,POST,PATCH,DELETE,OPTIONS";
const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, X-Webhook-Signature";

export function getAppBaseUrl(req?: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (req) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:3000";
}

export function getAllowedOrigins(): string[] {
  const configured = process.env.API_CORS_ORIGINS;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const origins = [base, ...(configured ? configured.split(",") : [])]
    .map((v) => v?.trim().replace(/\/$/, ""))
    .filter(Boolean) as string[];
  return [...new Set(origins)];
}

export function corsHeaders(req?: Request): HeadersInit {
  const allowed = getAllowedOrigins();
  const origin = req?.headers.get("origin")?.replace(/\/$/, "") ?? "";
  const allowOrigin = allowed.length === 0 ? origin || "*" : allowed.includes(origin) ? origin : allowed[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": DEFAULT_ALLOWED_HEADERS,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function securityHeaders(): HeadersInit {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

export function preflight(req: Request): NextResponse {
  return new NextResponse(null, { status: 204, headers: { ...corsHeaders(req), ...securityHeaders() } });
}

export function jsonResponse<T>(req: Request | undefined, body: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...corsHeaders(req),
      ...securityHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}

export function rateLimit(req: Request, opts: Omit<RateLimitOptions, "key"> & { key?: string }): NextResponse | null {
  const key = opts.key ?? `${getClientIp(req)}:${new URL(req.url).pathname}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  if (bucket.count >= opts.limit) {
    return jsonResponse(
      req,
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(opts.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(bucket.resetAt),
        },
      },
    );
  }

  bucket.count += 1;
  return null;
}

export function requireEnv(keys: string[]): { ok: true } | { ok: false; missing: string[] } {
  const missing = keys.filter((k) => !process.env[k]);
  return missing.length ? { ok: false, missing } : { ok: true };
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export type ApiRequest = Request | NextRequest;
