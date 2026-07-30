import { createHmac } from "crypto";
import { timingSafeStringEqual } from "@/lib/security";

export type PaymentProvider = "stripe" | "payme" | "click";

export const PRO_PLAN = {
  id: "pro-monthly",
  name: "ResumAI Hub Pro",
  amountUsd: 9,
  amountCents: 900,
  currency: "USD",
  interval: "month",
} as const;

export interface CheckoutInput {
  provider: PaymentProvider;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  provider: PaymentProvider;
  checkoutUrl: string;
  reference: string;
  mode: "live-ready" | "stub";
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function ref(prefix: string, userId: string): string {
  return `${prefix}_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
}

export async function createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  if (input.provider === "stripe") return createStripeCheckout(input);
  if (input.provider === "payme") return createPaymeCheckout(input);
  return createClickCheckout(input);
}

async function createStripeCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  const reference = ref("stripe", input.userId);

  if (!secret) {
    return {
      provider: "stripe",
      reference,
      mode: "stub",
      checkoutUrl: `${appUrl()}/dashboard?billing=stripe-stub&plan=${PRO_PLAN.id}&ref=${reference}`,
    };
  }

  // Minimal direct Stripe API integration. For production, configure a Stripe Price ID
  // and replace price_data with `line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }]`.
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", input.successUrl);
  body.set("cancel_url", input.cancelUrl);
  body.set("customer_email", input.email);
  body.set("client_reference_id", reference);
  body.set("metadata[userId]", input.userId);
  body.set("metadata[plan]", PRO_PLAN.id);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "usd");
  body.set("line_items[0][price_data][unit_amount]", String(PRO_PLAN.amountCents));
  body.set("line_items[0][price_data][recurring][interval]", PRO_PLAN.interval);
  body.set("line_items[0][price_data][product_data][name]", PRO_PLAN.name);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Stripe checkout failed: ${message.slice(0, 240)}`);
  }

  const json = (await res.json()) as { url?: string; id?: string };
  return { provider: "stripe", reference: json.id ?? reference, checkoutUrl: json.url ?? input.cancelUrl, mode: "live-ready" };
}

async function createPaymeCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const merchantId = process.env.PAYME_MERCHANT_ID;
  const reference = ref("payme", input.userId);

  if (!merchantId) {
    return {
      provider: "payme",
      reference,
      mode: "stub",
      checkoutUrl: `${appUrl()}/dashboard?billing=payme-stub&plan=${PRO_PLAN.id}&ref=${reference}`,
    };
  }

  // Payme checkout URL format is intentionally kept as a connect-ready template.
  // Replace account[user_id] / account[plan] fields if your merchant account uses different account keys.
  const params = new URLSearchParams({
    m: merchantId,
    ac_user_id: input.userId,
    ac_plan: PRO_PLAN.id,
    a: String(PRO_PLAN.amountCents * 100), // Payme expects tiyin.
    c: input.successUrl,
  });

  return {
    provider: "payme",
    reference,
    mode: "live-ready",
    checkoutUrl: `https://checkout.paycom.uz/${params.toString()}`,
  };
}

async function createClickCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const serviceId = process.env.CLICK_SERVICE_ID;
  const reference = ref("click", input.userId);

  if (!serviceId) {
    return {
      provider: "click",
      reference,
      mode: "stub",
      checkoutUrl: `${appUrl()}/dashboard?billing=click-stub&plan=${PRO_PLAN.id}&ref=${reference}`,
    };
  }

  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_trans_id: reference,
    amount: String(PRO_PLAN.amountUsd),
    return_url: input.successUrl,
  });

  return {
    provider: "click",
    reference,
    mode: "live-ready",
    checkoutUrl: `https://my.click.uz/services/pay?${params.toString()}`,
  };
}

export function verifyStripeWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  // Placeholder: Stripe signs as t=timestamp,v1=signature. Use stripe.webhooks.constructEvent
  // if you install the official stripe package. This helper keeps secrets server-side.
  return signature.includes("v1=");
}

export function verifyPaymeWebhookAuth(authHeader: string | null): boolean {
  const expected = process.env.PAYME_WEBHOOK_KEY;
  if (!expected || !authHeader?.startsWith("Basic ")) return false;
  return timingSafeStringEqual(authHeader, `Basic ${Buffer.from(`Paycom:${expected}`).toString("base64")}`);
}

export function signClickPayload(payload: string): string | null {
  const secret = process.env.CLICK_SECRET_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyClickWebhookSignature(payload: string, signature: string | null): boolean {
  const expected = signClickPayload(payload);
  if (!expected || !signature) return false;
  return timingSafeStringEqual(expected, signature);
}
