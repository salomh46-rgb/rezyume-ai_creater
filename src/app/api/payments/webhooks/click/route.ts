import { jsonResponse, preflight, rateLimit } from "@/lib/security";
import { verifyClickWebhookSignature } from "@/lib/payments";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const payload = await req.text();
  const signature = req.headers.get("x-click-signature") ?? req.headers.get("sign_string");
  const verified = verifyClickWebhookSignature(payload, signature);

  // Stub: map Click prepare/complete callbacks into subscription status here.
  return jsonResponse(req, {
    error: 0,
    error_note: "Success",
    provider: "click",
    verified,
  });
}

export const dynamic = "force-dynamic";
