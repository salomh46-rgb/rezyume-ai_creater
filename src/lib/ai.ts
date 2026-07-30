import type { ResumeContent } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* ResumAI engine — uses OpenAI when OPENAI_API_KEY is configured and  */
/* falls back to a deterministic on-device generator otherwise, so the */
/* product works end-to-end in any environment. Supports English,      */
/* Russian and Uzbek output.                                            */
/* ------------------------------------------------------------------ */

export type Lang = "en" | "ru" | "uz";

const LANG_NAMES: Record<Lang, string> = { en: "English", ru: "Russian", uz: "Uzbek (Latin script)" };

function normLang(l: string | undefined): Lang {
  return l === "ru" || l === "uz" ? l : "en";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const pick = <T,>(arr: T[], seed: number, offset = 0): T => arr[(seed + offset) % arr.length];

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const STOPWORDS = new Set(
  (
    "the a an and or of to in for with on at by from as is was were be been my our their its this that these those i we you they it has have had do does did " +
    "worked work working using used use team teams year years new also just very more most some any into over under " +
    "fixed improved helped built made created developed managed led shipped increased reduced maintained supported tested wrote designed handled handling " +
    "need needs needed looking look join able like will would can could should must etc " +
    "role job position company candidate candidates responsibilities requirements required preferred skills skill experience experiences " +
    "strong excellent good great best high low related relevant " +
    // ru / uz light stopwords for keyword extraction
    "и в на с по для от до как это что был была были есть также очень новый год года лет команда работа опыт требования обязанности " +
    "va bilan uchun dan gacha kerak talab qilinadi ish tajriba yil yillik jamoa yaxshi eng"
  ).split(" "),
);

function keywords(text: string, max = 8): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9a-яёʻʼ+#./\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
    if (out.length >= max) break;
  }
  return out;
}

const ACRONYMS = new Set(["api", "apis", "sql", "css", "html", "ml", "ai", "qa", "crm", "seo", "etl", "kpi", "ui", "ux", "saas", "b2b", "b2c", "ci", "cd"]);
function polishWord(w: string): string {
  const lower = w.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (ACRONYMS.has(lower)) return lower.toUpperCase();
  return cap(w);
}

/* ------------------------------ role lexicon ------------------------------ */

interface Lexicon {
  match: RegExp;
  skills: string[];
  domain: Record<Lang, string[]>;
}

