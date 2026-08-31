"use client";

// POP-UP D'ATTENTE pendant qu'Emma fabrique quelque chose de long (leçon,
// questions…) : studio vert, Emma, messages qui tournent — jamais un écran
// figé qui laisse croire que rien ne se passe.
import { useEffect, useState } from "react";
import EmmaFace from "@/components/EmmaFace";

export default function WaitOverlay({ title, lines, note }: {
  title: string;
  lines: string[];   // messages rotatifs
  note?: string;     // ex. « usually 1-2 minutes »
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % lines.length), 2800);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-indigo-deep px-8 py-8 text-center">
        <div className="flex justify-center"><EmmaFace state="listening" size={84} /></div>
        <h3 className="font-serif font-bold text-lg text-white mt-3">{title}</h3>
        <p className="text-amber font-semibold text-[14.5px] animate-pulse mt-3 min-h-[22px]">{lines[i]}</p>
        {note && <p className="text-white/60 text-xs mt-3">{note}</p>}
      </div>
    </div>
  );
}
