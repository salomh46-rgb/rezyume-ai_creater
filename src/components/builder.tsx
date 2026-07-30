"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutTemplate,
  Loader2,
  Mail,
  Plus,
  QrCode,
  Sparkles,
  Trash2,
  User,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { CoverLetterSheet, ResumeSheet, SheetPreview } from "@/components/resume-sheet";
import { ThemeToggle } from "@/components/theme";
import { useToast } from "@/components/toast";
import { Button, Input, Label, Segmented, Textarea, cx } from "@/components/ui";
import { PhotoUpload } from "@/components/photo-upload";
import { AtsScore, KeywordMatcher } from "@/components/ats-score";
import { LanguageSwitcher, useLang } from "@/components/language-provider";
import { useQrDataUrl } from "@/components/use-qr";
import { downloadCoverLetterPdf, downloadResumePdf } from "@/lib/pdf-text";
import {
  SKILL_LEVELS,
  TEMPLATES,
  skillNames,
  uid,
  type CoverLetterState,
  type EducationEntry,
  type ExperienceEntry,
  type ResumeContent,
  type SkillEntry,
  type SkillLevel,
  type TemplateId,
} from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";
type DocTab = "resume" | "cover";

interface InitialResume {
  id: string;
  title: string;
  template: TemplateId;
  content: ResumeContent;
  createdAt: string;
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-deep">{icon}</span>
          <div>
            <h2 className="text-[14px] font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-[12px] text-muted">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function AiButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  const { t } = useLang();
  return (
    <Button variant="soft" size="sm" onClick={onClick} loading={loading} disabled={loading}>
      {!loading && <Wand2 className="h-3.5 w-3.5" />}
      {loading ? t("ai.writing") : label}
    </Button>
  );
}

function SaveChip({ state }: { state: SaveState }) {
  const { t } = useLang();
  if (state === "saving")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-muted">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" /> {t("builder.saving")}
      </span>
    );
  if (state === "error")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/40 bg-danger-soft px-2.5 py-1 text-[11.5px] font-semibold text-danger">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" /> {t("builder.saveError")}
      </span>
    );
  if (state === "saved")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ok">
        <Check className="h-3 w-3" /> {t("builder.saved")}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-muted">
      {t("builder.allSaved")}
    </span>
  );
}