const ROLE_LEXICON: Lexicon[] = [
  {
    match: /software|engineer|developer|frontend|backend|full.?stack|devops|sre|platform|dasturchi|dastur|programmist|программист|разработчик/i,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes", "CI/CD", "GraphQL", "REST APIs", "System Design", "Git", "Testing", "Terraform"],
    domain: {
      en: ["APIs", "microservices", "the CI/CD pipeline", "cloud infrastructure", "the codebase", "production systems", "developer tooling", "data pipelines"],
      ru: ["API-сервисов", "микросервисов", "CI/CD-процессов", "облачной инфраструктуры", "кодовой базы", "продакшн-систем", "инструментов разработки", "конвейеров данных"],
      uz: ["API xizmatlari", "mikroservislar", "CI/CD jarayoni", "bulutli infratuzilma", "kodlar bazasi", "production tizimlar", "dasturchi vositalari", "ma'lumotlar oqimi"],
    },
  },
  {
    match: /product\s?manager|pm\b|product owner|mahsulot menejeri|менеджер продукта/i,
    skills: ["Roadmapping", "A/B Testing", "SQL", "User Research", "Stakeholder Management", "Agile", "Analytics", "Prioritization", "Go-to-Market", "PRDs", "Figma", "OKRs"],
    domain: {
      en: ["the product roadmap", "cross-functional initiatives", "sprint planning", "the discovery process", "stakeholder alignment", "release planning"],
      ru: ["дорожной карты продукта", "кросс-функциональных инициатив", "спринт-планирования", "процесса исследований", "согласования со стейкхолдерами", "планирования релизов"],
      uz: ["mahsulot yo'l xaritasi", "funksiyalararo tashabbuslar", "sprint rejalashtirish", "tadqiqot jarayoni", "manfaatdor tomonlar bilan muvofiqlashtirish", "reliz rejalashtirish"],
    },
  },
  {
    match: /design|ux|ui|creative|dizayner|дизайнер/i,
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Interaction Design", "Visual Design", "Accessibility", "Wireframing", "Usability Testing", "Information Architecture"],
    domain: {
      en: ["the design system", "user flows", "high-fidelity prototypes", "the research repository", "brand guidelines", "the onboarding experience"],
      ru: ["дизайн-системы", "пользовательских сценариев", "детализированных прототипов", "базы исследований", "гайдлайнов бренда", "процесса онбординга"],
      uz: ["dizayn tizimi", "foydalanuvchi oqimlari", "yuqori sifatli prototiplar", "tadqiqot arxivi", "brend qo'llanmasi", "onboarding tajribasi"],
    },
  },
  {
    match: /data|analyst|analytics|scientist|machine learning|ml\b|tahlilchi|аналитик/i,
    skills: ["SQL", "Python", "Pandas", "Tableau", "Statistical Modeling", "ETL", "dbt", "A/B Testing", "Data Visualization", "Machine Learning", "Looker"],
    domain: {
      en: ["the analytics pipeline", "dashboards", "the experimentation framework", "data models", "reporting workflows", "the metrics layer"],
      ru: ["аналитического конвейера", "дашбордов", "фреймворка экспериментов", "моделей данных", "процессов отчётности", "слоя метрик"],
      uz: ["tahlil quvuri", "boshqaruv panellari", "eksperiment freymvorki", "ma'lumotlar modeli", "hisobot jarayonlari", "metrikalar qatlami"],
    },
  },
  {
    match: /market|growth|content|seo|social|brand|marketolog|маркетолог|smm/i,
    skills: ["SEO", "Content Strategy", "Google Analytics", "Copywriting", "Email Marketing", "Paid Acquisition", "CRO", "Brand Strategy", "Social Media", "Marketing Automation"],
    domain: {
      en: ["the content calendar", "acquisition channels", "the campaign pipeline", "organic search", "the brand voice", "lifecycle emails"],
      ru: ["контент-плана", "каналов привлечения", "воронки кампаний", "органического поиска", "голоса бренда", "email-рассылок"],
      uz: ["kontent rejasi", "jalb qilish kanallari", "kampaniya quvuri", "organik qidiruv", "brend ovozi", "email xabarnomalari"],
    },
  },
  {
    match: /sales|account|business develop|bd\b|sotuv|продаж/i,
    skills: ["Pipeline Management", "Salesforce", "Negotiation", "Prospecting", "Forecasting", "Discovery Calls", "Contract Negotiation", "CRM Hygiene", "Solution Selling"],
    domain: {
      en: ["the sales pipeline", "enterprise accounts", "quarterly forecasts", "the outbound motion", "renewal conversations", "the demo flow"],
      ru: ["воронки продаж", "ключевых клиентов", "квартальных прогнозов", "исходящих продаж", "переговоров о продлении", "процесса демонстраций"],
      uz: ["sotuv voronkasi", "yirik mijozlar", "choraklik prognozlar", "chiquvchi sotuvlar", "shartnomani yangilash suhbatlari", "demo jarayoni"],
    },
  },
];

const GENERIC_SKILLS: Record<Lang, string[]> = {
  en: ["Communication", "Project Management", "Problem Solving", "Cross-functional Collaboration", "Data Analysis", "Leadership", "Agile", "Time Management"],
  ru: ["Коммуникация", "Управление проектами", "Решение проблем", "Кросс-функциональное взаимодействие", "Анализ данных", "Лидерство", "Agile", "Тайм-менеджмент"],
  uz: ["Muloqot", "Loyihalarni boshqarish", "Muammolarni yechish", "Funksiyalararo hamkorlik", "Ma'lumotlarni tahlil qilish", "Yetakchilik", "Agile", "Vaqtni boshqarish"],
};

const VERBS: Record<Lang, string[]> = {
  en: ["Spearheaded", "Engineered", "Orchestrated", "Streamlined", "Architected", "Delivered", "Accelerated", "Championed", "Automated", "Transformed", "Led", "Launched", "Optimized", "Drove", "Shipped", "Redesigned"],
  ru: ["Инициировал(а)", "Разработал(а)", "Организовал(а)", "Оптимизировал(а)", "Спроектировал(а)", "Внедрил(а)", "Ускорил(а)", "Продвигал(а)", "Автоматизировал(а)", "Преобразовал(а)", "Возглавил(а)", "Запустил(а)", "Улучшил(а)", "Реализовал(а)"],
  uz: ["Boshladi", "Ishlab chiqdi", "Tashkil qildi", "Optimallashtirdi", "Loyihalashtirdi", "Amalga oshirdi", "Tezlashtirdi", "Rivojlantirdi", "Avtomatlashtirdi", "O'zgartirdi", "Boshqardi", "Ishga tushirdi", "Yaxshiladi", "Qayta ishladi"],
};

