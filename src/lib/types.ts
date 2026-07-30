export type TemplateId = "minimalist" | "tech" | "executive";
export type Locale = "en" | "ru" | "uz";

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  telegram: string;
  citizenship: string;
  drivingLicense: string;
  workFormat: string;
  /** Base64 data URL, pre-cropped to a 3:4 portrait aspect ratio. */
  photo: string;
  /** Toggle to show / hide the photo on the A4 sheet. Defaults to true when photo is set. */
  showPhoto: boolean;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface SkillEntry {
  name: string;
  level: SkillLevel;
}

export const SKILL_LEVELS: { value: SkillLevel; label: Record<Locale, string>; pct: number }[] = [
  { value: "beginner",      label: { en: "Beginner",      ru: "Начинающий",   uz: "Boshlang'ich" }, pct: 25 },
  { value: "intermediate",  label: { en: "Intermediate",  ru: "Средний",      uz: "O'rta"        }, pct: 50 },
  { value: "advanced",      label: { en: "Advanced",      ru: "Продвинутый",  uz: "Yuqori"       }, pct: 75 },
  { value: "expert",        label: { en: "Expert",        ru: "Эксперт",      uz: "Ekspert"      }, pct: 100 },
];

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface QrSettings {
  /** When true a QR code is embedded on the resume sheet. */
  enabled: boolean;
  /** Portfolio / LinkedIn / any URL the QR should point to. */
  url: string;
  label: string;
}

export interface ResumeContent {
  personal: PersonalInfo;
  targetJobTitle: string;
  summary: string;
  experiences: ExperienceEntry[];
  skills: SkillEntry[];
  education: EducationEntry[];
  qr: QrSettings;
}

/** Backward-compatible helper: accepts old string[] OR new SkillEntry[] */
export function normalizeSkills(raw: unknown): SkillEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    if (typeof s === "string") return { name: s, level: "intermediate" as SkillLevel };
    if (s && typeof s === "object" && "name" in s) return { name: String(s.name), level: (s as SkillEntry).level || "intermediate" };
    return { name: String(s), level: "intermediate" as SkillLevel };
  });
}

/** Plain string[] for APIs / ATS / AI that only need names */
export function skillNames(skills: SkillEntry[]): string[] {
  return skills.map((s) => s.name);
}

export function emptyQr(): QrSettings {
  return { enabled: false, url: "", label: "Portfolio" };
}

/**
 * JSONB rows written by older builds may be missing newer fields.
 * Normalising on read keeps the editor and templates crash-free.
 */
export function normalizeContent(raw: Partial<ResumeContent> | null | undefined): ResumeContent {
  const base = emptyContent();
  const p = (raw?.personal ?? {}) as Partial<PersonalInfo>;
  return {
    personal: {
      fullName: p.fullName ?? "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      location: p.location ?? "",
      website: p.website ?? "",
      telegram: p.telegram ?? "",
      citizenship: p.citizenship ?? "",
      drivingLicense: p.drivingLicense ?? "",
      workFormat: p.workFormat ?? "",
      photo: p.photo ?? "",
      showPhoto: p.showPhoto !== false,
    },
    targetJobTitle: raw?.targetJobTitle ?? "",
    summary: raw?.summary ?? "",
    experiences:
      Array.isArray(raw?.experiences) && raw.experiences.length > 0
        ? raw.experiences.map((e) => ({
            id: e?.id ?? uid(),
            role: e?.role ?? "",
            company: e?.company ?? "",
            location: e?.location ?? "",
            start: e?.start ?? "",
            end: e?.end ?? "",
            current: !!e?.current,
            bullets: Array.isArray(e?.bullets) ? e.bullets : [],
          }))
        : base.experiences,
    skills: normalizeSkills(raw?.skills),
    education:
      Array.isArray(raw?.education) && raw.education.length > 0
        ? raw.education.map((e) => ({
            id: e?.id ?? uid(),
            school: e?.school ?? "",
            degree: e?.degree ?? "",
            field: e?.field ?? "",
            start: e?.start ?? "",
            end: e?.end ?? "",
          }))
        : base.education,
    qr: {
      enabled: !!raw?.qr?.enabled,
      url: raw?.qr?.url ?? "",
      label: raw?.qr?.label ?? "Portfolio",
    },
  };
}

export type CoverTone = "professional" | "friendly" | "bold" | "confident" | "modern";

