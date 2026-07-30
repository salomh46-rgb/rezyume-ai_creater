import type { CSSProperties, ReactNode } from "react";
import { SKILL_LEVELS, type PersonalInfo, type ResumeContent, type SkillEntry, type TemplateId } from "@/lib/types";

export const SHEET_W = 794;
export const SHEET_H = 1123;

/* A4 sheet rendered at 96dpi (794 x 1123 px == 210 x 297 mm). */

function contactLine(p: PersonalInfo): string[] {
  return [p.email, p.phone, p.location, p.website].map((s) => s.trim()).filter(Boolean);
}

function metaLine(p: PersonalInfo): string[] {
  const out: string[] = [];
  if (p.telegram.trim()) out.push(`Telegram: ${p.telegram.trim()}`);
  if (p.citizenship.trim()) out.push(`Citizenship: ${p.citizenship.trim()}`);
  if (p.drivingLicense.trim()) out.push(`License: ${p.drivingLicense.trim()}`);
  if (p.workFormat.trim()) out.push(p.workFormat.trim());
  return out;
}

function filterBullets(b: string[]): string[] {
  return b.map((s) => s.trim()).filter(Boolean);
}

function Photo({ src, show = true, className, style }: { src: string; show?: boolean; className?: string; style?: CSSProperties }) {
  if (!src || !show) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} style={{ objectFit: "cover", aspectRatio: "3 / 4", ...style }} />;
}

function QrBlock({
  src,
  label,
  size,
  tone = "light",
  className,
}: {
  src: string;
  label: string;
  size: number;
  tone?: "light" | "dark";
  className?: string;
}) {
  if (!src) return null;
  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ""}`}>
      <div className="rounded-md bg-white p-[3px]" style={{ boxShadow: tone === "dark" ? "none" : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="QR code" style={{ width: size, height: size, display: "block" }} />
      </div>
      {label && (
        <span
          className="text-[8px] font-semibold tracking-wide uppercase"
          style={{ color: tone === "dark" ? "#8B93A1" : "#8A8F98" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export function ResumeSheet({
  content,
  template,
  className,
  style,
  qrDataUrl = "",
}: {
  content: ResumeContent;
  template: TemplateId;
  className?: string;
  style?: CSSProperties;
  qrDataUrl?: string;
}) {
  const T = template === "tech" ? TechSheet : template === "executive" ? ExecutiveSheet : MinimalistSheet;
  return (
    <div
      className={`overflow-hidden bg-white text-left text-[#26292E] shadow-[0_2px_24px_rgba(0,0,0,0.18)] ${className ?? ""}`}
      style={{ width: SHEET_W, minHeight: SHEET_H, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact", ...style }}
    >
      <T c={content} qr={qrDataUrl} />
    </div>
  );
}

/* ----------------------------- skill badges ----------------------------- */

function levelDots(level: string, fg: string, bg: string) {
  const n = SKILL_LEVELS.find((l) => l.value === level)?.pct ?? 50;
  const filled = Math.round(n / 25);
  return (
    <span className="inline-flex items-center gap-[2px]">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className="inline-block h-[5px] w-[11px] rounded-[1.5px]" style={{ backgroundColor: i <= filled ? fg : bg }} />
      ))}
    </span>
  );
}

