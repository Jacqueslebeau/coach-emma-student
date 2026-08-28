// Données du tableau de bord : profil & niveaux, séances (durées + couvert),
// leçons/topics couverts, maîtrise agrégée, points à travailler, tendance
// des scores d'exercices et niveau indicatif actuel.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { estimateGrade } from "@/lib/examTechnique";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const [{ data: lessons }, { data: mastery }, { data: weakPoints }, { data: sessions }, { data: exAttempts }] =
    await Promise.all([
      auth.sb
        .from("lessons")
        .select("id, title, subject, spec_topic, stage, concepts, created_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      auth.sb
        .from("concept_mastery")
        .select("lesson_id, concept_key, label, status, updated_at")
        .eq("user_id", auth.user.id),
      auth.sb
        .from("weak_points")
        .select("id, lesson_id, concept_key, label, misconception, due_at, created_at")
        .eq("user_id", auth.user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(30),
      auth.sb
        .from("study_sessions")
        .select("id, kind, ref_id, title, subject, started_at, last_activity_at, summary")
        .eq("user_id", auth.user.id)
        .order("started_at", { ascending: false })
        .limit(30),
      auth.sb
        .from("attempts")
        .select("result, created_at")
        .eq("user_id", auth.user.id)
        .eq("kind", "exercise")
        .not("result", "is", null)
        .order("created_at", { ascending: true })
        .limit(40),
    ]);

  // Tendance des scores d'exercices (chronologique) + niveau indicatif.
  const scores = (exAttempts || [])
    .map((a) => {
      const items = (a.result as { items?: { marks_awarded?: number; marks_total?: number }[] })?.items || [];
      const tot = items.reduce((s, i) => s + (i.marks_total || 0), 0);
      const got = items.reduce((s, i) => s + (i.marks_awarded || 0), 0);
      return tot > 0 ? { at: a.created_at as string, pct: Math.round((100 * got) / tot) } : null;
    })
    .filter((s): s is { at: string; pct: number } => s !== null);
  // Moyenne pondérée récente (les 5 dernières séries comptent double).
  const recent = scores.slice(-5);
  const weighted = [...scores.map((s) => s.pct), ...recent.map((s) => s.pct)];
  const avgPct = weighted.length ? Math.round(weighted.reduce((a, b) => a + b, 0) / weighted.length) : null;
  const estimatedGrade = avgPct !== null ? estimateGrade(avgPct) : null;

  return NextResponse.json({
    first_name: auth.firstName,
    profile: {
      tutor_style: auth.style,
      current_grade: auth.currentGrade,
      baseline_grade: auth.baselineGrade,
      target_grade: auth.targetGrade,
    },
    lessons: lessons || [],
    mastery: mastery || [],
    weak_points: weakPoints || [],
    sessions: (sessions || []).map((s) => ({
      ...s,
      duration_min: Math.max(
        1,
        Math.round((new Date(s.last_activity_at).getTime() - new Date(s.started_at).getTime()) / 60000)
      ),
    })),
    exam_scores: scores,
    avg_pct: avgPct,
    estimated_grade: estimatedGrade,
  });
}
