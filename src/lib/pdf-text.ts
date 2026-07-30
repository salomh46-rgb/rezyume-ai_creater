"use client";

import type { jsPDF } from "jspdf";
import { skillNames, type PersonalInfo, type ResumeContent, type TemplateId } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Vector PDF writer — every glyph is real, selectable, searchable     *
 * text (no rasterised screenshots), laid out on a true A4 page.       *
 * ------------------------------------------------------------------ */

const PAGE_W = 210;
const PAGE_H = 297;
const PT = 0.352778; // 1pt in mm

type RGB = [number, number, number];

const INK: RGB = [30, 33, 38];
const BODY: RGB = [58, 62, 69];
const MUTED: RGB = [122, 127, 136];
const ACCENT: RGB = [188, 83, 39];
const LINE: RGB = [223, 223, 218];
const WHITE: RGB = [255, 255, 255];
const SIDEBAR: RGB = [23, 26, 33];
const SIDE_TEXT: RGB = [185, 191, 202];
const SIDE_CHIP: RGB = [31, 36, 46];
const SIDE_CHIP_LINE: RGB = [51, 58, 70];
const TECH_ACCENT: RGB = [229, 115, 63];
const EXEC: RGB = [124, 94, 51];
const EXEC_LINE: RGB = [216, 207, 191];
const EXEC_CHIP_BG: RGB = [250, 246, 238];

const FONT = "NotoSans";

/* --------------------------- font embedding --------------------------- */

let fontCache: { regular: string; bold: string } | null = null;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

async function loadFonts(): Promise<{ regular: string; bold: string } | null> {
  if (fontCache) return fontCache;
  try {
    const [r, b] = await Promise.all([
      fetch("/fonts/NotoSans-Regular.ttf").then((x) => x.arrayBuffer()),
      fetch("/fonts/NotoSans-Bold.ttf").then((x) => x.arrayBuffer()),
    ]);
    fontCache = { regular: toBase64(r), bold: toBase64(b) };
    return fontCache;
  } catch {
    return null;
  }
}

