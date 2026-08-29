"use client";

// Filtre de période des historiques : cette semaine, la semaine dernière,
// le mois en cours, ou custom (from → to). Émet des bornes yyyy-mm-dd.
import { useState } from "react";

export type Period = { from: string; to: string; preset: string };

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentWeek(): Period {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return { from: iso(monday), to: iso(now), preset: "week" };
}

function lastWeek(): Period {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: iso(monday), to: iso(sunday), preset: "lastweek" };
}

function currentMonth(): Period {
  const now = new Date();
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now), preset: "month" };
}

const PRESETS: { key: string; label: string; make: () => Period }[] = [
  { key: "week", label: "This week", make: currentWeek },
  { key: "lastweek", label: "Last week", make: lastWeek },
  { key: "month", label: "This month", make: currentMonth },
];

export default function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const custom = value.preset === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.make())}
          className={
            value.preset === p.key
              ? "chip !text-[12.5px] !py-1.5 !px-3.5 bg-indigo text-white"
              : "chip !text-[12.5px] !py-1.5 !px-3.5 bg-white border border-line text-muted hover:text-indigo"
          }
        >
          {p.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange({ from, to, preset: "custom" })}
        className={
          custom
            ? "chip !text-[12.5px] !py-1.5 !px-3.5 bg-indigo text-white"
            : "chip !text-[12.5px] !py-1.5 !px-3.5 bg-white border border-line text-muted hover:text-indigo"
        }
      >
        Custom
      </button>
      {custom && (
        <span className="flex items-center gap-2 text-sm">
          <input
            type="date"
            className="input !py-1 !px-2 !text-[13px] w-auto"
            value={from}
            max={to}
            onChange={(e) => { setFrom(e.target.value); if (e.target.value) onChange({ from: e.target.value, to, preset: "custom" }); }}
          />
          <span className="text-faint">→</span>
          <input
            type="date"
            className="input !py-1 !px-2 !text-[13px] w-auto"
            value={to}
            min={from}
            onChange={(e) => { setTo(e.target.value); if (e.target.value) onChange({ from, to: e.target.value, preset: "custom" }); }}
          />
        </span>
      )}
    </div>
  );
}
