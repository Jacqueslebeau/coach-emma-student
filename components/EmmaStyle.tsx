"use client";

// Choix du style d'Emma AU LANCEMENT d'une séance (tutorat ou coaching) :
// le premier choix devient le défaut, modifiable à chaque nouvelle séance.
import { useEffect, useState } from "react";

const STYLES: { key: string; label: string; hint: string }[] = [
  { key: "sympa", label: "Friendly", hint: "warm and encouraging" },
  { key: "strict", label: "Strict", hint: "structured and demanding" },
  { key: "direct", label: "Direct", hint: "straight to the point" },
  { key: "chatty", label: "Chatty", hint: "conversational (5 min max)" },
];

export default function EmmaStyle() {
  const [style, setStyle] = useState<string>("");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((p) => setStyle(p.tutor_style || "sympa")).catch(() => setStyle("sympa"));
  }, []);

  async function pick(key: string) {
    setStyle(key); // optimiste — la séance qui démarre l'utilise
    fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tutor_style: key }) }).catch(() => {});
  }

  if (!style) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">Emma&apos;s style:</span>
      {STYLES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => pick(s.key)}
          title={s.hint}
          className={style === s.key ? "btn-primary !py-1 !px-3 text-[12.5px]" : "btn-ghost !py-1 !px-3 text-[12.5px]"}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
