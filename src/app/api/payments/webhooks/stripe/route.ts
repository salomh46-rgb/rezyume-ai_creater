import { jsonResponse, preflight, rateLimit } from "@/lib/security";
import { verifyStripeWebhookSignature } from "@/lib/payments";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  const verified = verifyStripeWebhookSignature(payload, signature);

  // Stub: persist subscription status here after verifying with Stripe SDK.
  return jsonResponse(req, {
    received: true,
    provider: "stripe",
    verified,
    next: "Install/configure Stripe SDK and map checkout.session.completed to a subscriptions table.",
  });
}

export const dynamic = "force-dynamic";
