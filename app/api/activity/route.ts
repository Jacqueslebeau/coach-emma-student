// Recherche d'activité : toutes les séances (leçons + coaching) sur une
// période — cette semaine, la semaine dernière, le mois, ou custom from→to —
// avec la matière résolue pour chaque séance. Alimente les historiques
// filtrables du tableau de bord et des pages matière.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";

function parseDay(v: string | null): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(v + "T00:00:00.000Z");
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const url = new URL(req.url);
  const subject = url.searchParams.get("subject"); // clé matière, "coaching", ou null = tout
  // Défaut : la semaine en cours (lundi → maintenant).
  const now = new Date();
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const from = parseDay(url.searchParams.get("from")) || monday;
  const toDay = parseDay(url.searchParams.get("to"));
  const to = toDay ? new Date(toDay.getTime() + 864e5) : new Date(now.getTime() + 60_000);

  const [{ data: sessions }, { data: lessons }] = await Promise.all([
    auth.sb
      .from("study_sessions")
      .select("id, kind, ref_id, title, subject, started_at, last_activity_at, summary")
      .eq("user_id", auth.user.id)
      .gte("started_at", from.toISOString())
      .lt("started_at", to.toISOString())
      .order("started_at", { ascending: false })
      .limit(300),
    auth.sb.from("lessons").select("id, subject, title").eq("user_id", auth.user.id).limit(500),
  ]);

  const lessonSubject = new Map((lessons || []).map((l) => [l.id as string, l.subject as string]));
  const rows = (sessions || [])
    .map((s) => {
      // La matière d'une séance de leçon vient de la leçon elle-même (robuste
      // même pour les vieilles séances) ; le coaching est transverse.
      const subj =
        s.kind === "coaching"
          ? "coaching"
          : lessonSubject.get(s.ref_id as string) ||
            (SUBJECT_KEYS.includes(s.subject as SubjectKey) ? (s.subject as string) : "maths");
      return {
        ...s,
        subject: subj,
        duration_min: Math.max(
          1,
          Math.round((new Date(s.last_activity_at).getTime() - new Date(s.started_at).getTime()) / 60000)
        ),
      };
    })
    .filter((s) => !subject || s.subject === subject);

  const bySubject: Record<string, { count: number; minutes: number }> = {};
  for (const s of rows) {
    const b = (bySubject[s.subject] ||= { count: 0, minutes: 0 });
    b.count += 1;
    b.minutes += s.duration_min;
  }

  return NextResponse.json({
    from: from.toISOString().slice(0, 10),
    to: new Date(to.getTime() - 864e5).toISOString().slice(0, 10),
    sessions: rows,
    totals: {
      count: rows.length,
      minutes: rows.reduce((s, x) => s + x.duration_min, 0),
      by_subject: bySubject,
    },
  });
}
