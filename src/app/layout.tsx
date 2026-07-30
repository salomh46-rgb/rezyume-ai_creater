import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme";
import { ToastProvider } from "@/components/toast";
import { LanguageProvider } from "@/components/language-provider";

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-disp",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-ser",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumAI Hub — AI Resume & Cover Letter Builder",
  description:
    "Craft your dream resume in seconds with AI. Live A4 preview, three professional templates, tailored cover letters, and one-click PDF export.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans bg-bg text-ink antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