const METRICS: Record<Lang, string[]> = {
  en: [
    "reducing turnaround time by 28%",
    "cutting operational costs by 19%",
    "improving conversion by 22%",
    "boosting team velocity by 35%",
    "saving 10+ hours per week",
    "increasing retention by 15%",
    "lifting customer satisfaction (CSAT) to 94%",
    "decreasing error rates by 40%",
    "scaling usage to 3× prior volume",
    "shortening time-to-market by 6 weeks",
  ],
  ru: [
    "сократив сроки выполнения на 28%",
    "снизив операционные расходы на 19%",
    "повысив конверсию на 22%",
    "увеличив скорость команды на 35%",
    "сэкономив более 10 часов в неделю",
    "повысив удержание клиентов на 15%",
    "подняв индекс удовлетворённости (CSAT) до 94%",
    "снизив количество ошибок на 40%",
    "увеличив нагрузку в 3 раза",
    "сократив время выхода на рынок на 6 недель",
  ],
  uz: [
    "bajarilish vaqtini 28% ga qisqartirdi",
    "operatsion xarajatlarni 19% ga kamaytirdi",
    "konversiyani 22% ga oshirdi",
    "jamoa tezligini 35% ga oshirdi",
    "haftasiga 10+ soat vaqtni tejadi",
    "mijozlarni ushlab qolishni 15% ga oshirdi",
    "mijozlar qoniqishini (CSAT) 94% gacha ko'tardi",
    "xatoliklar sonini 40% ga kamaytirdi",
    "foydalanishni 3 baravar oshirdi",
    "bozorga chiqish vaqtini 6 haftaga qisqartirdi",
  ],
};

function impactPhrase(lang: Lang, kws: string[], domain: string, seed: number, i: number): string {
  const metric = pick(METRICS[lang], seed, i * 2 + 1);
  const kw = kws[i % Math.max(kws.length, 1)] ?? "";
  if (lang === "ru") {
    const templates = [
      `инициативы в области ${domain}, ${metric}`,
      `сквозные улучшения ${domain}, совмещая структурный подход с измеримыми результатами — ${metric}`,
      `современный подход к ${domain}, принятый всей командой и ${metric}`,
      `взаимодействие с командами для устранения барьеров в ${domain}, ${metric}`,
    ];
    return templates[i % templates.length];
  }
  if (lang === "uz") {
    const templates = [
      `${domain} bo'yicha tashabbuslarni ${metric}`,
      `${domain}ni boshidan oxirigacha yaxshilab, tizimli reja va o'lchanadigan natijalarni birlashtirdi — bu ${metric}`,
      `${domain}ga zamonaviy yondashuvni joriy etdi, butun jamoa tomonidan qabul qilindi va ${metric}`,
      `${domain}dagi to'siqlarni bartaraf etish uchun jamoalararo hamkorlikni yo'lga qo'ydi, ${metric}`,
    ];
    return templates[i % templates.length];
  }
  const templates = [
    `${polishWord(kw || "core")} initiatives across ${domain}, ${metric}`,
    `end-to-end improvements to ${domain}, pairing ${polishWord(kw || "structured")} planning with measurable outcomes — ${metric}`,
    `a modern approach to ${domain}, adopted team-wide and ${metric}`,
    `${polishWord(kw || "stakeholder")} collaboration to unblock ${domain}, ${metric}`,
  ];
  return templates[i % templates.length];
}

function lexiconFor(role: string): Lexicon | null {
  return ROLE_LEXICON.find((l) => l.match.test(role)) ?? null;
}

function extractYears(text: string): string {
  const m = text.match(/(\d{1,2})\s*\+?\s*(?:years|yrs|лет|года|год|yil)/i);
  return m ? m[1] : "";
}

/* ------------------------------ local generators ------------------------------ */

function localBullets(role: string, company: string, notes: string, lang: Lang): string[] {
  const seed = hashStr(`${role}|${company}|${notes}`);
  const lex = lexiconFor(role);
  const domainList = lex?.domain[lang] ?? {
    en: ["key initiatives", "team workflows", "core processes", "the quarterly roadmap"],
    ru: ["ключевых инициатив", "рабочих процессов команды", "основных процессов", "квартального плана"],
    uz: ["asosiy tashabbuslar", "jamoa ish jarayonlari", "asosiy jarayonlar", "choraklik reja"],
  }[lang];
  const kws = keywords(notes || role, 6);
  const out: string[] = [];
  const usedVerbs = new Set<number>();
  const verbs = VERBS[lang];
  for (let i = 0; i < 4; i++) {
    let vi = (seed + i * 5) % verbs.length;
    while (usedVerbs.has(vi)) vi = (vi + 1) % verbs.length;
    usedVerbs.add(vi);
    const domain = domainList[(seed + i) % domainList.length];
    const phrase = impactPhrase(lang, kws, domain, seed, i);
    const sentence = lang === "en" ? `${verbs[vi]} ${phrase}.` : `${verbs[vi]} ${phrase}.`;
    out.push(sentence);
  }
  return out;
}

