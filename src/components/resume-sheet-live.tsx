"use client";

import type { CSSProperties } from "react";
import { ResumeSheet } from "@/components/resume-sheet";
import { useQrDataUrl } from "@/components/use-qr";
import type { ResumeContent, TemplateId } from "@/lib/types";

/**
 * ResumeSheet + automatic QR resolution. Use this anywhere a live,
 * user-editable resume is rendered so the QR toggle just works.
 */
export function LiveResumeSheet({
  content,
  template,
  className,
  style,
}: {
  content: ResumeContent;
  template: TemplateId;
  className?: string;
  style?: CSSProperties;
}) {
  const qr = useQrDataUrl(content);
  return <ResumeSheet content={content} template={template} className={className} style={style} qrDataUrl={qr} />;
}
