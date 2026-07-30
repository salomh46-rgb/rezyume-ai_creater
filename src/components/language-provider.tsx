"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DICTS, LOCALE_STORAGE_KEY, translate } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/types";
import { cx } from "@/components/ui";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<Ctx>({
  locale: "en",
  setLocale: () => {},
  t: (key) => translate("en", key),
});

export const useLang = () => useContext(LanguageContext);

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && stored in DICTS) return stored;
  } catch {
    /* ignore */
  }
  const nav = window.navigator.language?.slice(0, 2).toLowerCase();
  if (nav === "ru") return "ru";
  if (nav === "uz") return "uz";
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string) => translate(locale, key);

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLang();
  const [open, setOpen] = useState(false);
  const active = LOCALES.find((l) => l.id === locale) ?? LOCALES[2];

  return (
    <div className={cx("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("lang.switch")}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[12.5px] font-bold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Languages className="h-4 w-4 text-accent" />
        {active.flag}
        <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl shadow-black/15">
            {LOCALES.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLocale(l.id);
                  setOpen(false);
                }}
                className={cx(
                  "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                  locale === l.id ? "bg-accent-soft text-accent-deep" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[10.5px] font-bold tracking-wide text-muted">{l.flag}</span>
                  {l.label}
                </span>
                {locale === l.id && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
