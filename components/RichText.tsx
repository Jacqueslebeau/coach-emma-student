"use client";

// Rendu du contenu généré : markdown restreint (##, ###, **gras**, `code`,
// listes -) + notation LaTeX via KaTeX auto-render (chargé dans le layout).
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    renderMathInElement?: (el: HTMLElement, opts: Record<string, unknown>) => void;
  }
}

function inline(text: string, keyBase: string): React.ReactNode[] {
  // Gras **…** et code `…` — sans toucher au LaTeX (backslashes intacts).
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${keyBase}-b${i++}`}>{tok.slice(2, -2)}</strong>);
    else out.push(<code key={`${keyBase}-c${i++}`}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderMd(text: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  const lines = (text || "").split("\n");
  let list: string[] = [];
  let para: string[] = [];
  let k = 0;

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul${k++}`}>
          {list.map((li, j) => (
            <li key={j}>{inline(li, `li${k}-${j}`)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      blocks.push(<p key={`p${k++}`}>{inline(para.join(" "), `p${k}`)}</p>);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) { flushList(); flushPara(); continue; }
    if (t.startsWith("### ")) { flushList(); flushPara(); blocks.push(<h3 key={`h${k++}`}>{inline(t.slice(4), `h${k}`)}</h3>); continue; }
    if (t.startsWith("## ")) { flushList(); flushPara(); blocks.push(<h2 key={`h${k++}`}>{inline(t.slice(3), `h${k}`)}</h2>); continue; }
    if (t.startsWith("- ") || t.startsWith("* ")) { flushPara(); list.push(t.slice(2)); continue; }
    // Bloc LaTeX affiché \[...\] sur sa propre ligne : paragraphe dédié.
    if (t.startsWith("\\[")) { flushList(); flushPara(); blocks.push(<p key={`m${k++}`}>{t}</p>); continue; }
    flushList();
    para.push(t);
  }
  flushList();
  flushPara();
  return blocks;
}

export default function RichText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const tick = () => {
      if (cancelled || !ref.current) return;
      if (window.renderMathInElement) {
        window.renderMathInElement(ref.current, {
          delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "$$", right: "$$", display: true },
          ],
          throwOnError: false,
        });
      } else if (tries++ < 40) {
        setTimeout(tick, 250); // le script KaTeX (CDN) peut arriver après l'hydratation
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [text]);

  return (
    <div ref={ref} className={`rich ${className || ""}`}>
      {renderMd(text)}
    </div>
  );
}
