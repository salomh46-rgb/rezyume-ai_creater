"use client";

import QRCode from "qrcode";

const cache = new Map<string, string>();

export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^@[\w.]+$/.test(v)) return `https://t.me/${v.slice(1)}`;
  if (/^(www\.|[\w-]+\.[a-z]{2,})/i.test(v)) return `https://${v}`;
  return v;
}

/** Renders a crisp black-on-white QR PNG data URL (cached per URL). */
export async function generateQrDataUrl(url: string): Promise<string> {
  const target = normalizeUrl(url);
  if (!target) return "";
  const hit = cache.get(target);
  if (hit) return hit;
  try {
    const dataUrl = await QRCode.toDataURL(target, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
      color: { dark: "#1E2126ff", light: "#FFFFFFff" },
    });
    cache.set(target, dataUrl);
    return dataUrl;
  } catch {
    return "";
  }
}