async function registerFonts(doc: jsPDF): Promise<boolean> {
  const fonts = await loadFonts();
  if (!fonts) return false;
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFont("NotoSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  doc.addFont("NotoSans-Bold.ttf", FONT, "bold");
  return true;
}

/* ------------------------------ helpers ------------------------------ */

class Writer {
  doc: jsPDF;
  hasUnicode: boolean;
  y = 0;

  constructor(doc: jsPDF, hasUnicode: boolean) {
    this.doc = doc;
    this.hasUnicode = hasUnicode;
  }

  font(weight: "normal" | "bold" = "normal") {
    this.doc.setFont(this.hasUnicode ? FONT : "helvetica", weight);
    return this;
  }

  size(pt: number) {
    this.doc.setFontSize(pt);
    return this;
  }

  color(c: RGB) {
    this.doc.setTextColor(c[0], c[1], c[2]);
    return this;
  }

  fill(c: RGB) {
    this.doc.setFillColor(c[0], c[1], c[2]);
    return this;
  }

  stroke(c: RGB) {
    this.doc.setDrawColor(c[0], c[1], c[2]);
    return this;
  }

  width(text: string): number {
    return this.doc.getTextWidth(text);
  }

  /** Draws wrapped text, returns the height consumed (mm). */
  para(
    text: string,
    x: number,
    y: number,
    maxW: number,
    opts: { pt: number; lead?: number; align?: "left" | "center" | "right"; charSpace?: number } = { pt: 9 },
  ): number {
    if (!text.trim()) return 0;
    const lead = opts.lead ?? 1.35;
    const lineH = opts.pt * PT * lead;
    const lines = this.doc.splitTextToSize(text, maxW) as string[];
    lines.forEach((ln, i) => {
      const ly = y + i * lineH;
      const lx = opts.align === "center" ? x + maxW / 2 : opts.align === "right" ? x + maxW : x;
      this.doc.text(ln, lx, ly, {
        align: opts.align ?? "left",
        charSpace: opts.charSpace ?? 0,
        baseline: "top",
      });
    });
    return lines.length * lineH;
  }

  line(x1: number, y1: number, x2: number, y2: number, w = 0.25) {
    this.doc.setLineWidth(w);
    this.doc.line(x1, y1, x2, y2);
  }

  /** Adds a page when the cursor would overflow the bottom margin. */
  ensure(space: number, bottom = PAGE_H - 14): boolean {
    if (this.y + space <= bottom) return false;
    this.doc.addPage();
    this.y = 16;
    return true;
  }

  image(dataUrl: string, x: number, y: number, w: number, h: number) {
    if (!dataUrl) return;
    const fmt = dataUrl.includes("image/png") ? "PNG" : "JPEG";
    try {
      this.doc.addImage(dataUrl, fmt, x, y, w, h, undefined, "FAST");
    } catch {
      /* ignore undecodable images */
    }
  }

  /** Rounded pill with centred label; returns the pill width. */
  chip(
    label: string,
    x: number,
    y: number,
    o: { pt: number; bg: RGB; fg: RGB; border?: RGB; padX?: number; h?: number; radius?: number },
  ): number {
    this.font("normal").size(o.pt);
    const padX = o.padX ?? 1.9;
    const h = o.h ?? o.pt * PT + 2.4;
    const w = this.width(label) + padX * 2;
    this.fill(o.bg);
    if (o.border) {
      this.stroke(o.border);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(x, y, w, h, o.radius ?? 1.1, o.radius ?? 1.1, "FD");
    } else {
      this.doc.roundedRect(x, y, w, h, o.radius ?? 1.1, o.radius ?? 1.1, "F");
    }
    this.color(o.fg);
    this.doc.text(label, x + padX, y + h / 2, { baseline: "middle" });
    return w;
  }

  /** Flows chips onto multiple rows; returns total height. */
  chipRow(
    labels: string[],
    x: number,
    y: number,
    maxW: number,
    o: { pt: number; bg: RGB; fg: RGB; border?: RGB; gap?: number },
  ): number {
    const gap = o.gap ?? 1.6;
    const h = o.pt * PT + 2.4;
    let cx = x;
    let cy = y;
    for (const label of labels) {
      this.font("normal").size(o.pt);
      const w = this.width(label) + 3.8;
      if (cx + w > x + maxW && cx > x) {
        cx = x;
        cy += h + gap;
      }
      this.chip(label, cx, cy, { ...o, h });
      cx += w + gap;
    }
    return cy - y + h;
  }

  sectionTitle(label: string, x: number, y: number, maxW: number, color: RGB = MUTED, rule = true): number {
    this.font("bold").size(7.8).color(color);
    this.doc.text(label.toUpperCase(), x, y, { charSpace: 0.45, baseline: "top" });
    if (rule) {
      this.stroke(LINE);
      this.line(x, y + 4.2, x + maxW, y + 4.2, 0.25);
    }
    return 6.6;
  }
}

/* ------------------------------ content bits ------------------------------ */

function contactBits(p: PersonalInfo): string[] {
  return [p.email, p.phone, p.location, p.website].map((s) => s.trim()).filter(Boolean);
}

function metaBits(p: PersonalInfo): string[] {
  const out: string[] = [];
  if (p.telegram.trim()) out.push(`Telegram: ${p.telegram.trim()}`);
  if (p.citizenship.trim()) out.push(p.citizenship.trim());
  if (p.drivingLicense.trim()) out.push(p.drivingLicense.trim());
  if (p.workFormat.trim()) out.push(p.workFormat.trim());
  return out;
}

const clean = (b: string[]) => b.map((s) => s.trim()).filter(Boolean);
const realExp = (c: ResumeContent) => c.experiences.filter((e) => e.role.trim() || e.company.trim());
const realEdu = (c: ResumeContent) => c.education.filter((e) => e.school.trim());
const dateRange = (start: string, end: string, current: boolean) =>
  [start, current ? "Present" : end].filter(Boolean).join(" — ");

/* ------------------------------ Minimalist ------------------------------ */

function drawMinimalist(w: Writer, c: ResumeContent, qr: string) {
  const M = 18;
  const p = c.personal;
  const hasSide = !!p.photo || !!qr;
  const sideW = hasSide ? 26 : 0;
  const colW = PAGE_W - M * 2 - (hasSide ? sideW + 6 : 0);

  let sideY = 16;
  if (p.photo) {
    w.image(p.photo, PAGE_W - M - 21, sideY, 21, 28);
    sideY += 31;
  }
  if (qr) {
    w.image(qr, PAGE_W - M - 20, sideY, 20, 20);
    w.font("normal").size(6).color(MUTED);
    w.doc.text(c.qr.label || "Scan", PAGE_W - M - 10, sideY + 21.6, { align: "center", baseline: "top" });
    sideY += 26;
  }

  w.y = 17;
  w.font("bold").size(20).color(INK);
  w.y += w.para(p.fullName.trim() || "Your Name", M, w.y, colW, { pt: 20, lead: 1.12 });

  if (c.targetJobTitle.trim()) {
    w.y += 1.6;
    w.font("bold").size(10).color(ACCENT);
    w.y += w.para(c.targetJobTitle, M, w.y, colW, { pt: 10, lead: 1.2 });
  }

  const contacts = contactBits(p);
  if (contacts.length) {
    w.y += 2.4;
    w.font("normal").size(8).color(MUTED);
    w.y += w.para(contacts.join("   ·   "), M, w.y, colW, { pt: 8, lead: 1.35 });
  }
  const meta = metaBits(p);
  if (meta.length) {
    w.y += 1;
    w.font("normal").size(7.4).color(MUTED);
    w.y += w.para(meta.join("   ·   "), M, w.y, colW, { pt: 7.4, lead: 1.35 });
  }

  w.y = Math.max(w.y, sideY) + 6;
  const full = PAGE_W - M * 2;

  if (c.summary.trim()) {
    w.y += w.sectionTitle("Profile", M, w.y, full);
    w.font("normal").size(9).color(BODY);
    w.y += w.para(c.summary, M, w.y, full, { pt: 9, lead: 1.45 }) + 5;
  }

  const exps = realExp(c);
  if (exps.length) {
    w.y += w.sectionTitle("Experience", M, w.y, full);
    for (const e of exps) {
      w.ensure(20);
      const range = dateRange(e.start, e.end, e.current);
      w.font("normal").size(7.8).color(MUTED);
      const rangeW = range ? w.width(range) + 3 : 0;
      if (range) w.doc.text(range, PAGE_W - M, w.y + 0.6, { align: "right", baseline: "top" });

      w.font("bold").size(9.6).color(INK);
      const head = e.role.trim() || "Role";
      w.doc.text(head, M, w.y, { baseline: "top" });
      const headW = w.width(head);
      if (e.company.trim()) {
        w.font("normal").size(9.6).color(MUTED);
        w.doc.text(` · ${e.company}`, M + headW, w.y, { baseline: "top", maxWidth: full - headW - rangeW });
      }
      w.y += 4.6;

      if (e.location.trim()) {
        w.font("normal").size(7.6).color(MUTED);
        w.y += w.para(e.location, M, w.y, full, { pt: 7.6, lead: 1.25 }) + 0.6;
      }

      for (const b of clean(e.bullets)) {
        w.ensure(8);
        w.fill(ACCENT);
        w.doc.circle(M + 1, w.y + 1.5, 0.5, "F");
        w.font("normal").size(8.8).color(BODY);
        w.y += w.para(b, M + 3.6, w.y, full - 3.6, { pt: 8.8, lead: 1.42 }) + 0.9;
      }
      w.y += 3.4;
    }
    w.y += 1.5;
  }

  if (c.skills.length) {
    w.ensure(18);
    w.y += w.sectionTitle("Skills", M, w.y, full);
    w.y += w.chipRow(skillNames(c.skills), M, w.y, full, { pt: 7.8, bg: [252, 240, 231], fg: [154, 67, 30], border: [240, 217, 200] }) + 5.5;
  }

  const edus = realEdu(c);
  if (edus.length) {
    w.ensure(16);
    w.y += w.sectionTitle("Education", M, w.y, full);
    for (const e of edus) {
      w.ensure(9);
      const range = [e.start, e.end].filter(Boolean).join(" — ");
      w.font("normal").size(7.8).color(MUTED);
      if (range) w.doc.text(range, PAGE_W - M, w.y + 0.4, { align: "right", baseline: "top" });
      w.font("bold").size(9).color(INK);
      w.doc.text(e.school, M, w.y, { baseline: "top" });
      w.y += 4.2;
      const sub = [e.degree, e.field].filter(Boolean).join(", ");
      if (sub) {
        w.font("normal").size(8.4).color(BODY);
        w.y += w.para(sub, M, w.y, full - 26, { pt: 8.4, lead: 1.3 });
      }
      w.y += 3;
    }
  }
}

/* --------------------------------- Tech --------------------------------- */

function drawTech(w: Writer, c: ResumeContent, qr: string) {
  const SW = 62; // sidebar width
  const SP = 8; // sidebar padding
  const sideInner = SW - SP * 2;
  const p = c.personal;

  // Sidebar background across the whole page height.
  w.fill(SIDEBAR);
  w.doc.rect(0, 0, SW, PAGE_H, "F");

  let sy = 11;
  if (p.photo) {
    w.image(p.photo, SP, sy, 22, 29.3);
    sy += 32.5;
  }

  w.font("normal").size(6.6).color(TECH_ACCENT);
  w.doc.text("~/profile", SP, sy, { baseline: "top" });
  sy += 4.4;

  w.font("bold").size(13.5).color([232, 234, 239]);
  sy += w.para(p.fullName.trim() || "Your Name", SP, sy, sideInner, { pt: 13.5, lead: 1.15 });

  if (c.targetJobTitle.trim()) {
    sy += 1.4;
    w.font("bold").size(8.2).color(TECH_ACCENT);
    sy += w.para(c.targetJobTitle, SP, sy, sideInner, { pt: 8.2, lead: 1.25 });
  }

  sy += 6;
  const sideSection = (label: string) => {
    w.font("bold").size(6.4).color([139, 147, 161]);
    w.doc.text(label.toUpperCase(), SP, sy, { charSpace: 0.5, baseline: "top" });
    sy += 4.6;
  };

  const contacts: [string, string][] = (
    [
      ["mail", p.email],
      ["tel", p.phone],
      ["loc", p.location],
      ["web", p.website],
      ["tg", p.telegram],
    ] as [string, string][]
  ).filter(([, v]) => v.trim());

  if (contacts.length) {
    sideSection("Contact");
    for (const [k, v] of contacts) {
      w.font("bold").size(6.2).color(TECH_ACCENT);
      w.doc.text(`${k}:`, SP, sy, { baseline: "top" });
      const kw = w.width(`${k}: `);
      w.font("normal").size(7).color(SIDE_TEXT);
      sy += Math.max(w.para(v, SP + kw, sy, sideInner - kw, { pt: 7, lead: 1.3 }), 3) + 1.1;
    }
    const extras = [p.citizenship, p.drivingLicense, p.workFormat].map((s) => s.trim()).filter(Boolean);
    if (extras.length) {
      sy += 1.4;
      w.stroke([43, 49, 61]);
      w.line(SP, sy, SP + sideInner, sy, 0.25);
      sy += 2.4;
      w.font("normal").size(6.6).color([139, 147, 161]);
      for (const e of extras) sy += w.para(e, SP, sy, sideInner, { pt: 6.6, lead: 1.3 }) + 0.7;
    }
    sy += 5;
  }

  if (c.skills.length) {
    sideSection("Skills");
    sy += w.chipRow(skillNames(c.skills), SP, sy, sideInner, {
      pt: 6.6,
      bg: SIDE_CHIP,
      fg: [200, 205, 214],
      border: SIDE_CHIP_LINE,
      gap: 1.3,
    }) + 6;
  }

  const edus = realEdu(c);
  if (edus.length && sy < PAGE_H - 60) {
    sideSection("Education");
    for (const e of edus) {
      w.font("bold").size(7).color([232, 234, 239]);
      sy += w.para(e.school, SP, sy, sideInner, { pt: 7, lead: 1.25 });
      const sub = [e.degree, e.field].filter(Boolean).join(", ");
      if (sub) {
        w.font("normal").size(6.4).color(SIDE_TEXT);
        sy += w.para(sub, SP, sy, sideInner, { pt: 6.4, lead: 1.25 });
      }
      const range = [e.start, e.end].filter(Boolean).join("–");
      if (range) {
        w.font("normal").size(6).color([121, 128, 141]);
        sy += w.para(range, SP, sy, sideInner, { pt: 6, lead: 1.25 });
      }
      sy += 2.4;
    }
  }

  if (qr) {
    const qy = Math.max(sy + 4, PAGE_H - 34);
    w.fill(WHITE);
    w.doc.roundedRect(SP, qy, 24, 24, 1.2, 1.2, "F");
    w.image(qr, SP + 1.5, qy + 1.5, 21, 21);
    w.font("normal").size(6).color([139, 147, 161]);
    w.doc.text(c.qr.label || "Scan", SP, qy + 27, { baseline: "top" });
  }

  /* ------------------------------ main column ------------------------------ */
  const MX = SW + 9;
  const mainW = PAGE_W - MX - 14;
  w.y = 13;

  if (c.summary.trim()) {
    w.font("bold").size(7.6).color(ACCENT);
    w.doc.text("// SUMMARY", MX, w.y, { charSpace: 0.4, baseline: "top" });
    w.y += 5.6;
    w.font("normal").size(9).color(BODY);
    w.y += w.para(c.summary, MX, w.y, mainW, { pt: 9, lead: 1.45 }) + 6.5;
  }

  const exps = realExp(c);
  if (exps.length) {
    w.font("bold").size(7.6).color(ACCENT);
    w.doc.text("// EXPERIENCE", MX, w.y, { charSpace: 0.4, baseline: "top" });
    w.y += 6;

    const railX = MX + 1.4;
    const railTop = w.y;
    let railBottom = w.y;

    for (const e of exps) {
      if (w.ensure(22)) {
        // continued on a new page — restart the rail
      }
      const rowTop = w.y;
      w.fill(ACCENT);
      w.doc.circle(railX, rowTop + 1.8, 1.15, "F");

      const tx = MX + 6;
      const tw = mainW - 6;
      const range = e.start || e.end || e.current ? [e.start, e.current ? "now" : e.end].filter(Boolean).join(" → ") : "";
      w.font("normal").size(7).color(MUTED);
      const rw = range ? w.width(range) + 3 : 0;
      if (range) w.doc.text(range, PAGE_W - 14, w.y + 0.5, { align: "right", baseline: "top" });

      w.font("bold").size(9.6).color(INK);
      w.y += w.para(e.role.trim() || "Role", tx, w.y, tw - rw, { pt: 9.6, lead: 1.2 });

      const companyLine = [e.company.trim(), e.location.trim()].filter(Boolean).join(" · ");
      if (companyLine) {
        w.font("bold").size(8.2).color(ACCENT);
        w.y += w.para(companyLine, tx, w.y, tw, { pt: 8.2, lead: 1.3 }) + 0.8;
      }

      for (const b of clean(e.bullets)) {
        w.ensure(8);
        w.font("bold").size(7).color(ACCENT);
        w.doc.text("▸", tx, w.y + 0.5, { baseline: "top" });
        w.font("normal").size(8.8).color(BODY);
        w.y += w.para(b, tx + 3.2, w.y, tw - 3.2, { pt: 8.8, lead: 1.42 }) + 0.9;
      }
      railBottom = w.y;
      w.y += 4.2;
    }

    // Timeline rail behind the dots.
    w.stroke([240, 227, 218]);
    w.line(railX, railTop + 3.4, railX, Math.max(railBottom - 2, railTop + 3.4), 0.5);
  }
}

/* ------------------------------- Executive ------------------------------- */

function drawExecutive(w: Writer, c: ResumeContent, qr: string) {
  const M = 18;
  const full = PAGE_W - M * 2;
  const p = c.personal;
  w.y = 15;

  if (qr) {
    w.image(qr, PAGE_W - M - 18, 14, 18, 18);
    w.font("normal").size(5.8).color(MUTED);
    w.doc.text(c.qr.label || "Scan", PAGE_W - M - 9, 33, { align: "center", baseline: "top" });
  }

  if (p.photo) {
    w.image(p.photo, PAGE_W / 2 - 10.5, w.y, 21, 28);
    w.y += 31;
  }

  w.font("bold").size(21).color([35, 38, 43]);
  w.y += w.para(p.fullName.trim() || "Your Name", M, w.y, full, { pt: 21, lead: 1.14, align: "center" });

  if (c.targetJobTitle.trim()) {
    w.y += 1.4;
    w.font("bold").size(8.4).color(EXEC);
    w.y += w.para(c.targetJobTitle.toUpperCase(), M, w.y, full, { pt: 8.4, lead: 1.25, align: "center", charSpace: 0.4 });
  }

  w.y += 2.6;
  w.fill(EXEC);
  w.doc.rect(PAGE_W / 2 - 7, w.y, 14, 0.9, "F");
  w.y += 4;

  const contacts = contactBits(p);
  if (contacts.length) {
    w.font("normal").size(7.6).color(MUTED);
    w.y += w.para(contacts.join("    |    "), M, w.y, full, { pt: 7.6, lead: 1.35, align: "center" });
  }
  const meta = metaBits(p);
  if (meta.length) {
    w.y += 0.8;
    w.font("normal").size(7).color(MUTED);
    w.y += w.para(meta.join("    |    "), M, w.y, full, { pt: 7, lead: 1.35, align: "center" });
  }
  w.y += 6;

  const execSection = (label: string) => {
    w.ensure(16);
    w.font("bold").size(8).color(EXEC);
    w.doc.text(label.toUpperCase(), M, w.y, { charSpace: 0.6, baseline: "top" });
    const lw = w.width(label.toUpperCase()) + label.length * 0.6;
    w.stroke(EXEC_LINE);
    w.line(M + lw + 3, w.y + 1.8, PAGE_W - M, w.y + 1.8, 0.25);
    w.y += 6;
  };

  if (c.summary.trim()) {
    execSection("Executive Summary");
    w.font("normal").size(9).color(BODY);
    w.y += w.para(c.summary, M + 6, w.y, full - 12, { pt: 9, lead: 1.5, align: "center" }) + 5;
  }

  const exps = realExp(c);
  if (exps.length) {
    execSection("Professional Experience");
    for (const e of exps) {
      w.ensure(20);
      const range = dateRange(e.start, e.end, e.current);
      w.font("bold").size(7.4).color(MUTED);
      if (range) w.doc.text(range, PAGE_W - M, w.y + 0.5, { align: "right", baseline: "top" });
      const rw = range ? w.width(range) + 4 : 0;

      w.font("bold").size(9.6).color([35, 38, 43]);
      w.y += w.para(e.role.trim() || "Role", M, w.y, full - rw, { pt: 9.6, lead: 1.2 });

      const companyLine = [e.company.trim() || "Company", e.location.trim()].filter(Boolean).join(" — ");
      w.font("bold").size(8.4).color(EXEC);
      w.y += w.para(companyLine, M, w.y, full - rw, { pt: 8.4, lead: 1.3 }) + 0.8;

      for (const b of clean(e.bullets)) {
        w.ensure(8);
        w.fill(EXEC);
        w.doc.circle(M + 1, w.y + 1.5, 0.5, "F");
        w.font("normal").size(8.6).color(BODY);
        w.y += w.para(b, M + 3.6, w.y, full - 3.6, { pt: 8.6, lead: 1.42 }) + 0.9;
      }
      w.y += 3.6;
    }
    w.y += 1;
  }

  if (c.skills.length) {
    execSection("Core Competencies");
    w.y += w.chipRow(skillNames(c.skills), M, w.y, full, { pt: 7.6, bg: EXEC_CHIP_BG, fg: [91, 67, 38], border: EXEC_LINE, gap: 1.6 }) + 5.5;
  }

  const edus = realEdu(c);
  if (edus.length) {
    execSection("Education");
    for (const e of edus) {
      w.ensure(10);
      const range = [e.start, e.end].filter(Boolean).join(" — ");
      w.font("normal").size(7.4).color(MUTED);
      if (range) w.doc.text(range, PAGE_W - M, w.y + 0.4, { align: "right", baseline: "top" });
      w.font("bold").size(9).color([35, 38, 43]);
      w.y += w.para(e.school, M, w.y, full - 26, { pt: 9, lead: 1.2 });
      const sub = [e.degree, e.field].filter(Boolean).join(", ");
      if (sub) {
        w.font("normal").size(8.2).color(BODY);
        w.y += w.para(sub, M, w.y, full - 26, { pt: 8.2, lead: 1.3 });
      }
      w.y += 3;
    }
  }
}

/* ------------------------------ Cover letter ------------------------------ */

function drawCoverLetter(w: Writer, letter: string, p: PersonalInfo, company: string) {
  const M = 20;
  const full = PAGE_W - M * 2;
  w.y = 18;

  if (p.photo) w.image(p.photo, PAGE_W - M - 15, w.y, 15, 20);

  w.font("bold").size(16).color(INK);
  w.y += w.para(p.fullName.trim() || "Your Name", M, w.y, full - 20, { pt: 16, lead: 1.15 });

  const contacts = contactBits(p);
  if (contacts.length) {
    w.y += 1.4;
    w.font("normal").size(7.8).color(MUTED);
    w.y += w.para(contacts.join("   ·   "), M, w.y, full - 20, { pt: 7.8, lead: 1.35 });
  }

  w.y = Math.max(w.y, p.photo ? 40 : w.y) + 3;
  w.stroke([35, 38, 43]);
  w.line(M, w.y, PAGE_W - M, w.y, 0.6);
  w.y += 7;

  w.font("normal").size(9).color(BODY);
  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  w.y += w.para(today, M, w.y, full, { pt: 9, lead: 1.4 }) + 2.5;

  w.font("bold").size(9.4).color(INK);
  w.y += w.para(company.trim() || "Hiring Team", M, w.y, full, { pt: 9.4, lead: 1.4 }) + 5;

  const paragraphs = letter.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  for (const para of paragraphs) {
    w.ensure(16);
    if (/^(sincerely|с уважением|hurmat bilan)/i.test(para)) {
      w.font("normal").size(9.2).color(BODY);
      w.y += w.para(para.split("\n")[0], M, w.y, full, { pt: 9.2, lead: 1.5 }) + 8;
      w.font("bold").size(11).color(INK);
      w.y += w.para(p.fullName.trim() || "Your Name", M, w.y, full, { pt: 11, lead: 1.3 });
    } else {
      w.font("normal").size(9.2).color(BODY);
      w.y += w.para(para, M, w.y, full, { pt: 9.2, lead: 1.55 }) + 4.2;
    }
  }

}

/* --------------------------------- API --------------------------------- */

export async function downloadResumePdf(opts: {
  content: ResumeContent;
  template: TemplateId;
  filename: string;
  qrDataUrl?: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const hasUnicode = await registerFonts(doc);
  const w = new Writer(doc, hasUnicode);
  w.font("normal").size(9).color(INK);

  const qr = opts.qrDataUrl ?? "";
  if (opts.template === "tech") drawTech(w, opts.content, qr);
  else if (opts.template === "executive") drawExecutive(w, opts.content, qr);
  else drawMinimalist(w, opts.content, qr);

  doc.setProperties({
    title: opts.filename.replace(/\.pdf$/i, ""),
    subject: opts.content.targetJobTitle || "Resume",
    author: opts.content.personal.fullName || "ResumAI Hub",
    creator: "ResumAI Hub",
  });
  doc.save(opts.filename);
}

export async function downloadCoverLetterPdf(opts: {
  letter: string;
  personal: PersonalInfo;
  company: string;
  filename: string;
  qrDataUrl?: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const hasUnicode = await registerFonts(doc);
  const w = new Writer(doc, hasUnicode);
  w.font("normal").size(9).color(INK);

  drawCoverLetter(w, opts.letter, opts.personal, opts.company);
  doc.setProperties({
    title: opts.filename.replace(/\.pdf$/i, ""),
    author: opts.personal.fullName || "ResumAI Hub",
    creator: "ResumAI Hub",
  });
  doc.save(opts.filename);
}
