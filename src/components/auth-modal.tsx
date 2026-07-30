"use client";

import { motion } from "framer-motion";
import { ArrowRight, KeyRound, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Dialog, Input, Label } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useLang } from "@/components/language-provider";

type Mode = "login" | "register" | "google";

/** Honour an explicit ?next=, otherwise open the Builder on the seeded resume. */
function resolveDestination(next: string | undefined, resumeId?: string): string {
  if (next && next.startsWith("/") && next !== "/dashboard") return next;
  return resumeId ? `/builder/${resumeId}` : "/dashboard";
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.87 8.88 4.76 12 4.76Z" />
    </svg>
  );
}

export function AuthModal({
  open,
  onClose,
  next,
}: {
  open: boolean;
  onClose: () => void;
  next?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reset = (m: Mode) => {
    setMode(m);
    setError("");
    setFieldErr({});
  };

  const validate = () => {
    const fe: Record<string, string> = {};
    if (mode === "register" && name.trim().length < 2) fe.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) fe.email = "Enter a valid email address.";
    if (password.length < 8) fe.password = "Password must be at least 8 characters.";
    setFieldErr(fe);
    return Object.keys(fe).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      toast({
        variant: "success",
        title: mode === "register" ? "Account created" : "Welcome back",
        description: `Signed in as ${data.user.email}`,
      });
      onClose();
      router.push(resolveDestination(next, data.resumeId));
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Google sign-in failed.");
        setLoading(false);
        return;
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      toast({ variant: "success", title: "Signed in with Google", description: data.user.email });
      onClose();
      // Straight into the split-screen editor, never the dashboard detour.
      router.push(resolveDestination(next, data.resumeId));
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "register" ? t("auth.register.title") : mode === "google" ? t("auth.google.title") : t("auth.signin.title")}
      description={mode === "google" ? t("auth.google.desc") : mode === "register" ? t("auth.register.desc") : t("auth.signin.desc")}
    >
      {mode !== "google" ? (
        <>
          <button
            type="button"
            onClick={() => reset("google")}
            className="flex h-10.5 w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-line-strong bg-surface text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            <GoogleG className="h-4.5 w-4.5" />
            {t("auth.continueGoogle")}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">{t("auth.orEmail")}</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-3.5" noValidate>
            {mode === "register" && (
              <div>
                <Label htmlFor="auth-name">{t("auth.fullName")}</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input id="auth-name" className="pl-9" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                {fieldErr.name && <p className="mt-1 text-[12px] font-medium text-danger">{fieldErr.name}</p>}
              </div>
            )}
            <div>
              <Label htmlFor="auth-email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="auth-email"
                  className="pl-9"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {fieldErr.email && <p className="mt-1 text-[12px] font-medium text-danger">{fieldErr.email}</p>}
            </div>
            <div>
              <Label htmlFor="auth-password">{t("auth.password")}</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="auth-password"
                  className="pl-9"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {fieldErr.password && <p className="mt-1 text-[12px] font-medium text-danger">{fieldErr.password}</p>}
            </div>

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] font-medium text-danger">{error}</div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === "register" ? t("auth.createAccount") : t("auth.signIn")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-4 text-center text-[13px] text-muted">
            {mode === "register" ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
            <button
              onClick={() => reset(mode === "register" ? "login" : "register")}
              className="cursor-pointer font-semibold text-accent hover:underline"
            >
              {mode === "register" ? t("auth.signIn") : t("auth.createOne")}
            </button>
          </p>
        </>
      ) : (
        <div>
          <div className="rounded-lg border border-line bg-surface-2/60 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">A</div>
              <div>
                <p className="text-sm font-semibold text-ink">Alex Morgan</p>
                <p className="text-[12.5px] text-muted">alex.morgan@gmail.com</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">
              A demo Google identity will be created (or reused) on this workspace. No real Google account is contacted.
            </p>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] font-medium text-danger">{error}</div>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => reset("login")} disabled={loading}>
              {t("auth.back")}
            </Button>
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button className="w-full" loading={loading} onClick={googleSignIn}>
                <GoogleG className="h-4 w-4" />
                {t("auth.continue")}
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
