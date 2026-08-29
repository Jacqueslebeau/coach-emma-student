import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Link from "next/link";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coach Emma Student",
  description:
    "The personal A Level tutor that aims for the A★: courses, mastery checks, targeted remediation, marked past-paper practice, exam coaching.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        {/* KaTeX : rendu de la notation mathématique (cours, questions, corrigés) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css"
        />
      </head>
      <body>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/contrib/auto-render.min.js" strategy="afterInteractive" />
        <header className="border-b border-line bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="mx-auto max-w-5xl px-5 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-baseline gap-2">
              <span className="font-serif font-black text-lg text-indigo-deep">Coach&nbsp;Emma</span>
              <span className="font-serif font-black text-lg text-amber">Student</span>
              <span className="font-mono text-[11px] text-faint ml-1">A★</span>
            </Link>
            <HeaderNav />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-5 pb-10 pt-4 text-xs text-faint">
          Coach Emma Student — private beta · A Level · Edexcel, AQA, OCR. Parental consent required. A separate product from Coach Emma.
        </footer>
      </body>
    </html>
  );
}