function SkillBadges({ skills, tone }: { skills: SkillEntry[]; tone: "minimal" | "tech" | "executive" }) {
  if (skills.length === 0) return null;
  const baseCls =
    tone === "tech"
      ? "rounded border border-[#333A46] bg-[#1F242E] text-[#C8CDD6]"
      : tone === "executive"
        ? "rounded-full border border-[#D8CFBF] bg-[#FAF6EE] text-[#5B4326]"
        : "rounded-full border border-[#F0D9C8] bg-[#FCF0E7] text-[#9A431E]";
  const barBg = tone === "tech" ? "#333A46" : tone === "executive" ? "#D8CFBF" : "#F0D9C8";
  const barFg = tone === "tech" ? "#E5733F" : tone === "executive" ? "#7C5E33" : "#BC5327";
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span key={s.name} className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold ${baseCls}`}>
          {s.name}
          {levelDots(s.level, barFg, barBg)}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------ Minimalist ----------------------------- */

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 mt-6 first:mt-0">
      <h3 className="text-[11px] font-bold tracking-[0.18em] text-[#8A8F98] uppercase">{children}</h3>
      <div className="mt-1.5 h-px w-full bg-[#E4E4E0]" />
    </div>
  );
}

function MinimalistSheet({ c, qr }: { c: ResumeContent; qr: string }) {
  const p = c.personal;
  const name = p.fullName.trim() || "Your Name";
  const meta = metaLine(p);
  return (
    <div className="px-14 py-12" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-[#1E2126]">{name}</h1>
          {c.targetJobTitle.trim() && <p className="mt-1 text-[13.5px] font-semibold text-[#BC5327]">{c.targetJobTitle}</p>}
          {contactLine(p).length > 0 && <p className="mt-2.5 text-[11px] leading-relaxed text-[#6B7078]">{contactLine(p).join("   ·   ")}</p>}
          {meta.length > 0 && <p className="mt-1 text-[10.5px] leading-relaxed text-[#8A8F98]">{meta.join("   ·   ")}</p>}
        </div>
        <div className="flex shrink-0 items-start gap-3">
          {p.photo && <Photo src={p.photo} show={p.showPhoto !== false} className="h-[112px] w-[84px] shrink-0 rounded-lg border border-[#E4E4E0]" />}
          <QrBlock src={qr} label={c.qr?.label ?? ""} size={72} />
        </div>
      </header>

      <div className="mt-7">
        {c.summary.trim() && (
          <section>
            <SectionTitle>Profile</SectionTitle>
            <p className="text-[12.5px] leading-[1.55] text-[#3A3E45]">{c.summary}</p>
          </section>
        )}

        {c.experiences.some((e) => e.role.trim() || e.company.trim()) && (
          <section>
            <SectionTitle>Experience</SectionTitle>
            <div className="space-y-5">
              {c.experiences
                .filter((e) => e.role.trim() || e.company.trim())
                .map((e) => (
                  <div key={e.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="text-[13.5px] font-bold text-[#1E2126]">
                        {e.role.trim() || "Role"}
                        {e.company.trim() && <span className="font-semibold text-[#6B7078]"> · {e.company}</span>}
                      </h4>
                      <span className="shrink-0 text-[11px] font-medium text-[#8A8F98]">
                        {[e.start, e.current ? "Present" : e.end].filter(Boolean).join(" — ")}
                      </span>
                    </div>
                    {e.location.trim() && <p className="text-[11px] text-[#8A8F98]">{e.location}</p>}
                    {filterBullets(e.bullets).length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {filterBullets(e.bullets).map((b, i) => (
                          <li key={i} className="flex gap-2 text-[12.5px] leading-[1.5] text-[#3A3E45]">
                            <span className="mt-[8px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#BC5327]" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {c.skills.length > 0 && (
          <section>
            <SectionTitle>Skills</SectionTitle>
            <SkillBadges skills={c.skills} tone="minimal" />
          </section>
        )}

        {c.education.some((e) => e.school.trim()) && (
          <section>
            <SectionTitle>Education</SectionTitle>
            <div className="space-y-2.5">
              {c.education
                .filter((e) => e.school.trim())
                .map((e) => (
                  <div key={e.id} className="flex items-baseline justify-between gap-4">
                    <p className="text-[12.5px] text-[#3A3E45]">
                      <span className="font-bold text-[#1E2126]">{e.school}</span>
                      {(e.degree.trim() || e.field.trim()) && <span> — {[e.degree, e.field].filter(Boolean).join(" in ")}</span>}
                    </p>
                    <span className="shrink-0 text-[11px] font-medium text-[#8A8F98]">{[e.start, e.end].filter(Boolean).join(" — ")}</span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Tech --------------------------------- */

function TechLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#8B93A1] uppercase">{children}</p>;
}

function TechSheet({ c, qr }: { c: ResumeContent; qr: string }) {
  const p = c.personal;
  const name = p.fullName.trim() || "Your Name";
  const contacts: [string, string][] = (
    [
      ["mail", p.email],
      ["tel", p.phone],
      ["loc", p.location],
      ["web", p.website],
      ["tg", p.telegram],
    ] as [string, string][]
  ).filter(([, v]) => v.trim());
  const extras = [p.citizenship, p.drivingLicense, p.workFormat].map((s) => s.trim()).filter(Boolean);

  return (
    <div className="flex" style={{ fontFamily: "var(--font-sans), sans-serif", minHeight: SHEET_H }}>
      <aside className="w-[250px] shrink-0 bg-[#171A21] px-7 py-10 text-[#E8EAEF]">
        {p.photo && <Photo src={p.photo} show={p.showPhoto !== false} className="mb-4 h-[110px] w-[84px] rounded-lg border-2 border-[#E5733F]/60" />}
        <p className="font-mono text-[10px] text-[#E5733F]">~/profile</p>
        <h1 className="font-display mt-3 text-[24px] font-bold leading-tight tracking-tight">{name}</h1>
        {c.targetJobTitle.trim() && <p className="mt-1.5 text-[12.5px] font-semibold text-[#E5733F]">{c.targetJobTitle}</p>}

        <div className="mt-8">
          <TechLabel>Contact</TechLabel>
          <ul className="space-y-2">
            {contacts.map(([k, v]) => (
              <li key={k} className="break-words text-[11px] leading-snug text-[#B9BFCA]">
                <span className="font-mono text-[9.5px] text-[#E5733F]">{k}:</span> {v}
              </li>
            ))}
          </ul>
          {extras.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-[#2B313D] pt-3">
              {extras.map((e) => (
                <li key={e} className="text-[10.5px] leading-snug text-[#8B93A1]">
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>

        {c.skills.length > 0 && (
          <div className="mt-8">
            <TechLabel>Skills</TechLabel>
            <SkillBadges skills={c.skills} tone="tech" />
          </div>
        )}

        {c.education.some((e) => e.school.trim()) && (
          <div className="mt-8">
            <TechLabel>Education</TechLabel>
            <div className="space-y-3">
              {c.education
                .filter((e) => e.school.trim())
                .map((e) => (
                  <div key={e.id}>
                    <p className="text-[11.5px] font-semibold leading-snug">{e.school}</p>
                    <p className="text-[10.5px] text-[#B9BFCA]">{[e.degree, e.field].filter(Boolean).join(", ")}</p>
                    <p className="font-mono text-[9.5px] text-[#79808D]">{[e.start, e.end].filter(Boolean).join("–")}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {qr && (
          <div className="mt-8">
            <TechLabel>Scan me</TechLabel>
            <QrBlock src={qr} label={c.qr?.label ?? ""} size={84} tone="dark" className="items-start" />
          </div>
        )}
      </aside>

      <main className="flex-1 px-9 py-10">
        {c.summary.trim() && (
          <section>
            <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#BC5327] uppercase">// summary</h2>
            <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[#3A3E45]">{c.summary}</p>
          </section>
        )}

        {c.experiences.some((e) => e.role.trim() || e.company.trim()) && (
          <section className="mt-7">
            <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#BC5327] uppercase">// experience</h2>
            <div className="mt-3 space-y-6 border-l-2 border-[#F0E3DA] pl-5">
              {c.experiences
                .filter((e) => e.role.trim() || e.company.trim())
                .map((e) => (
                  <div key={e.id} className="relative">
                    <span className="absolute top-[5px] -left-[26.5px] h-[9px] w-[9px] rounded-full bg-[#BC5327]" />
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[13.5px] font-bold text-[#1E2126]">{e.role.trim() || "Role"}</h3>
                      <span className="font-mono shrink-0 text-[10.5px] text-[#8A8F98]">
                        {[e.start, e.current ? "now" : e.end].filter(Boolean).join(" → ")}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-[#BC5327]">
                      {e.company.trim() || "Company"}
                      {e.location.trim() && <span className="font-normal text-[#8A8F98]"> · {e.location}</span>}
                    </p>
                    {filterBullets(e.bullets).length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {filterBullets(e.bullets).map((b, i) => (
                          <li key={i} className="flex gap-2 text-[12.5px] leading-[1.5] text-[#3A3E45]">
                            <span className="mt-[2px] font-mono text-[10px] text-[#BC5327]">▸</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Executive ------------------------------ */

function ExecSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-[12px] font-bold tracking-[0.24em] text-[#7C5E33] uppercase" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
          {title}
        </h3>
        <div className="h-px flex-1 bg-[#D8CFBF]" />
      </div>
      {children}
    </section>
  );
}

function ExecutiveSheet({ c, qr }: { c: ResumeContent; qr: string }) {
  const p = c.personal;
  const name = p.fullName.trim() || "Your Name";
  const meta = metaLine(p);
  return (
    <div className="relative px-14 py-11" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
      {qr && <QrBlock src={qr} label={c.qr?.label ?? ""} size={64} className="absolute top-11 right-14" />}
      <header className="flex flex-col items-center text-center">
        {p.photo && <Photo src={p.photo} show={p.showPhoto !== false} className="mb-4 h-[108px] w-[81px] rounded-md border border-[#D8CFBF] shadow-sm" />}
        <h1 className="text-[32px] font-semibold tracking-[0.02em] text-[#23262B]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
          {name}
        </h1>
        {c.targetJobTitle.trim() && <p className="mt-1 text-[12.5px] font-semibold tracking-[0.14em] text-[#7C5E33] uppercase">{c.targetJobTitle}</p>}
        <div className="mx-auto mt-3.5 h-[3px] w-14 bg-[#7C5E33]" />
        {contactLine(p).length > 0 && <p className="mt-3 text-[10.5px] text-[#6B7078]">{contactLine(p).join("    |    ")}</p>}
        {meta.length > 0 && <p className="mt-1 text-[10px] text-[#8A8F98]">{meta.join("    |    ")}</p>}
      </header>

      {c.summary.trim() && (
        <ExecSection title="Executive Summary">
          <p className="text-center text-[12.5px] leading-[1.6] text-[#3A3E45] italic" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
            {c.summary}
          </p>
        </ExecSection>
      )}

      {c.experiences.some((e) => e.role.trim() || e.company.trim()) && (
        <ExecSection title="Professional Experience">
          <div className="space-y-5">
            {c.experiences
              .filter((e) => e.role.trim() || e.company.trim())
              .map((e) => (
                <div key={e.id} className="grid grid-cols-[1fr_130px] gap-x-6">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#23262B]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                      {e.role.trim() || "Role"}
                    </h4>
                    <p className="text-[12px] font-semibold text-[#7C5E33]">
                      {e.company.trim() || "Company"}
                      {e.location.trim() && <span className="font-normal text-[#8A8F98]"> — {e.location}</span>}
                    </p>
                    {filterBullets(e.bullets).length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {filterBullets(e.bullets).map((b, i) => (
                          <li key={i} className="flex gap-2 text-[12px] leading-[1.5] text-[#3A3E45]">
                            <span className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#7C5E33]" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="text-right text-[10.5px] font-semibold tracking-wide text-[#8A8F98]">
                    {[e.start, e.current ? "Present" : e.end].filter(Boolean).join(" — ")}
                  </p>
                </div>
              ))}
          </div>
        </ExecSection>
      )}

      <div className="grid grid-cols-2 gap-8">
        {c.skills.length > 0 && (
          <ExecSection title="Core Competencies">
            <SkillBadges skills={c.skills} tone="executive" />
          </ExecSection>
        )}
        {c.education.some((e) => e.school.trim()) && (
          <ExecSection title="Education">
            <div className="space-y-2">
              {c.education
                .filter((e) => e.school.trim())
                .map((e) => (
                  <div key={e.id}>
                    <p className="text-[12px] font-bold text-[#23262B]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                      {e.school}
                    </p>
                    <p className="text-[11.5px] text-[#3A3E45]">{[e.degree, e.field].filter(Boolean).join(", ")}</p>
                    <p className="text-[10.5px] text-[#8A8F98]">{[e.start, e.end].filter(Boolean).join(" — ")}</p>
                  </div>
                ))}
            </div>
          </ExecSection>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Cover letter --------------------------- */

export function CoverLetterSheet({
  letter,
  personal,
  company,
}: {
  letter: string;
  personal: PersonalInfo;
  company: string;
}) {
  const paragraphs = letter.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return (
    <div
      className="overflow-hidden bg-white text-[#26292E] shadow-[0_2px_24px_rgba(0,0,0,0.18)]"
      style={{
        width: SHEET_W,
        minHeight: SHEET_H,
        fontFamily: "var(--font-sans), sans-serif",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <div className="px-16 py-14">
        <header className="flex items-center justify-between gap-6 border-b-2 border-[#23262B] pb-5">
          <div>
            <h1 className="font-display text-[24px] font-bold tracking-tight text-[#1E2126]">{personal.fullName.trim() || "Your Name"}</h1>
            <p className="mt-1.5 text-[11px] text-[#6B7078]">{contactLine(personal).join("   ·   ")}</p>
          </div>
          {personal.photo && <Photo src={personal.photo} className="h-[70px] w-[52.5px] shrink-0 rounded-md border border-[#E4E4E0]" />}
        </header>

        <div className="mt-8 text-[12.5px] leading-relaxed text-[#3A3E45]">
          <p>{today}</p>
          <p className="mt-4 font-semibold text-[#23262B]">{company.trim() || "Hiring Team"}</p>

          <div className="mt-6 space-y-4">
            {paragraphs.map((para, i) =>
              /^(sincerely|с уважением|hurmat bilan)/i.test(para) ? (
                <div key={i}>
                  <p>{para.split("\n")[0]}</p>
                  <p className="mt-6 text-[15px] font-semibold text-[#1E2126]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                    {personal.fullName.trim() || "Your Name"}
                  </p>
                </div>
              ) : (
                <p key={i}>{para}</p>
              ),
            )}
            {paragraphs.length === 0 && <p className="text-[#8A8F98] italic">Your generated cover letter will appear here…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Scaled preview -------------------------- */

export function SheetPreview({ children, width }: { children: ReactNode; width: number }) {
  const scale = width / SHEET_W;
  return (
    <div style={{ width, height: SHEET_H * scale }} className="relative overflow-hidden">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: SHEET_W }}>{children}</div>
    </div>
  );
}
