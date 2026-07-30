import type { ResumeContent } from "@/lib/types";

export interface AtsCheck {
  key: string;
  label: string;
  passed: boolean;
  weight: number;
}

export interface AtsResult {
  score: number;
  checks: AtsCheck[];
}

export interface KeywordMatch {
  /** Skills/keywords found in both the resume and the target. */
  matched: string[];
  /** High-value skills the resume is missing. */
  missing: string[];
  /** 0-100 coverage of the target keyword set. */
  coverage: number;
  /** True when suggestions came from a pasted job description. */
  fromJobDescription: boolean;
}

const HAS_METRIC = /\d/;
const ACTION_VERBS =
  /^(led|built|launched|drove|shipped|designed|created|improved|managed|reduced|increased|automated|delivered|engineered|optimized|spearheaded|architected|streamlined|orchestrated|accelerated|championed|transformed|redesigned|amalga|boshladi|ishlab|tashkil|optimallashtirdi|loyihalashtirdi|tezlashtirdi|rivojlantirdi|avtomatlashtirdi|boshqardi|yaxshiladi|qayta|инициировал|разработал|организовал|оптимизировал|спроектировал|внедрил|ускорил|автоматизировал|возглавил|запустил|улучшил|реализовал)/i;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/* ------------------------------------------------------------------ */
/* Skill library — used to suggest missing, high-signal keywords.      */
/* ------------------------------------------------------------------ */

interface SkillDef {
  name: string;
  aliases: string[];
}

const S = (name: string, ...aliases: string[]): SkillDef => ({ name, aliases: [name, ...aliases] });

const SKILL_LIBRARY: { match: RegExp; skills: SkillDef[] }[] = [
  {
    match: /software|engineer|developer|frontend|backend|full.?stack|devops|sre|platform|dasturchi|программист|разработчик|it\b/i,
    skills: [
      S("Python"), S("FastAPI"), S("Django"), S("SQLAlchemy"), S("REST API", "rest", "api", "apis"),
      S("PostgreSQL", "postgres", "psql"), S("JavaScript", "js"), S("TypeScript", "ts"), S("React", "reactjs", "react.js"),
      S("Next.js", "nextjs", "next"), S("Node.js", "nodejs", "node"), S("Tailwind CSS", "tailwind", "tailwindcss"),
      S("HTML", "html5"), S("CSS", "css3"), S("Git", "github", "gitlab"), S("Docker"), S("Kubernetes", "k8s"),
      S("CI/CD", "cicd", "ci"), S("AWS", "amazon web services"), S("Redis"), S("GraphQL"), S("Testing", "pytest", "jest", "unit tests"),
      S("Linux"), S("AI Integration", "ai", "llm", "openai", "gpt", "machine learning"), S("Microservices"), S("MongoDB"),
    ],
  },
  {
    match: /data|analyst|analytics|scientist|machine learning|ml\b|tahlilchi|аналитик/i,
    skills: [
      S("SQL"), S("Python"), S("Pandas"), S("NumPy"), S("Tableau"), S("Power BI", "powerbi"), S("Excel"),
      S("ETL"), S("dbt"), S("A/B Testing", "ab testing", "experimentation"), S("Data Visualization", "visualization"),
      S("Machine Learning", "ml"), S("Statistics", "statistical"), S("Looker"), S("Airflow"), S("BigQuery"),
    ],
  },
  {
    match: /design|ux|ui|creative|dizayner|дизайнер/i,
    skills: [
      S("Figma"), S("Design Systems", "design system"), S("Prototyping", "prototype"), S("User Research", "research"),
      S("Interaction Design"), S("Visual Design"), S("Accessibility", "a11y", "wcag"), S("Wireframing", "wireframe"),
      S("Usability Testing"), S("Adobe XD"), S("Photoshop"), S("Illustrator"),
    ],
  },
  {
    match: /product\s?manager|pm\b|product owner|mahsulot|менеджер продукта/i,
    skills: [
      S("Roadmapping", "roadmap"), S("Agile"), S("Scrum"), S("Jira"), S("A/B Testing"), S("SQL"),
      S("User Research"), S("Stakeholder Management", "stakeholder"), S("Analytics"), S("OKRs", "okr"), S("Go-to-Market", "gtm"),
    ],
  },
  {
    match: /market|growth|content|seo|social|brand|smm|marketolog|маркетолог/i,
    skills: [
      S("SEO"), S("SMM", "social media"), S("Content Strategy", "content"), S("Google Analytics", "ga4", "analytics"),
      S("Copywriting"), S("Email Marketing", "email"), S("Paid Ads", "ppc", "google ads", "facebook ads"),
      S("CRO"), S("Canva"), S("Meta Ads"),
    ],
  },
  {
    match: /sales|account|business develop|sotuv|продаж/i,
    skills: [
      S("CRM", "salesforce", "hubspot"), S("Negotiation"), S("Prospecting"), S("Forecasting"),
      S("Pipeline Management", "pipeline"), S("Cold Outreach", "cold calling"), S("Account Management"),
    ],
  },
];

const UNIVERSAL = [
  S("Communication"), S("Teamwork", "collaboration"), S("Problem Solving"), S("Project Management"),
  S("English"), S("Time Management"), S("Leadership"),
];