function localSummary(jobTitle: string, skills: string[], notes: string, experiences: number, lang: Lang): string {
  const seed = hashStr(`${jobTitle}|${skills.join(",")}|${notes}`);
  const title = jobTitle.trim() || (lang === "ru" ? "Специалист" : lang === "uz" ? "Mutaxassis" : "Professional");
  const years = extractYears(notes) || (experiences > 1 ? String(3 + (seed % 5)) : "");
  const top = skills.slice(0, 4);
  const lex = lexiconFor(jobTitle);
  const focus = lex?.domain[lang][seed % lex.domain[lang].length] ?? (lang === "ru" ? "ключевых инициативах" : lang === "uz" ? "muhim tashabbuslarda" : "high-impact initiatives");

  if (lang === "ru") {
    const skillText = top.length ? ` Владеет: ${top.join(", ")}.` : "";
    const variants = [
      `${title}${years ? ` с опытом более ${years} лет` : ""}, специализирующийся(-аяся) в области ${focus}. Умеет превращать неопределённые задачи в измеримые результаты — от первого исследования до финальной поставки.${skillText}`,
      `Результативный(-ая) ${title.toLowerCase()}${years ? `, с более чем ${years}-летним практическим опытом` : ""} в области ${focus}. Сочетает тщательный анализ с прагматичным исполнением.${skillText}`,
      `${title}${years ? ` с более чем ${years}-летним прогрессивным опытом` : ""}, стабильно улучшающий(-ая) ${focus}. Сочетает глубокое мастерство с сильными коммуникативными навыками.${skillText}`,
    ];
    return pick(variants, seed);
  }
  if (lang === "uz") {
    const skillText = top.length ? ` Quyidagi ko'nikmalarga ega: ${top.join(", ")}.` : "";
    const variants = [
      `${focus} sohasida ${years ? `${years}+ yillik tajribaga ega ` : ""}${title.toLowerCase()}. Noaniq muammolarni birinchi tadqiqotdan yakuniy natijagacha o'lchanadigan yechimlarga aylantirish tajribasiga ega.${skillText}`,
      `${focus} bo'yicha natijaga yo'naltirilgan ${title.toLowerCase()}${years ? `, ${years}+ yillik amaliy tajribaga ega` : ""}. Chuqur tahlilni amaliy ijro bilan uyg'unlashtiradi.${skillText}`,
      `${title}${years ? `, ${years}+ yillik izchil tajribaga ega` : ""}, doimiy ravishda ${focus}ni yaxshilab kelmoqda. Chuqur bilim va kuchli muloqot ko'nikmalarini birlashtiradi.${skillText}`,
    ];
    return pick(variants, seed);
  }
  const skillText = top.length ? ` Skilled in ${top.slice(0, -1).join(", ")}${top.length > 1 ? " and " : ""}${top[top.length - 1]}.` : "";
  const variants = [
    `${title}${years ? ` with ${years}+ years of experience` : ""} focused on ${focus}. Proven record of translating ambiguous problems into shipped, measurable outcomes — from first discovery to final delivery.${skillText}`,
    `Results-driven ${title.toLowerCase()}${years ? ` bringing ${years}+ years of hands-on experience` : ""} across ${focus}. Known for pairing rigorous analysis with pragmatic execution.${skillText}`,
    `${title}${years ? ` with ${years}+ years of progressive experience` : ""} who has consistently improved ${focus}. Combines deep craft with strong communication.${skillText}`,
  ];
  return pick(variants, seed);
}

