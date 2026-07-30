import { jsonResponse, preflight, rateLimit } from "@/lib/security";
import { verifyPaymeWebhookAuth } from "@/lib/payments";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const auth = req.headers.get("authorization");
  const verified = verifyPaymeWebhookAuth(auth);
  const body = await req.json().catch(() => ({}));

  // Stub: implement Payme CheckPerformTransaction/CreateTransaction/PerformTransaction methods here.
  return jsonResponse(req, {
    jsonrpc: "2.0",
    result: { allow: true, provider: "payme", verified, echo: body },
  });
}

export const dynamic = "force-dynamic";