function libraryFor(jobTitle: string): SkillDef[] {
  const hit = SKILL_LIBRARY.find((g) => g.match.test(jobTitle));
  return hit ? [...hit.skills, ...UNIVERSAL] : [...SKILL_LIBRARY[0].skills, ...UNIVERSAL];
}

function resumeHaystack(content: ResumeContent): string {
  return [
    content.summary,
    content.targetJobTitle,
    content.skills.map((s) => (typeof s === "string" ? s : s.name)).join(" "),
    content.experiences.flatMap((e) => [e.role, e.company, ...e.bullets]).join(" "),
    content.education.map((e) => `${e.school} ${e.degree} ${e.field}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function hasSkill(haystack: string, def: SkillDef): boolean {
  return def.aliases.some((a) => haystack.includes(a.toLowerCase()));
}

/**
 * Compares the resume against a pasted job description (preferred) or the
 * target job title, returning matched + missing high-value keywords.
 */
export function matchKeywords(content: ResumeContent, jobDescription = ""): KeywordMatch {
  const haystack = resumeHaystack(content);
  const jd = jobDescription.trim().toLowerCase();
  const library = libraryFor(content.targetJobTitle);
  const fromJobDescription = jd.length > 30;

  // Target set = skills the JD explicitly asks for, else the role's core library.
  const target = fromJobDescription
    ? library.filter((def) => def.aliases.some((a) => jd.includes(a.toLowerCase())))
    : library.slice(0, 16);

  const pool = target.length >= 4 ? target : library.slice(0, 16);

  const matched: string[] = [];
  const missing: string[] = [];
  for (const def of pool) {
    if (hasSkill(haystack, def)) matched.push(def.name);
    else missing.push(def.name);
  }

  const coverage = pool.length > 0 ? Math.round((matched.length / pool.length) * 100) : 0;
  return { matched, missing: missing.slice(0, 8), coverage, fromJobDescription };
}

/**
 * Heuristic ATS (Applicant Tracking System) compatibility score.
 * Mirrors the kind of checks real parsers run: contact completeness,
 * summary quality, quantified achievements, skills coverage, and
 * keyword overlap with the target role / job description.
 */
export function computeAtsScore(content: ResumeContent, jobDescription = ""): AtsResult {
  const checks: AtsCheck[] = [];
  const p = content.personal;

  checks.push({ key: "name", label: "Full name present", passed: p.fullName.trim().length > 1, weight: 6 });
  checks.push({ key: "email", label: "Email address present", passed: /.+@.+\..+/.test(p.email), weight: 6 });
  checks.push({ key: "phone", label: "Phone number present", passed: p.phone.trim().length > 5, weight: 5 });
  checks.push({ key: "location", label: "Location present", passed: p.location.trim().length > 1, weight: 3 });
  checks.push({ key: "title", label: "Target job title set", passed: content.targetJobTitle.trim().length > 1, weight: 8 });

  const summaryWords = wordCount(content.summary);
  checks.push({ key: "summary", label: "Summary between 25–90 words", passed: summaryWords >= 25 && summaryWords <= 90, weight: 10 });

  const realExp = content.experiences.filter((e) => e.role.trim() || e.company.trim());
  checks.push({ key: "expCount", label: "At least one work experience", passed: realExp.length > 0, weight: 10 });

  const allBullets = realExp.flatMap((e) => e.bullets.filter((b) => b.trim()));
  checks.push({ key: "bulletCount", label: "3+ bullet points across experience", passed: allBullets.length >= 3, weight: 9 });

  const metricBullets = allBullets.filter((b) => HAS_METRIC.test(b));
  checks.push({
    key: "metrics",
    label: "Bullets include measurable results (numbers)",
    passed: allBullets.length > 0 && metricBullets.length / allBullets.length >= 0.4,
    weight: 12,
  });

  const verbBullets = allBullets.filter((b) => ACTION_VERBS.test(b.trim()));
  checks.push({
    key: "verbs",
    label: "Bullets start with strong action verbs",
    passed: allBullets.length > 0 && verbBullets.length / allBullets.length >= 0.4,
    weight: 9,
  });

  checks.push({ key: "skillsCount", label: "6+ relevant skills listed", passed: content.skills.length >= 6, weight: 9 });
  checks.push({ key: "education", label: "Education entry present", passed: content.education.some((e) => e.school.trim()), weight: 5 });

  const km = matchKeywords(content, jobDescription);
  checks.push({
    key: "jdMatch",
    label: km.fromJobDescription ? "Matches keywords from the job description" : "Covers core keywords for the target role",
    passed: km.coverage >= 60,
    weight: 12,
  });

  const maxWeight = checks.reduce((a, c) => a + c.weight, 0);
  const earned = checks.reduce((a, c) => a + (c.passed ? c.weight : 0), 0);
  const score = maxWeight > 0 ? Math.round((earned / maxWeight) * 100) : 0;

  return { score, checks };
}

export function scoreTone(score: number): "danger" | "warn" | "ok" {
  if (score >= 80) return "ok";
  if (score >= 55) return "warn";
  return "danger";
}