function localSkills(jobTitle: string, existing: string[], jd: string, lang: Lang): string[] {
  const lex = lexiconFor(jobTitle);
  const jdKws = new Set(keywords(jd, 30));
  const merged: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const k = s.trim().toLowerCase();
    if (k && !seen.has(k) && merged.length < 12) {
      seen.add(k);
      merged.push(s.trim());
    }
  };
  existing.forEach(add);
  if (lex) {
    for (const s of lex.skills) {
      const hit = jdKws.size > 0 && s.toLowerCase().split(/[\s/]+/).some((w) => jdKws.has(w.replace(/[^a-z0-9+#]/g, "")));
      if (hit || lex.skills.indexOf(s) < 8) add(s);
    }
  }
  if (jd) {
    const MASTER = [...(lex?.skills ?? []), ...GENERIC_SKILLS.en, "SQL", "Python", "Excel", "Agile", "Figma"];
    for (const s of MASTER) if (s.toLowerCase().split(" ").some((w) => jdKws.has(w.toLowerCase()))) add(s);
  }
  GENERIC_SKILLS[lang].forEach((s) => add(s));
  return merged.slice(0, 12);
}

function localCoverLetter(resume: ResumeContent, company: string, role: string, jd: string, tone: string, lang: Lang): string {
  const name = resume.personal.fullName || (lang === "ru" ? "Ваше имя" : lang === "uz" ? "Ismingiz" : "Your Name");
  const jobTitle = (role.trim() || resume.targetJobTitle.trim()).trim();
  const co = company.trim() || (lang === "ru" ? "вашей команде" : lang === "uz" ? "jamoangizga" : "your team");
  const seed = hashStr(`${name}|${co}|${jobTitle}|${jd}`);
  const years =
    extractYears(resume.summary + " " + resume.experiences.map((e) => e.bullets.join(" ")).join(" ")) ||
    String(resume.experiences.length > 1 ? 4 + (seed % 4) : 2 + (seed % 2));
  const topSkills = resume.skills.slice(0, 3);
  const current = resume.experiences[0];
  const jdKws = keywords(jd, 8);
  const t = ["professional", "friendly", "bold", "confident", "modern"].includes(tone) ? tone : "professional";

  if (lang === "ru") {
    const align = jdKws.length ? ` В вакансии особо выделены: ${jdKws.slice(0, 3).join(", ")} — области, в которых у меня есть непосредственный опыт.` : "";
    const openers: Record<string, string[]> = {
      professional: [
        jobTitle ? `Хочу выразить искренний интерес к позиции ${jobTitle} в компании ${co}.` : `Хочу выразить искренний интерес к открытой позиции в компании ${co}.`,
        jobTitle ? `Прошу рассмотреть это письмо как отклик на позицию ${jobTitle} в ${co}.` : `Прошу рассмотреть это письмо как отклик на открытую позицию в ${co}.`,
      ],
      friendly: [
        jobTitle ? `Увидев вакансию ${jobTitle} в ${co}, я сразу понял(а), что должен(на) откликнуться.` : `Увидев вакансию в ${co}, я сразу понял(а), что должен(на) откликнуться.`,
        `Я давно слежу за ${co}, поэтому ${jobTitle ? `вакансия ${jobTitle}` : "эта вакансия"} сразу привлекла моё внимание.`,
      ],
      bold: [
        jobTitle ? `Найти сильного ${jobTitle.toLowerCase()} непросто — поэтому я здесь.` : `Найти сильного специалиста непросто — поэтому я здесь.`,
        `${co} заслуживает специалиста, который доводит дело до результата. Именно так я и работаю.`,
      ],
      confident: [
        jobTitle ? `Я точно знаю, что могу стать ${jobTitle.toLowerCase()}, которого ищет ${co}.` : `Я точно знаю, что могу стать специалистом, которого ищет ${co}.`,
        `${co} описывает профиль, который полностью совпадает с моим — и я готов(а) это подтвердить результатами.`,
      ],
      modern: [
        jobTitle ? `${co} + ${jobTitle} + мой опыт — формула, которая сработает.` : `${co} и мой опыт — формула, которая сработает.`,
        `Три вещи, которые важно знать обо мне: я делаю, а не обещаю; я измеряю, а не предполагаю; и я отлично вливаюсь в команду.`,
      ],
    };
    const opener = pick(openers[t], seed);
    const expLine = current?.role && current?.company
      ? `Совсем недавно, работая ${current.role} в ${current.company}, я ${current.bullets[0] ? current.bullets[0].charAt(0).toLowerCase() + current.bullets[0].slice(1) : "полностью отвечал(а) за проекты с высокой видимостью"}`
      : `На последних проектах я стабильно превращал(а) неопределённые задачи в измеримые результаты`;
    const closers: Record<string, string> = {
      professional: "Буду рад(а) обсудить, как мой опыт соответствует вашим целям. Спасибо за уделённое время.",
      friendly: "С удовольствием обсужу, как могу быть полезен(на) команде. Спасибо, что прочитали это письмо!",
      bold: "Уверен(а), что смогу принести ощутимую пользу уже в первые 90 дней — буду рад(а) это доказать.",
      confident: "Я уверен(а) в своём вкладе и с нетерпением жду возможности обсудить детали.",
      modern: "Буду рад(а) коротко созвониться — мне есть что показать, а не только рассказать.",
    };
    return [
      `${opener} Имея более ${years} лет опыта${jobTitle ? ` в качестве ${jobTitle.toLowerCase()}` : ""}${topSkills.length ? ` и уверенные навыки в ${topSkills.join(", ")}` : ""}, уверен(а), что смогу внести значимый вклад с первого дня.${align}`,
      `${cap(expLine)}. Я сочетаю мастерство и ответственность, превращая планы в реализованные результаты, и комфортно работаю в условиях неопределённости и высоких стандартов.`,
      topSkills.length
        ? `В частности, мой опыт с ${topSkills.slice(0, 2).join(" и ")} тесно связан с тем, что делает ${co}. Также легко нахожу общий язык с другими командами и уделяю внимание деталям.`
        : `Помимо конкретного опыта, я привношу любопытство, дисциплину и нацеленность на действие.`,
      closers[t],
      `С уважением,\n${name}`,
    ].join("\n\n");
  }

  if (lang === "uz") {
    const align = jdKws.length ? ` E'londa ${jdKws.slice(0, 3).join(", ")} kabi ko'nikmalar alohida ta'kidlangan — bu sohalarda mening bevosita tajribam bor.` : "";
    const openers: Record<string, string[]> = {
      professional: [
        jobTitle ? `${co} kompaniyasidagi ${jobTitle} lavozimiga qiziqishimni bildirmoqchiman.` : `${co} kompaniyasidagi ochiq lavozimga qiziqishimni bildirmoqchiman.`,
        jobTitle ? `Ushbu xatni ${co} kompaniyasidagi ${jobTitle} lavozimiga arizam sifatida qabul qilishingizni so'rayman.` : `Ushbu xatni ${co} kompaniyasidagi ochiq lavozimga arizam sifatida qabul qilishingizni so'rayman.`,
      ],
      friendly: [
        jobTitle ? `${co} kompaniyasida ${jobTitle} e'lonini ko'rib, albatta murojaat qilishim kerakligini angladim.` : `${co} kompaniyasidagi e'lonni ko'rib, albatta murojaat qilishim kerakligini angladim.`,
        `Men ${co} faoliyatini uzoq vaqtdan beri kuzatib boraman, shuning uchun ${jobTitle ? `${jobTitle} lavozimi` : "ushbu e'lon"} darhol e'tiborimni tortdi.`,
      ],
      bold: [
        jobTitle ? `Kuchli ${jobTitle.toLowerCase()}larni topish oson emas — shuning uchun men shu yerdaman.` : `Kuchli mutaxassislarni topish oson emas — shuning uchun men shu yerdaman.`,
        `${co} natija beradigan mutaxassisga loyiq. Men aynan shunday ishlayman.`,
      ],
      confident: [
        jobTitle ? `${co} qidirayotgan ${jobTitle.toLowerCase()} — bu men ekanligimga ishonchim komil.` : `${co} qidirayotgan mutaxassis — bu men ekanligimga ishonchim komil.`,
        `Mening profilim ${co} tavsifiga to'liq mos keladi — va buni natijalar bilan isbotlashga tayyorman.`,
      ],
      modern: [
        jobTitle ? `${co} + ${jobTitle} + mening tajribam — ishlaydi.` : `${co} va mening tajribam — ishlaydi.`,
        `Men haqimda uch narsa: gapirmayman — qilaman, taxmin qilmayman — o'lchayman, va jamoaga tez qo'shilaman.`,
      ],
    };
    const opener = pick(openers[t], seed);
    const expLine = current?.role && current?.company
      ? `Yaqinda ${current.company} kompaniyasida ${current.role} sifatida ishlab, ${current.bullets[0] ? current.bullets[0].charAt(0).toLowerCase() + current.bullets[0].slice(1) : "muhim loyihalarni boshidan oxirigacha boshqardim"}`
      : `So'nggi loyihalarimda noaniq muammolarni izchil ravishda o'lchanadigan natijalarga aylantirdim`;
    const closers: Record<string, string> = {
      professional: "Tajribam maqsadlaringizga qanday mos kelishini muhokama qilishdan mamnun bo'lardim. Vaqtingiz uchun rahmat.",
      friendly: "Jamoaga qanday foyda keltira olishim haqida suhbatlashishdan xursand bo'lardim. Xatni o'qiganingiz uchun rahmat!",
      bold: "Ishning dastlabki 90 kunidayoq sezilarli natija bera olishimga ishonaman — buni isbotlashdan mamnun bo'laman.",
      confident: "O'z hissamga ishonchim bor va tafsilotlarni muhokama qilish imkoniyatini sabrsizlik bilan kutaman.",
      modern: "Qisqa qo'ng'iroq qilishdan mamnun bo'laman — menda ko'rsatadigan narsa bor, faqat gapiradigan emas.",
    };
    return [
      `${opener} ${jobTitle ? `${jobTitle} sifatida ` : ""}${years}+ yillik tajribaga${topSkills.length ? ` va ${topSkills.join(", ")} bo'yicha chuqur bilimga` : ""} ega bo'lganim uchun birinchi kundanoq foydali bo'la olishimga ishonaman.${align}`,
      `${cap(expLine)}. Men rejalarni amalga oshirilgan natijalarga aylantiradigan mahorat va mas'uliyatni birlashtiraman, noaniqlik va yuqori talablar sharoitida ham qulay ishlayman.`,
      topSkills.length
        ? `Xususan, mening ${topSkills.slice(0, 2).join(" va ")} bo'yicha tajribam ${co} qilayotgan ishlarga mos keladi. Shuningdek, boshqa jamoalar bilan hamkorlikda ishlash va detallarga e'tibor berishda erkin his qilaman.`
        : `Aniq tajribamdan tashqari, men qiziquvchanlik, intizom va harakatga tayyorlikni olib kelaman.`,
      closers[t],
      `Hurmat bilan,\n${name}`,
    ].join("\n\n");
  }

  // English (default)
  const align = jdKws.length ? ` Your posting emphasizes ${jdKws.slice(0, 3).join(", ")} — areas where I have direct, recent experience.` : "";
  const article = (s: string) => (/^[aeiou]/i.test(s) ? "an" : "a");
  const openers: Record<string, string[]> = {
    professional: [
      jobTitle ? `I am writing to express my strong interest in the ${jobTitle} position at ${co}.` : `I am writing to express my strong interest in the open position at ${co}.`,
      jobTitle ? `Please accept this letter as my application for the ${jobTitle} role at ${co}.` : `Please accept this letter as my application for the open role at ${co}.`,
    ],
    friendly: [
      jobTitle ? `When I saw the ${jobTitle} opening at ${co}, I knew I had to reach out.` : `When I saw the opening at ${co}, I knew I had to reach out.`,
      `I have been following ${co} for a while, so the ${jobTitle ? jobTitle + " " : ""}posting immediately caught my attention.`,
    ],
    bold: [
      jobTitle ? `Great ${jobTitle.toLowerCase()}s are hard to find — so here I am.` : `Great hires are hard to find — so here I am.`,
      `${co} deserves someone who ships, measures, and iterates. That is precisely how I work.`,
    ],
    confident: [
      jobTitle ? `I know I am the ${jobTitle.toLowerCase()} ${co} is looking for — and I have the results to prove it.` : `I know I am the hire ${co} is looking for — and I have the results to prove it.`,
      `Your role description reads like my career highlights. Let me walk you through why.`,
    ],
    modern: [
      jobTitle ? `${co} + ${jobTitle} + my track record = a strong match.` : `${co} and my track record — that is a strong match.`,
      `Three things you should know about me: I ship, I measure, and I integrate fast.`,
    ],
  };
  const opener = pick(openers[t], seed);
  const expPhrase = jobTitle ? `With ${years}+ years of experience as ${article(jobTitle)} ${jobTitle.toLowerCase()}` : `With ${years}+ years of hands-on experience`;
  const expLine = current?.role && current?.company
    ? `Most recently, as ${current.role} at ${current.company}, ${current.bullets[0] ? current.bullets[0].charAt(0).toLowerCase() + current.bullets[0].slice(1) : "I owned high-visibility work end to end"}`
    : `Across my recent roles, I have consistently turned ambiguous problems into measurable results`;
  const closers: Record<string, string> = {
    professional: `I would welcome the opportunity to discuss how my background aligns with your goals. Thank you for your time and consideration.`,
    friendly: `I would love the chance to chat about how I could contribute to the team. Thanks so much for reading!`,
    bold: `I am confident I can deliver outsized impact within my first 90 days — I would welcome the chance to prove it.`,
    confident: `I am certain of my contribution and eagerly await the chance to discuss the details.`,
    modern: `I would love a quick call — I have something to show, not just tell.`,
  };
  return [
    `${opener} ${expPhrase}${topSkills.length ? ` and deep strengths in ${topSkills.join(", ")}` : ""}, I am confident I can contribute meaningfully from day one.${align}`,
    `${cap(expLine)}. I bring the mix of craft and ownership that turns plans into shipped outcomes, and I am comfortable operating with ambiguity, tight feedback loops, and high standards.`,
    topSkills.length
      ? `Specifically, my work with ${topSkills.slice(0, 2).join(" and ")} maps closely to what ${co} is building. I am equally comfortable collaborating across functions and documenting decisions.`
      : `Beyond the specifics of my background, I bring curiosity, rigor, and a bias for action.`,
    closers[t],
    `Sincerely,\n${name}`,
  ].join("\n\n");
}

/* ------------------------------ OpenAI bridge ---------------------- */

async function callOpenAI(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------ public API ------------------------- */

export async function enhanceBullets(input: {
  role: string;
  company: string;
  notes: string;
  lang?: string;
}): Promise<{ bullets: string[]; provider: string }> {
  const lang = normLang(input.lang);
  const ai = await callOpenAI(
    `You are an expert resume writer. Respond only in ${LANG_NAMES[lang]}. Return exactly 4 resume bullet points, one per line, no numbering, no quotes. Start each with a strong action verb and include a concrete metric. Be specific to the role and company.`,
    `Role: ${input.role}\nCompany: ${input.company}\nRaw notes:\n${input.notes || "(no notes — infer from role)"}`,
  );
  if (ai) {
    const lines = ai.split("\n").map((l) => l.replace(/^[-•*\d.\s"'"]+/, "").trim()).filter(Boolean);
    if (lines.length >= 2) return { bullets: lines.slice(0, 5), provider: "openai" };
  }
  await sleep(650 + Math.random() * 450);
  return { bullets: localBullets(input.role, input.company, input.notes, lang), provider: "local" };
}

export async function enhanceSummary(input: {
  jobTitle: string;
  skills: string[];
  notes: string;
  experiences: number;
  lang?: string;
}): Promise<{ summary: string; provider: string }> {
  const lang = normLang(input.lang);
  const ai = await callOpenAI(
    `You are an expert resume writer. Respond only in ${LANG_NAMES[lang]}. Write a concise 2-3 sentence professional summary for the top of a resume. Plain text, no quotes, no headings.`,
    `Target job title: ${input.jobTitle}\nSkills: ${input.skills.join(", ") || "n/a"}\nYears hint / notes: ${input.notes || "n/a"}\nNumber of past roles: ${input.experiences}`,
  );
  if (ai && ai.trim().length > 40) return { summary: ai.trim().replace(/^["']+|["']+$/g, ""), provider: "openai" };
  await sleep(600 + Math.random() * 400);
  return { summary: localSummary(input.jobTitle, input.skills, input.notes, input.experiences, lang), provider: "local" };
}

export async function tailorSkills(input: {
  jobTitle: string;
  skills: string[];
  jobDescription: string;
  lang?: string;
}): Promise<{ skills: string[]; provider: string }> {
  const lang = normLang(input.lang);
  const ai = await callOpenAI(
    `You are a recruiter. Return a comma-separated list of exactly 10-12 relevant resume skills for the candidate, tailored to the job description when provided. Keep well-known technology/tool names in their original form; translate generic soft-skill labels into ${LANG_NAMES[lang]}. No numbering, no extra text.`,
    `Target job title: ${input.jobTitle}\nExisting skills: ${input.skills.join(", ") || "n/a"}\nJob description:\n${input.jobDescription || "(none provided)"}`,
  );
  if (ai) {
    const list = ai.split(/[,\n]/).map((s) => s.replace(/^[-•*\d.\s"'"]+/, "").trim()).filter((s) => s && s.length < 40);
    if (list.length >= 5) return { skills: list.slice(0, 12), provider: "openai" };
  }
  await sleep(550 + Math.random() * 400);
  return { skills: localSkills(input.jobTitle, input.skills, input.jobDescription, lang), provider: "local" };
}

export async function generateCoverLetter(input: {
  resume: ResumeContent;
  company: string;
  role: string;
  jobDescription: string;
  tone: string;
  lang?: string;
}): Promise<{ content: string; provider: string }> {
  const lang = normLang(input.lang);
  const ai = await callOpenAI(
    `You are an expert cover letter writer. Respond only in ${LANG_NAMES[lang]}. Tone: ${input.tone}. Write a 3-4 paragraph cover letter. End with a closing salutation on its own line followed by the candidate name. Plain text, no markdown.`,
    `Company: ${input.company}\nRole: ${input.role}\nJob description:\n${input.jobDescription || "(none)"}\n\nResume:\n${JSON.stringify(input.resume, null, 2)}`,
  );
  if (ai && ai.trim().length > 150) return { content: ai.trim(), provider: "openai" };
  await sleep(900 + Math.random() * 500);
  return {
    content: localCoverLetter(input.resume, input.company, input.role, input.jobDescription, input.tone, lang),
    provider: "local",
  };
}
