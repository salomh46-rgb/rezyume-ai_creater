"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Copy,
  Download,
  FileText,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { SheetPreview } from "@/components/resume-sheet";
import { LiveResumeSheet } from "@/components/resume-sheet-live";
import { ThemeToggle } from "@/components/theme";
import { useToast } from "@/components/toast";
import { Button, Dialog, EmptyState, Input } from "@/components/ui";
import { AtsScore } from "@/components/ats-score";
import { LanguageSwitcher, useLang } from "@/components/language-provider";
import { formatDate, relativeDate, type ResumeContent, type TemplateId } from "@/lib/types";

export interface ResumeRow {
  id: string;
  title: string;
  template: TemplateId;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
  coverContent: string | null;
}

interface Props {
  user: { id: string; name: string; email: string; provider: string };
  initialResumes: ResumeRow[];
}

export function Dashboard({ user, initialResumes }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResumeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialResumes;
    return initialResumes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.content.targetJobTitle.toLowerCase().includes(q) ||
        r.content.personal.fullName.toLowerCase().includes(q),
    );
  }, [initialResumes, query]);

  const createResume = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ variant: "success", title: "Resume created", description: "Let's make it unforgettable." });
      router.push(`/builder/${data.resume.id}`);
    } catch (e) {
      toast({ variant: "error", title: "Could not create resume", description: e instanceof Error ? e.message : undefined });
      setCreating(false);
    }
  };

  const duplicate = async (r: ResumeRow) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/resumes/${r.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ variant: "success", title: "Duplicated", description: `Created "${data.resume.title}".` });
      router.refresh();
    } catch (e) {
      toast({ variant: "error", title: "Duplicate failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ variant: "success", title: "Resume deleted", description: `"${deleteTarget.title}" was removed.` });
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      toast({ variant: "error", title: "Delete failed", description: e instanceof Error ? e.message : undefined });
    } finally {
      setDeleting(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" aria-label="Back to home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="hidden h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink-2 sm:flex">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10.5px] font-bold text-accent-ink">
                {user.name.charAt(0).toUpperCase()}
              </span>
              {user.email}
            </span>
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{t("dash.title")}</h1>
            <p className="mt-1 text-[14px] text-muted">
              {initialResumes.length} {t("dash.subtitle")} {user.name}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dash.search")}
                className="w-56 pl-9"
                aria-label="Search resumes"
              />
            </div>
            <Button onClick={createResume} loading={creating}>
              <Plus className="h-4 w-4" />
              {t("dash.new")}
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {initialResumes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title={t("dash.empty.title")}
              body={t("dash.empty.body")}
              action={
                <Button onClick={createResume} loading={creating} size="lg">
                  <Plus className="h-4 w-4" />
                  {t("dash.empty.cta")}
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" />}
              title={t("dash.noMatch")}
              body={t("dash.noMatch.body")}
              action={
                <Button variant="outline" onClick={() => setQuery("")}>
                  {t("dash.clearSearch")}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r, i) => (
                <motion.article
                  key={r.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/8"
                >
                  <Link href={`/builder/${r.id}`} className="relative block overflow-hidden border-b border-line bg-bg p-4" aria-label={`Edit ${r.title}`}>
                    <div className="pointer-events-none origin-top-left">
                      <SheetPreview width={228}>
                        <LiveResumeSheet content={r.content} template={r.template} style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.12)" }} />
                      </SheetPreview>
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                      <span className="flex items-center gap-2 rounded-lg bg-surface px-3.5 py-2 text-[13px] font-bold text-ink shadow-md">
                        <Pencil className="h-3.5 w-3.5" /> {t("dash.openEditor")}
                      </span>
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-bold text-ink">{r.title}</h2>
                        <p className="truncate text-[12.5px] text-muted">
                          {r.content.targetJobTitle || r.content.personal.fullName || "No target role yet"}
                        </p>
                      </div>
                      {r.coverContent && r.coverContent.trim() ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-bold text-ok">
                          <Mail className="h-3 w-3" /> {t("dash.letter")}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {t("dash.created")} {formatDate(r.createdAt)} · {t("dash.edited")} {relativeDate(r.updatedAt)}
                      </p>
                      <AtsScore content={r.content} compact />
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3.5">
                      <Link href={`/builder/${r.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Pencil className="h-3.5 w-3.5" /> {t("dash.edit")}
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => duplicate(r)} loading={busyId === r.id} aria-label={`Duplicate ${r.title}`}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <a href={`/print/${r.id}`} target="_blank" rel="noreferrer" aria-label={`Download ${r.title} as PDF`}>
                        <Button variant="ghost" size="sm">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                      <Button variant="dangerSoft" size="sm" onClick={() => setDeleteTarget(r)} aria-label={`Delete ${r.title}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("dash.deleteTitle")}
        description={`"${deleteTarget?.title}" ${t("dash.deleteDesc")}`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t("dash.cancel")}
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleting}>
            <Trash2 className="h-4 w-4" />
            {t("dash.deleteBtn")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
