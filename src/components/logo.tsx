export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--accent)" />
      <rect x="8" y="8" width="16" height="2.6" rx="1.3" fill="var(--accent-ink)" opacity="0.95" />
      <rect x="8" y="13.2" width="11" height="2.2" rx="1.1" fill="var(--accent-ink)" opacity="0.65" />
      <rect x="8" y="17.6" width="13" height="2.2" rx="1.1" fill="var(--accent-ink)" opacity="0.65" />
      <rect x="8" y="22" width="8" height="2.2" rx="1.1" fill="var(--accent-ink)" opacity="0.65" />
      <path
        d="M23.5 16.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1 1-2.6z"
        fill="var(--accent-ink)"
      />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="h-7 w-7 shrink-0" />
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight text-ink">
          ResumAI <span className="text-accent">Hub</span>
        </span>
      )}
    </span>
  );
}
