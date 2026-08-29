"use client";

// Minuteur de séance : une session efficace dure 45-60 min max — au-delà,
// l'élève perd le fil. Signaux doux à 45 min, franc à 60 min.
import { useEffect, useState } from "react";

export default function SessionTimer() {
  const [start] = useState(() => Date.now());
  const [mins, setMins] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMins(Math.floor((Date.now() - start) / 60000)), 30_000);
    return () => clearInterval(t);
  }, [start]);

  const cls =
    mins >= 60 ? "bg-gap-bg text-gap" : mins >= 45 ? "bg-learning-bg text-learning" : "bg-indigo-soft text-indigo";

  return (
    <div className="flex items-center gap-2">
      <span className={`chip ${cls} font-mono`}>⏱ {mins} min</span>
      {mins >= 60 ? (
        <span className="text-xs font-semibold text-gap">
          1h+ — your brain is saturating: note where you are and come back after a proper break.
        </span>
      ) : mins >= 45 ? (
        <span className="text-xs font-semibold text-learning">
          45 min — finish the step you're on, then take a 10-minute break: you'll remember more.
        </span>
      ) : null}
    </div>
  );
}
