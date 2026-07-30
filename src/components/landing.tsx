"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Download,
  Eye,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { Logo } from "@/components/logo";
import { SheetPreview } from "@/components/resume-sheet";
import { LiveResumeSheet } from "@/components/resume-sheet-live";
import { ThemeToggle } from "@/components/theme";
import { useToast } from "@/components/toast";
import { Button, Segmented, cx } from "@/components/ui";
import { LanguageSwitcher, useLang } from "@/components/language-provider";
import { sampleContent, TEMPLATES, type TemplateId } from "@/lib/types";

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export function Landing({ initialAuthOpen, next }: { initialAuthOpen?: boolean; next?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(!!initialAuthOpen);
  const [demoName, setDemoName] = useState("");
  const [demoRole, setDemoRole] = useState("");
  const [demoTemplate, setDemoTemplate] = useState<TemplateId>("tech");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const demoContent = useMemo(() => {
    const c = sampleContent();
    if (demoName.trim()) c.personal.fullName = demoName.trim();
    if (demoRole.trim()) c.targetJobTitle = demoRole.trim();
    return c;
  }, [demoName, demoRole]);

  const openBuilder = async () => {
    if (launching) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.resumeId) throw new Error(data.error ?? "no resume");
      if (!data.reused) {
        toast({ variant: "ai", title: t("demo.ready"), description: t("demo.readyDesc") });
      }
      router.push(`/builder/${data.resumeId}`);
    } catch {
      toast({ variant: "error", title: t("demo.failed") });
      setLaunching(false);
    }
  };

  const primaryCta = () => {
    void openBuilder();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast({ variant: "info", title: "Signed out", description: "See you next time." });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" aria-label="ResumAI Hub home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              [t("nav.features"), "#features"],
              [t("nav.templates"), "#templates"],
              [t("nav.pricing"), "#pricing"],
              [t("nav.stories"), "#testimonials"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    {t("nav.dashboard")}
                  </Button>
                </Link>
                <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[12.5px] font-bold text-accent-deep sm:flex">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <button
                  onClick={signOut}
                  aria-label="Sign out"
                  className="hidden cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:block"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>
                  {t("nav.signin")}
                </Button>
                <Button size="sm" onClick={primaryCta}>
                  {t("nav.getstarted")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="demo" className="dot-grid relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {t("hero.badge")}
            </div>
            <h1 className="font-display mt-5 text-[40px] leading-[1.06] font-bold tracking-tight text-ink sm:text-[52px]">
              {t("hero.title1")}{" "}
              <span className="relative whitespace-nowrap text-accent">
                {t("hero.title2")}
                <svg viewBox="0 0 220 12" className="absolute -bottom-1.5 left-0 w-full" aria-hidden="true">
                  <path d="M3 9c60-6 150-6 214-3" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.35" />
                </svg>
              </span>{" "}
              {t("hero.title3")}
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-2">{t("hero.subtitle")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={primaryCta} loading={launching}>
                {!launching && <Rocket className="h-4 w-4" />}
                {launching ? t("demo.starting") : user ? t("hero.ctaPrimaryUser") : t("hero.ctaPrimary")}
                {!launching && <ArrowRight className="h-4 w-4" />}
              </Button>
              <a href="#templates">
                <Button size="lg" variant="outline">
                  <Eye className="h-4 w-4" />
                  {t("hero.ctaSecondary")}
                </Button>
              </a>
            </div>

            <motion.button
              type="button"
              onClick={openBuilder}
              disabled={launching}
              whileHover={{ scale: launching ? 1 : 1.01 }}
              whileTap={{ scale: launching ? 1 : 0.99 }}
              className="group mt-4 flex w-full max-w-md cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-accent/45 bg-accent-soft/45 px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent-soft disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-ink">{t("hero.demoMode")}</span>
                <span className="block text-[12px] leading-snug text-ink-2">{t("hero.demoModeHint")}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
            </motion.button>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-ok" /> {t("hero.trust1")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-ok" /> {t("hero.trust2")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-ok" /> {t("hero.trust3")}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-3xl bg-accent/8 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-xl border border-line bg-surface shadow-xl shadow-black/8">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
                </div>
                <span className="text-[11.5px] font-semibold tracking-wide text-muted">{t("hero.demoTitle")}</span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[190px_1fr]">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="demo-name" className="mb-1 block text-[11.5px] font-bold text-ink-2">
                      {t("hero.demoName")}
                    </label>
                    <input
                      id="demo-name"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      placeholder="Asqarov Javohirbek"
                      className="h-8.5 w-full rounded-md border border-line bg-bg px-2.5 text-[12.5px] text-ink placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="demo-role" className="mb-1 block text-[11.5px] font-bold text-ink-2">
                      {t("hero.demoRole")}
                    </label>
                    <input
                      id="demo-role"
                      value={demoRole}
                      onChange={(e) => setDemoRole(e.target.value)}
                      placeholder="Full-Stack Developer"
                      className="h-8.5 w-full rounded-md border border-line bg-bg px-2.5 text-[12.5px] text-ink placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-[11.5px] font-bold text-ink-2">{t("hero.demoTemplate")}</span>
                    <div className="flex flex-col gap-1">
                      {TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => setDemoTemplate(tmpl.id)}
                          className={cx(
                            "flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-[12px] font-semibold transition-all",
                            demoTemplate === tmpl.id
                              ? "border-accent bg-accent-soft text-accent-deep"
                              : "border-line bg-bg text-ink-2 hover:border-line-strong"
                          )}
                        >
                          {tmpl.name}
                          {demoTemplate === tmpl.id && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="rounded-md bg-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                    <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
                    {t("hero.demoHint")}
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-line bg-bg p-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={demoTemplate}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <SheetPreview width={330}>
                        <LiveResumeSheet content={demoContent} template={demoTemplate} style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.12)" }} />
                      </SheetPreview>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Templates bo'limida <motion.div> ishlatildi */}
      <section id="templates" className="scroll-mt-20 border-y border-line bg-surface/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fadeUp} className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[13px] font-bold tracking-wide text-accent uppercase">{t("templates.kicker")}</p>
              <h2 className="font-display mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink sm:text-[36px]">{t("templates.title")}</h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-ink-2">{t("templates.subtitle")}</p>
          </motion.div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
           {TEMPLATES.map((tmpl, i) => (
          <motion.div
           key={tmpl.id} // 👈 1. ENGI BIRINCHI O'RINGA QO'YING!
           initial={fadeUp.initial}
           whileInView={fadeUp.whileInView}
           viewport={fadeUp.viewport}
           transition={{ ...fadeUp.transition, delay: i * 0.07 }}
           role="button"
           tabIndex={0}
           onClick={() => {
           setDemoTemplate(tmpl.id);
           document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
           }}
           className="group cursor-pointer overflow-hidden rounded-xl border border-line bg-surface text-left transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-lg hover:shadow-black/8"
            >
                <div className="overflow-hidden border-b border-line bg-bg p-4">
                  <div className="transition-transform duration-300 group-hover:scale-[1.03]">
                    <SheetPreview width={252}>
                      <LiveResumeSheet content={sampleContent()} template={tmpl.id} style={{ boxShadow: "0 1px 10px rgba(0,0,0,0.12)" }} />
                    </SheetPreview>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h3 className="font-display text-[15.5px] font-bold text-ink">{tmpl.name}</h3>
                    <p className="text-[12.5px] text-muted">{tmpl.tagline}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Modal va boshqa bo'limlar */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} next={next} />
    </div>
  );
}