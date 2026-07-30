"use client";

import { motion } from "framer-motion";
import { Check, Plus, Target, X } from "lucide-react";
import { useMemo } from "react";
import { computeAtsScore, matchKeywords, scoreTone } from "@/lib/ats";
import type { ResumeContent } from "@/lib/types";
import { cx } from "@/components/ui";
import { useLang } from "@/components/language-provider";

const RING_COLORS: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  danger: "var(--danger)",
};

export function AtsScore({
  content,
  jobDescription = "",
  compact,
}: {
  content: ResumeContent;
  jobDescription?: string;
  compact?: boolean;
}) {
  const result = useMemo(() => computeAtsScore(content, jobDescription), [content, jobDescription]);
  const tone = scoreTone(result.score);
  const color = RING_COLORS[tone];

  const size = compact ? 52 : 76;
  const stroke = compact ? 5 : 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (result.score / 100) * c;

  return (
    <div className={cx("flex items-start gap-4", compact && "gap-3")}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cx("font-display font-bold text-ink", compact ? "text-[13px]" : "text-[18px]")}>{result.score}%</span>
        </div>
      </div>

      {!compact && (
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink">ATS compatibility</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted">
            {tone === "ok"
              ? "Great shape — this resume should parse cleanly."
              : tone === "warn"
                ? "Solid start — a few tweaks will help it rank higher."
                : "Needs work — recruiting software may miss key details."}
          </p>
          <ul className="mt-2.5 space-y-1">
            {result.checks
              .filter((ch) => !ch.passed)
              .slice(0, 3)
              .map((ch) => (
                <li key={ch.key} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                  <X className="h-3 w-3 shrink-0 text-danger" /> {ch.label}
                </li>
              ))}
            {result.checks.every((ch) => ch.passed) && (
              <li className="flex items-center gap-1.5 text-[11.5px] text-ok">
                <Check className="h-3 w-3 shrink-0" /> All checks passed
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Keyword matcher — shows how well the resume covers the keywords a
 * recruiter (or the pasted job description) is scanning for, and lets
 * the user add any missing skill with one click.
 */
export function KeywordMatcher({
  content,
  jobDescription = "",
  onAddSkill,
}: {
  content: ResumeContent;
  jobDescription?: string;
  onAddSkill: (skill: string) => void;
}) {
  const { t } = useLang();
  const km = useMemo(() => matchKeywords(content, jobDescription), [content, jobDescription]);
  const tone = km.coverage >= 75 ? "ok" : km.coverage >= 45 ? "warn" : "danger";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
          <Target className="h-3.5 w-3.5 text-accent" />
          {t("ats.keywords")}
        </p>
        <span
          className={cx(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            tone === "ok" ? "bg-ok-soft text-ok" : tone === "warn" ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger",
          )}
        >
          {km.coverage}%
        </span>
      </div>

      <p className="mt-1 text-[11.5px] leading-snug text-muted">
        {km.fromJobDescription ? t("ats.fromJd") : t("ats.fromRole")}
      </p>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className={cx("h-full rounded-full", tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-danger")}
          initial={{ width: 0 }}
          animate={{ width: `${km.coverage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {km.matched.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{t("ats.matched")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {km.matched.slice(0, 10).map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] font-semibold text-ok">
                <Check className="h-3 w-3" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {km.missing.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{t("ats.missing")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {km.missing.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAddSkill(s)}
                title={t("ats.addSkill")}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-line-strong bg-surface px-2 py-0.5 text-[11.5px] font-semibold text-ink-2 transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-deep"
              >
                <Plus className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ok">
          <Check className="h-3.5 w-3.5" /> {t("ats.allCovered")}
        </p>
      )}
    </div>
  );
}
