"use client";

import { useEffect, useState } from "react";
import { generateQrDataUrl, normalizeUrl } from "@/lib/qr";
import type { ResumeContent } from "@/lib/types";

/**
 * Resolves the QR PNG for a resume, or "" when the toggle is off / URL empty.
 * The result is keyed by the resolved URL so stale codes are never shown and
 * no state is written synchronously during the effect.
 */
export function useQrDataUrl(content: ResumeContent): string {
  const enabled = !!content.qr?.enabled;
  const raw = content.qr?.url ?? "";
  const key = enabled && raw.trim() ? normalizeUrl(raw) : "";

  const [resolved, setResolved] = useState<{ key: string; value: string }>({ key: "", value: "" });

  useEffect(() => {
    if (!key) return;
    let alive = true;
    generateQrDataUrl(key).then((value) => {
      if (alive) setResolved({ key, value });
    });
    return () => {
      alive = false;
    };
  }, [key]);

  return key && resolved.key === key ? resolved.value : "";
}
