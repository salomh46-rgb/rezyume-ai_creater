"use client";

import { ArrowLeft, Download, FileWarning, Loader2, Mail, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { CoverLetterSheet, ResumeSheet } from "@/components/resume-sheet";
import { useQrDataUrl } from "@/components/use-qr";
import { Button } from "@/components/ui";
import { downloadCoverLetterPdf, downloadResumePdf } from "@/lib/pdf-text";
import type { ResumeContent, TemplateId } from "@/lib/types";

export function PrintDoc({
  resume,
  cover,
  mode,
  resumeId,
}: {
  resume: { title: string; template: TemplateId; content: ResumeContent };
  cover: { company: string; content: string } | null;
  mode: "resume" | "cover";
  resumeId: string;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const qrDataUrl = useQrDataUrl(resume.content);

  const showCover = mode === "cover";
  const coverEmpty = showCover && (!cover || !cover.content.trim());

  const handleDownload = async () => {
    setPdfBusy(true);
    try {
      const safeName = resume.title.replace(/[^a-z0-9-_]+/gi, "_") || "resume";
      if (showCover && cover) {
        await downloadCoverLetterPdf({
          letter: cover.content,
          personal: resume.content.personal,
          company: cover.company,
          filename: `${safeName}-cover-letter.pdf`,
        });
      } else {
        await downloadResumePdf({
          content: resume.content,
          template: resume.template,
          filename: `${safeName}.pdf`,
          qrDataUrl,
        });
      }
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="print-hide sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/builder/${resumeId}`}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Back to editor"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <Logo />
            <span className="hidden text-[12.5px] font-semibold text-muted sm:inline">
              · {resume.title} {showCover ? "· Cover letter" : "· Resume"} · A4
            </span>
          </div>
          {!coverEmpty && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button onClick={handleDownload} loading={pdfBusy}>
                {!pdfBusy && <Download className="h-4 w-4" />}
                {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Download PDF"}
              </Button>
            </div>
          )}
        </div>
      </header>

      {coverEmpty ? (
        <main className="mx-auto max-w-lg px-5 py-24 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-warn-soft text-warn">
            <FileWarning className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-ink">No cover letter yet</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Generate a cover letter in the Builder Studio first — it takes the resume and the job description and drafts
            the whole letter for you.
          </p>
          <Link href={`/builder/${resumeId}`} className="mt-6 inline-block">
            <Button size="lg">
              <Mail className="h-4 w-4" />
              Open Builder Studio
            </Button>
          </Link>
        </main>
      ) : (
        <main className="print-sheet-wrap mx-auto flex max-w-5xl justify-center px-4 py-8">
          <div className="print-sheet w-fit">
            {showCover && cover ? (
              <CoverLetterSheet letter={cover.content} personal={resume.content.personal} company={cover.company} />
            ) : (
              <ResumeSheet content={resume.content} template={resume.template} qrDataUrl={qrDataUrl} />
            )}
          </div>
        </main>
      )}
    </div>
  );
}