export function Builder({
  initial,
  initialCover,
  userName,
}: {
  initial: InitialResume;
  initialCover: CoverLetterState | null;
  userName: string;
}) {
  const { toast } = useToast();
  const { t, locale } = useLang();

  /* ------------------------------ state ------------------------------ */
  const [doc, setDoc] = useState<DocTab>("resume");
  const [title, setTitle] = useState(initial.title);
  const [template, setTemplate] = useState<TemplateId>(initial.template);
  const [content, setContent] = useState<ResumeContent>(initial.content);
  const [cover, setCover] = useState<CoverLetterState>(
    initialCover ?? { company: "", role: "", jobDescription: "", tone: "professional", content: "" },
  );

  const [resumeSave, setResumeSave] = useState<SaveState>("idle");
  const [coverSave, setCoverSave] = useState<SaveState>("idle");

  const [summaryAi, setSummaryAi] = useState(false);
  const [bulletsAi, setBulletsAi] = useState<string | null>(null);
  const [skillsAi, setSkillsAi] = useState(false);
  const [coverAi, setCoverAi] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [skillInput, setSkillInput] = useState("");
  const [tplOpen, setTplOpen] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(620);
  const qrDataUrl = useQrDataUrl(content);

  const firstResume = useRef(true);
  const firstCover = useRef(true);

  /* ---------------------------- autosave ----------------------------- */
  useEffect(() => {
    if (firstResume.current) {
      firstResume.current = false;
      return;
    }
    setResumeSave("saving");
    const tId = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/resumes/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, template, content }),
        });
        if (!res.ok) throw new Error();
        setResumeSave("saved");
      } catch {
        setResumeSave("error");
      }
    }, 900);
    return () => window.clearTimeout(tId);
  }, [title, template, content, initial.id]);

  useEffect(() => {
    if (firstCover.current) {
      firstCover.current = false;
      return;
    }
    setCoverSave("saving");
    const tId = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/resumes/${initial.id}/cover`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cover),
        });
        if (!res.ok) throw new Error();
        setCoverSave("saved");
      } catch {
        setCoverSave("error");
      }
    }, 900);
    return () => window.clearTimeout(tId);
  }, [cover, initial.id]);

  /* ------------------------- preview fit ----------------------------- */
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 620;
      setPreviewW(Math.max(260, w - 48));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --------------------------- updaters ------------------------------ */
  const patchContent = (patch: Partial<ResumeContent>) => setContent((c) => ({ ...c, ...patch }));
  const patchPersonal = (patch: Partial<ResumeContent["personal"]>) =>
    setContent((c) => ({ ...c, personal: { ...c.personal, ...patch } }));

  const patchExp = (id: string, patch: Partial<ExperienceEntry>) =>
    setContent((c) => ({
      ...c,
      experiences: c.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const patchEdu = (id: string, patch: Partial<EducationEntry>) =>
    setContent((c) => ({
      ...c,
      education: c.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  /* ----------------------------- AI calls ---------------------------- */
  const aiEnhance = async (kind: "bullets" | "summary" | "skills", payload: Record<string, unknown>) => {
    const res = await fetch("/api/ai/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, lang: locale, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "AI request failed");
    return data as { bullets?: string[]; summary?: string; skills?: string[]; provider: string };
  };

  const enhanceSummary = async () => {
    setSummaryAi(true);
    try {
      const data = await aiEnhance("summary", {
        jobTitle: content.targetJobTitle,
        skills: skillNames(content.skills),
        notes: content.summary,
        experiences: content.experiences.length,
      });
      if (data.summary) patchContent({ summary: data.summary });
      toast({
        variant: "ai",
        title: "Summary enhanced",
        description: data.provider === "openai" ? "Generated with GPT-4o mini." : "Generated by the on-device ResumAI engine.",
      });
    } catch (e) {
      toast({ variant: "error", title: "Enhancement failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setSummaryAi(false);
    }
  };

  const enhanceBullets = async (exp: ExperienceEntry) => {
    setBulletsAi(exp.id);
    try {
      const data = await aiEnhance("bullets", {
        role: exp.role,
        company: exp.company,
        notes: exp.bullets.join("\n"),
      });
      if (data.bullets) patchExp(exp.id, { bullets: data.bullets });
      toast({
        variant: "ai",
        title: "Bullets rewritten",
        description: data.provider === "openai" ? "Sharpened with GPT-4o mini." : "Sharpened by the on-device ResumAI engine.",
      });
    } catch (e) {
      toast({ variant: "error", title: "Enhancement failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBulletsAi(null);
    }
  };

  const enhanceSkills = async () => {
    setSkillsAi(true);
    try {
      const data = await aiEnhance("skills", {
        jobTitle: content.targetJobTitle,
        skills: skillNames(content.skills),
        jobDescription: cover.jobDescription,
      });
      if (data.skills) patchContent({ skills: data.skills.map((s: string) => ({ name: s, level: "intermediate" as SkillLevel })) });
      toast({
        variant: "ai",
        title: "Skills tailored",
        description: cover.jobDescription.trim()
          ? "Matched against the job description."
          : "Curated for your target role — paste a job description in the Cover Letter tab to tailor deeper.",
      });
    } catch (e) {
      toast({ variant: "error", title: "Skill tailoring failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setSkillsAi(false);
    }
  };

  const generateCover = async () => {
    setCoverAi(true);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: initial.id,
          company: cover.company,
          role: cover.role,
          jobDescription: cover.jobDescription,
          tone: cover.tone,
          lang: locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setCover((c) => ({ ...c, content: data.content, role: data.cover?.role ?? c.role }));
      toast({
        variant: "ai",
        title: "Cover letter drafted",
        description: data.provider === "openai" ? "Written with GPT-4o mini — edit away." : "Written by the on-device ResumAI engine — edit away.",
      });
    } catch (e) {
      toast({ variant: "error", title: "Could not generate", description: e instanceof Error ? e.message : undefined });
    } finally {
      setCoverAi(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (content.skills.some((x) => x.name.toLowerCase() === s.toLowerCase())) {
      setSkillInput("");
      return;
    }
    patchContent({ skills: [...content.skills, { name: s, level: "intermediate" as SkillLevel }] });
    setSkillInput("");
  };

  const handleDownloadPdf = async () => {
    setPdfBusy(true);
    try {
      const safeName = (title || "resume").replace(/[^a-z0-9-_]+/gi, "_") || "resume";
      if (doc === "cover") {
        await downloadCoverLetterPdf({
          letter: cover.content,
          personal: content.personal,
          company: cover.company,
          filename: `${safeName}-cover-letter.pdf`,
        });
      } else {
        await downloadResumePdf({
          content,
          template,
          filename: `${safeName}.pdf`,
          qrDataUrl,
        });
      }
      toast({ variant: "success", title: t("builder.pdfReady"), description: t("builder.pdfReadyDesc") });
    } catch {
      toast({ variant: "error", title: t("builder.pdfFailed"), description: t("builder.printHint") });
    } finally {
      setPdfBusy(false);
    }
  };

  const activeTemplate = TEMPLATES.find((t2) => t2.id === template)!;

  /* ------------------------------ render ------------------------------ */
  return (
    <div className="flex min-h-screen flex-col">
      {/* ------------------------------ top bar ------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md print-hide">
        <div className="mx-auto flex h-15 max-w-[1500px] items-center gap-3 px-4">
          <Link href="/dashboard" aria-label="Back to dashboard" className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink">
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <Link href="/dashboard" className="hidden sm:block">
            <Logo compact />
          </Link>
          <div className="mx-1 h-6 w-px bg-line" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Resume title"
            className="w-40 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[14.5px] font-bold text-ink transition-colors hover:border-line focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none sm:w-64"
          />
          <SaveChip state={doc === "resume" ? resumeSave : coverSave} />

          <div className="ml-auto flex items-center gap-2">
            <Segmented
              value={doc}
              onChange={setDoc}
              options={[
                {
                  value: "resume",
                  label: (
                    <>
                      <FileText className="h-3.5 w-3.5" /> {t("builder.resume")}
                    </>
                  ),
                },
                {
                  value: "cover",
                  label: (
                    <>
                      <Mail className="h-3.5 w-3.5" /> {t("builder.coverLetter")}
                    </>
                  ),
                },
              ]}
            />

            {/* template selector */}
            <div className="relative">
              <Button variant="outline" size="md" onClick={() => setTplOpen((o) => !o)} aria-label="Choose template">
                <LayoutTemplate className="h-4 w-4 text-accent" />
                <span className="hidden md:inline">{activeTemplate.name}</span>
                <ChevronDown className={cx("h-3.5 w-3.5 text-muted transition-transform", tplOpen && "rotate-180")} />
              </Button>
              {tplOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTplOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-50 mt-2 w-[300px] rounded-xl border border-line bg-surface p-2 shadow-xl shadow-black/15"
                  >
                    <p className="px-2 pt-1 pb-2 text-[11px] font-bold tracking-wide text-muted uppercase">{t("builder.template")}</p>
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          setTemplate(tpl.id);
                          setTplOpen(false);
                        }}
                        className={cx(
                          "flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors",
                          template === tpl.id ? "bg-accent-soft" : "hover:bg-surface-2",
                        )}
                      >
                        <span className="overflow-hidden rounded-md border border-line bg-white">
                          <SheetPreview width={72}>
                            <ResumeSheet content={content} template={tpl.id} qrDataUrl={qrDataUrl} />
                          </SheetPreview>
                        </span>
                        <span className="flex-1">
                          <span className="block text-[13px] font-bold text-ink">{tpl.name}</span>
                          <span className="block text-[11.5px] text-muted">{tpl.tagline}</span>
                        </span>
                        {template === tpl.id && <Check className="h-4 w-4 shrink-0 text-accent" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

            <a href={`/print/${initial.id}?doc=${doc}`} target="_blank" rel="noreferrer">
              <Button>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">{t("builder.printExport")}</span>
              </Button>
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ------------------------------ workspace ------------------------------ */}
      <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-5 p-4 lg:grid-cols-[440px_1fr]">
        {/* ------------------------------ left: forms ------------------------------ */}
        <div className="min-w-0 space-y-4 print-hide">
          <AnimatePresence mode="wait">
            {doc === "resume" ? (
              <motion.div
                key="resume-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <SectionCard icon={<BadgeCheck className="h-4 w-4" />} title={t("sec.ats")} subtitle={t("sec.ats.sub")}>
                  <AtsScore content={content} jobDescription={cover.jobDescription} />
                  <div className="mt-4 border-t border-line pt-4">
                    <KeywordMatcher
                      content={content}
                      jobDescription={cover.jobDescription}
                      onAddSkill={(s) => {
                        if (!content.skills.some((x) => x.name.toLowerCase() === s.toLowerCase())) {
                          patchContent({ skills: [...content.skills, { name: s, level: "intermediate" as SkillLevel }] });
                          toast({ variant: "success", title: `${s} +`, description: t("ats.addSkill") });
                        }
                      }}
                    />
                  </div>
                </SectionCard>

                <SectionCard icon={<QrCode className="h-4 w-4" />} title={t("sec.qr")} subtitle={t("sec.qr.sub")}>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-bg/60 px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold text-ink">{t("qr.enable")}</span>
                    <span className="relative inline-flex shrink-0">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={content.qr.enabled}
                        onChange={(e) => patchContent({ qr: { ...content.qr, enabled: e.target.checked } })}
                      />
                      <span className="h-6 w-10 rounded-full bg-line-strong transition-colors peer-checked:bg-accent" />
                      <span className="pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                    </span>
                  </label>

                  {content.qr.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 flex gap-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <Label>{t("qr.url")}</Label>
                            <Input
                              value={content.qr.url}
                              onChange={(e) => patchContent({ qr: { ...content.qr, url: e.target.value } })}
                              placeholder="https://github.com/username"
                            />
                          </div>
                          <div>
                            <Label>{t("qr.label")}</Label>
                            <Input
                              value={content.qr.label}
                              onChange={(e) => patchContent({ qr: { ...content.qr, label: e.target.value } })}
                              placeholder="Portfolio"
                            />
                          </div>
                        </div>
                        <div className="flex w-[104px] shrink-0 flex-col items-center gap-1.5">
                          <div className="flex h-[104px] w-[104px] items-center justify-center rounded-lg border border-line bg-white p-1.5">
                            {qrDataUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={qrDataUrl} alt="QR preview" className="h-full w-full object-contain" />
                            ) : (
                              <QrCode className="h-7 w-7 text-muted" />
                            )}
                          </div>
                          <span className="text-center text-[10.5px] leading-tight text-muted">{t("qr.preview")}</span>
                        </div>
                      </div>
                      <p className="mt-2.5 text-[11.5px] leading-snug text-muted">{t("qr.hint")}</p>
                    </motion.div>
                  )}
                </SectionCard>

                <SectionCard icon={<User className="h-4 w-4" />} title={t("sec.personal")} subtitle={t("sec.personal.sub")}>
                  <div className="mb-4">
                    <Label>{t("sec.photo")}</Label>
                    <PhotoUpload value={content.personal.photo} onChange={(photo) => patchPersonal({ photo, showPhoto: !!photo || content.personal.showPhoto })} />
                    {content.personal.photo && (
                      <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-ink-2">
                        <span className="relative inline-flex shrink-0">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={content.personal.showPhoto}
                            onChange={(e) => patchPersonal({ showPhoto: e.target.checked })}
                          />
                          <span className="h-5 w-8 rounded-full bg-line-strong transition-colors peer-checked:bg-accent" />
                          <span className="pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-3" />
                        </span>
                        {t("photo.showOnResume")}
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="col-span-2">
                      <Label>{t("field.fullName")}</Label>
                      <Input value={content.personal.fullName} onChange={(e) => patchPersonal({ fullName: e.target.value })} placeholder={userName} />
                    </div>
                    <div>
                      <Label>{t("field.email")}</Label>
                      <Input type="email" value={content.personal.email} onChange={(e) => patchPersonal({ email: e.target.value })} placeholder="you@email.com" />
                    </div>
                    <div>
                      <Label>{t("field.phone")}</Label>
                      <Input value={content.personal.phone} onChange={(e) => patchPersonal({ phone: e.target.value })} placeholder="+998 90 123-45-67" />
                    </div>
                    <div>
                      <Label>{t("field.location")}</Label>
                      <Input value={content.personal.location} onChange={(e) => patchPersonal({ location: e.target.value })} placeholder="City, Country" />
                    </div>
                    <div>
                      <Label>{t("field.telegram")}</Label>
                      <Input value={content.personal.telegram} onChange={(e) => patchPersonal({ telegram: e.target.value })} placeholder="@username" />
                    </div>
                    <div>
                      <Label>{t("field.website")}</Label>
                      <Input value={content.personal.website} onChange={(e) => patchPersonal({ website: e.target.value })} placeholder="yoursite.dev" />
                    </div>
                    <div>
                      <Label>{t("field.citizenship")}</Label>
                      <Input value={content.personal.citizenship} onChange={(e) => patchPersonal({ citizenship: e.target.value })} placeholder="O'zbekiston" />
                    </div>
                    <div>
                      <Label>{t("field.license")}</Label>
                      <Input value={content.personal.drivingLicense} onChange={(e) => patchPersonal({ drivingLicense: e.target.value })} placeholder="B, C" />
                    </div>
                    <div className="col-span-2">
                      <Label>{t("field.workFormat")}</Label>
                      <Input value={content.personal.workFormat} onChange={(e) => patchPersonal({ workFormat: e.target.value })} placeholder="Full-time" />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={<Sparkles className="h-4 w-4" />} title={t("sec.target")} subtitle={t("sec.target.sub")}>
                  <div className="space-y-3.5">
                    <div>
                      <Label>{t("sec.jobTitle")}</Label>
                      <Input value={content.targetJobTitle} onChange={(e) => patchContent({ targetJobTitle: e.target.value })} placeholder="e.g. Senior Software Engineer" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>{t("sec.summary")}</Label>
                        <AiButton onClick={enhanceSummary} loading={summaryAi} label={content.summary.trim() ? t("ai.rewrite") : t("ai.write")} />
                      </div>
                      {summaryAi ? (
                        <div className="ai-shimmer h-[104px] rounded-lg border border-line" />
                      ) : (
                        <Textarea
                          rows={4}
                          value={content.summary}
                          onChange={(e) => patchContent({ summary: e.target.value })}
                          placeholder="Two or three sentences on who you are and the impact you make…"
                        />
                      )}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  icon={<Briefcase className="h-4 w-4" />}
                  title={t("sec.experience")}
                  subtitle={`${content.experiences.length}`}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patchContent({
                          experiences: [
                            ...content.experiences,
                            { id: uid(), role: "", company: "", location: "", start: "", end: "", current: false, bullets: [] },
                          ],
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> {t("ai.add")}
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    {content.experiences.map((exp, idx) => (
                      <div key={exp.id} className="rounded-lg border border-line bg-bg/60 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-bold tracking-wide text-muted uppercase">#{idx + 1}</p>
                          {content.experiences.length > 1 && (
                            <button
                              onClick={() => patchContent({ experiences: content.experiences.filter((x) => x.id !== exp.id) })}
                              aria-label="Remove position"
                              className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-3">
                          <div>
                            <Label>{t("field.jobTitle")}</Label>
                            <Input value={exp.role} onChange={(e) => patchExp(exp.id, { role: e.target.value })} placeholder="Product Designer" />
                          </div>
                          <div>
                            <Label>{t("field.company")}</Label>
                            <Input value={exp.company} onChange={(e) => patchExp(exp.id, { company: e.target.value })} placeholder="Acme Inc." />
                          </div>
                          <div>
                            <Label>{t("field.start")}</Label>
                            <Input value={exp.start} onChange={(e) => patchExp(exp.id, { start: e.target.value })} placeholder="Jan 2021" />
                          </div>
                          <div>
                            <Label>{t("field.end")}</Label>
                            <Input
                              value={exp.current ? "Present" : exp.end}
                              disabled={exp.current}
                              onChange={(e) => patchExp(exp.id, { end: e.target.value })}
                              placeholder="Dec 2023"
                            />
                          </div>
                        </div>
                        <label className="mt-2.5 flex w-fit cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-ink-2">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => patchExp(exp.id, { current: e.target.checked, end: e.target.checked ? "" : exp.end })}
                            className="h-3.5 w-3.5 accent-(--accent)"
                          />
                          {t("field.current")}
                        </label>

                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <Label>{t("field.achievements")}</Label>
                            <AiButton onClick={() => enhanceBullets(exp)} loading={bulletsAi === exp.id} label={t("ai.enhance")} />
                          </div>
                          {bulletsAi === exp.id ? (
                            <div className="ai-shimmer h-[96px] rounded-lg border border-line" />
                          ) : (
                            <Textarea
                              rows={4}
                              value={exp.bullets.join("\n")}
                              onChange={(e) => patchExp(exp.id, { bullets: e.target.value.split("\n") })}
                              placeholder={"Rough notes are fine — e.g. \"redid onboarding, activation went up\"\nEnhance with AI turns them into polished bullets."}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  icon={<Sparkles className="h-4 w-4" />}
                  title={t("sec.skills")}
                  subtitle={t("sec.skills.sub")}
                  action={<AiButton onClick={enhanceSkills} loading={skillsAi} label={t("ai.tailor")} />}
                >
                  {skillsAi ? (
                    <div className="ai-shimmer h-[72px] rounded-lg border border-line" />
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {content.skills.map((s) => (
                          <span key={s.name} className="group inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft py-1 pr-1.5 pl-2.5 text-[12.5px] font-semibold text-accent-deep">
                            {s.name}
                            <select
                              value={s.level}
                              onChange={(e) =>
                                patchContent({
                                  skills: content.skills.map((x) =>
                                    x.name === s.name ? { ...x, level: e.target.value as SkillLevel } : x,
                                  ),
                                })
                              }
                              className="h-5 w-[70px] cursor-pointer rounded border border-accent/25 bg-transparent px-0.5 text-[10px] font-bold text-accent-deep/80 focus:border-accent focus:outline-none"
                            >
                              {SKILL_LEVELS.map((l) => (
                                <option key={l.value} value={l.value}>
                                  {l.label[locale]}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => patchContent({ skills: content.skills.filter((x) => x.name !== s.name) })}
                              aria-label={`Remove ${s.name}`}
                              className="cursor-pointer rounded-full p-0.5 text-accent-deep/60 transition-colors hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {content.skills.length === 0 && <p className="text-[12.5px] text-muted">No skills yet — type below or let AI tailor them.</p>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                          placeholder="Type a skill and press Enter"
                        />
                        <Button variant="outline" onClick={addSkill} aria-label="Add skill">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </SectionCard>

                <SectionCard
                  icon={<GraduationCap className="h-4 w-4" />}
                  title={t("sec.education")}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patchContent({
                          education: [...content.education, { id: uid(), school: "", degree: "", field: "", start: "", end: "" }],
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> {t("ai.add")}
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    {content.education.map((ed, idx) => (
                      <div key={ed.id} className="rounded-lg border border-line bg-bg/60 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] font-bold tracking-wide text-muted uppercase">#{idx + 1}</p>
                          {content.education.length > 1 && (
                            <button
                              onClick={() => patchContent({ education: content.education.filter((x) => x.id !== ed.id) })}
                              aria-label="Remove education entry"
                              className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2.5 grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label>{t("field.school")}</Label>
                            <Input value={ed.school} onChange={(e) => patchEdu(ed.id, { school: e.target.value })} placeholder="University of…" />
                          </div>
                          <div>
                            <Label>{t("field.degree")}</Label>
                            <Input value={ed.degree} onChange={(e) => patchEdu(ed.id, { degree: e.target.value })} placeholder="BSc, MBA…" />
                          </div>
                          <div>
                            <Label>{t("field.fieldOfStudy")}</Label>
                            <Input value={ed.field} onChange={(e) => patchEdu(ed.id, { field: e.target.value })} placeholder="Computer Science" />
                          </div>
                          <div>
                            <Label>{t("field.startYear")}</Label>
                            <Input value={ed.start} onChange={(e) => patchEdu(ed.id, { start: e.target.value })} placeholder="2016" />
                          </div>
                          <div>
                            <Label>{t("field.endYear")}</Label>
                            <Input value={ed.end} onChange={(e) => patchEdu(ed.id, { end: e.target.value })} placeholder="2020" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            ) : (
              <motion.div
                key="cover-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <SectionCard
                  icon={<Mail className="h-4 w-4" />}
                  title={t("cover.title")}
                  subtitle={t("cover.subtitle")}
                  action={
                    <Button onClick={generateCover} loading={coverAi} size="sm">
                      {!coverAi && <Sparkles className="h-3.5 w-3.5" />}
                      {cover.content.trim() ? t("ai.regenerate") : t("ai.generate")}
                    </Button>
                  }
                >
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <Label>{t("cover.company")}</Label>
                        <Input value={cover.company} onChange={(e) => setCover((c) => ({ ...c, company: e.target.value }))} placeholder="Acme Corp" />
                      </div>
                      <div>
                        <Label>{t("cover.role")}</Label>
                        <Input
                          value={cover.role}
                          onChange={(e) => setCover((c) => ({ ...c, role: e.target.value }))}
                          placeholder={content.targetJobTitle || "Target role"}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t("cover.tone")}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {(["professional", "friendly", "bold", "confident", "modern"] as const).map((tn) => (
                          <button
                            key={tn}
                            type="button"
                            onClick={() => setCover((c) => ({ ...c, tone: tn }))}
                            className={cx(
                              "cursor-pointer rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-all",
                              cover.tone === tn
                                ? "border-accent bg-accent-soft text-accent-deep"
                                : "border-line bg-surface text-ink-2 hover:border-line-strong",
                            )}
                          >
                            {t(`cover.tone.${tn}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>{t("cover.jd")}</Label>
                      <Textarea
                        rows={6}
                        value={cover.jobDescription}
                        onChange={(e) => setCover((c) => ({ ...c, jobDescription: e.target.value }))}
                        placeholder="Paste the job posting here — the letter will mirror its keywords and priorities."
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>{t("cover.letterEditable")}</Label>
                        {cover.content.trim() && <SaveChip state={coverSave} />}
                      </div>
                      {coverAi ? (
                        <div className="ai-shimmer h-[220px] rounded-lg border border-line" />
                      ) : (
                        <Textarea
                          rows={13}
                          value={cover.content}
                          onChange={(e) => setCover((c) => ({ ...c, content: e.target.value }))}
                          placeholder="Your generated letter appears here. Every edit autosaves and shows in the preview."
                        />
                      )}
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ------------------------------ right: live preview ------------------------------ */}
        <div ref={previewRef} className="min-w-0">
          <div className="sticky top-[72px] rounded-xl border border-line bg-surface-2/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[12px] font-bold tracking-wide text-muted uppercase">{doc === "resume" ? t("builder.livePreview") : t("builder.coverPreview")}</p>
              <div className="flex items-center gap-2">
                {doc === "resume" && <AtsScore content={content} jobDescription={cover.jobDescription} compact />}
                <span className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                  {doc === "resume" ? `${activeTemplate.name} · A4` : "A4"}
                </span>
              </div>
            </div>
            <div className="flex justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${doc}-${template}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.22 }}
                >
                  {doc === "resume" ? (
                    <SheetPreview width={Math.min(previewW, 794)}>
                      <ResumeSheet content={content} template={template} qrDataUrl={qrDataUrl} />
                    </SheetPreview>
                  ) : (
                    <SheetPreview width={Math.min(previewW, 794)}>
                      <CoverLetterSheet letter={cover.content} personal={content.personal} company={cover.company} />
                    </SheetPreview>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-muted">
                <ExternalLink className="mr-1 inline h-3 w-3" />
                {t("builder.printHint")}
              </p>
              <div className="flex shrink-0 gap-2">
                <a href={`/print/${initial.id}?doc=${doc}`} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    <Download className="h-3.5 w-3.5" /> {t("builder.printExport")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