export interface CoverLetterState {
  company: string;
  role: string;
  jobDescription: string;
  tone: CoverTone;
  content: string;
}

export const TEMPLATES: { id: TemplateId; name: string; tagline: string }[] = [
  { id: "minimalist", name: "Minimalist", tagline: "Clean single column" },
  { id: "tech", name: "Tech / Modern", tagline: "Bold sidebar layout" },
  { id: "executive", name: "Executive", tagline: "Formal serif classic" },
];

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: "uz", label: "O'zbek", flag: "UZ" },
  { id: "ru", label: "Русский", flag: "RU" },
  { id: "en", label: "English", flag: "EN" },
];

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emptyPersonal(name = "", email = ""): PersonalInfo {
  return {
    fullName: name,
    email,
    phone: "",
    location: "",
    website: "",
    telegram: "",
    citizenship: "",
    drivingLicense: "",
    workFormat: "",
    photo: "",
    showPhoto: true,
  };
}

export function emptyContent(name = "", email = ""): ResumeContent {
  return {
    personal: emptyPersonal(name, email),
    targetJobTitle: "",
    summary: "",
    experiences: [
      { id: uid(), role: "", company: "", location: "", start: "", end: "", current: false, bullets: [] },
    ],
    skills: [],
    education: [{ id: uid(), school: "", degree: "", field: "", start: "", end: "" }],
    qr: emptyQr(),
  };
}

/**
 * Real-world sample profile used to pre-fill the resume preview / demo state
 * so the product feels alive the moment someone opens it.
 */
export function sampleContent(): ResumeContent {
  return {
    personal: {
      fullName: "Asqarov Javohirbek Iqboljon o'g'li",
      email: "salomh46@gmail.com",
      phone: "+998 (90) 508-33-02",
      location: "Toshkent shahri, Mirobod tumani",
      website: "",
      telegram: "@Dr_eviluz",
      citizenship: "O'zbekiston",
      drivingLicense: "B, C toifa",
      workFormat: "To'liq stavka",
      photo: "",
      showPhoto: true,
    },
    targetJobTitle: "IT Mutaxassis / Full-Stack Developer",
    summary:
      "Python, FastAPI, SQLAlchemy, REST API, HTML, CSS, JavaScript va Tailwind CSS texnologiyalarini chuqur biladigan Full-Stack dasturchiman. Sun'iy intellekt, SMM va developer vositalarini uyg'unlashtirib, zamonaviy va samarali raqamli yechimlar yarataman.",
    experiences: [
      {
        id: uid(),
        role: "Full-Stack Developer",
        company: "Freelance / Shaxsiy loyihalar",
        location: "Toshkent",
        start: "2023",
        end: "Hozirgacha",
        current: true,
        bullets: [
          "FastAPI va SQLAlchemy asosida bir nechta REST API xizmatlarini loyihalashtirdim va production muhitiga chiqardim.",
          "Tailwind CSS va JavaScript yordamida tezkor va moslashuvchan (responsive) foydalanuvchi interfeyslarini ishlab chiqdim.",
          "Sun'iy intellekt vositalarini integratsiya qilib, ish jarayonlarini avtomatlashtirdim va samaradorlikni oshirdim.",
          "SMM va raqamli marketing loyihalari uchun texnik yechimlar taqdim etib, mijozlar sonini oshirishga hissa qo'shdim.",
        ],
      },
    ],
    skills: [
      { name: "Python", level: "expert" },
      { name: "FastAPI", level: "advanced" },
      { name: "SQLAlchemy", level: "advanced" },
      { name: "REST API", level: "expert" },
      { name: "React", level: "intermediate" },
      { name: "JavaScript", level: "advanced" },
      { name: "HTML", level: "expert" },
      { name: "CSS", level: "advanced" },
      { name: "Tailwind CSS", level: "advanced" },
      { name: "PostgreSQL", level: "intermediate" },
      { name: "AI Integration", level: "intermediate" },
      { name: "Git", level: "advanced" },
    ],
    education: [
      { id: uid(), school: "Toshkent Axborot Texnologiyalari Universiteti", degree: "Bakalavr", field: "Dasturiy injiniring", start: "2021", end: "2025" },
    ],
    qr: { enabled: true, url: "https://t.me/Dr_eviluz", label: "Telegram" },
  };
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function relativeDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}
