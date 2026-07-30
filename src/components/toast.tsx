"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastVariant = "success" | "error" | "info" | "ai";
interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const ToastContext = createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-4.5 w-4.5 text-ok" />,
  error: <AlertCircle className="h-4.5 w-4.5 text-danger" />,
  info: <Info className="h-4.5 w-4.5 text-ink-2" />,
  ai: <Sparkles className="h-4.5 w-4.5 text-accent" />,
};

const BARS: Record<ToastVariant, string> = {
  success: "bg-ok",
  error: "bg-danger",
  info: "bg-ink-2/50",
  ai: "bg-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++idRef.current;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
        <div className="fixed bottom-4 right-4 z-200 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="relative flex items-start gap-3 overflow-hidden rounded-lg border border-line bg-surface py-3 pl-4 pr-3 shadow-lg shadow-black/15"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${BARS[t.variant]}`} />
                <span className="mt-0.5 shrink-0">{ICONS[t.variant]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
