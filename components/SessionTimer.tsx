"use client";

// Minuteur de séance, aligné sur l'horloge d'Emma :
// - tutoring : 45 min visées — pré-alerte à 42 (Emma commence à clore),
//   clôture à 45 avec 2-3 min de grâce, jamais de fin abrupte.
// - coaching : 15 min visées — pré-alerte à 12, clôture à 15 (+ grâce).
import { useEffect, useState } from "react";

const PRESET = {
  tutoring: {
    wind: 42, target: 45,
    windMsg: "Emma is starting to wrap up — finish the step you're on.",
    wrapMsg: "45 min — wrap-up time: quick summary, then a proper break. You'll remember more.",
  },
  coaching: {
    wind: 12, target: 15,
    windMsg: "A few minutes left — Emma will close with your action points.",
    wrapMsg: "15 min — time to leave with your 1-3 actions. Short and regular beats long.",
  },
} as const;

export default function SessionTimer({ kind = "tutoring" }: { kind?: "tutoring" | "coaching" }) {
  const [start] = useState(() => Date.now());
  const [mins, setMins] = useState(0);
  const p = PRESET[kind];

  useEffect(() => {
    const t = setInterval(() => setMins(Math.floor((Date.now() - start) / 60000)), 30_000);
    return () => clearInterval(t);
  }, [start]);

  const cls =
    mins >= p.target ? "bg-gap-bg text-gap" : mins >= p.wind ? "bg-learning-bg text-learning" : "bg-indigo-soft text-indigo";

  return (
    <div className="flex items-center gap-2">
      <span className={`chip ${cls} font-mono`}>⏱ {mins} min</span>
      {mins >= p.target ? (
        <span className="text-xs font-semibold text-gap">{p.wrapMsg}</span>
      ) : mins >= p.wind ? (
        <span className="text-xs font-semibold text-learning">{p.windMsg}</span>
      ) : null}
    </div>
  );
}
