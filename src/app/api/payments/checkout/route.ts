import { ApiError, requireUser } from "@/lib/auth";
import { createCheckout, type PaymentProvider } from "@/lib/payments";
import { getAppBaseUrl, jsonResponse, preflight, rateLimit } from "@/lib/security";

const PROVIDERS: PaymentProvider[] = ["stripe", "payme", "click"];

export async function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { provider?: PaymentProvider };
    const provider = body.provider && PROVIDERS.includes(body.provider) ? body.provider : "stripe";
    const base = getAppBaseUrl(req);

    const checkout = await createCheckout({
      provider,
      userId: user.id,
      email: user.email,
      successUrl: `${base}/dashboard?billing=success&provider=${provider}`,
      cancelUrl: `${base}/dashboard?billing=cancelled&provider=${provider}`,
    });

    return jsonResponse(req, { plan: "pro-monthly", ...checkout });
  } catch (e) {
    if (e instanceof ApiError) return jsonResponse(req, { error: e.message }, { status: e.status });
    return jsonResponse(req, { error: e instanceof Error ? e.message : "Checkout failed." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
