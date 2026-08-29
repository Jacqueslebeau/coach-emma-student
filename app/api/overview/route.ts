// Données du tableau de bord : profil, inscriptions par matière (board,
// niveaux, plan), et un ROLL-UP PAR MATIÈRE — leçons, points ouverts, temps
// de travail, tendance des scores et niveau indicatif. Tout est distingué
// par matière ; le détail vit sur /matiere/[subject].
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { estimateGrade } from "@/lib/examTechnique";

function scoreOf(result: unknown): number | null {
  const items = (result as { items?: { marks_awarded?: number; marks_total?: number }[] })?.items || [];
  const tot = items.reduce((s, i) => s + (i.marks_total || 0), 0);
  const got = items.reduce((s, i) => s + (i.marks_awarded || 0), 0);
  return tot > 0 ? Math.round((100 * got) / tot) : null;
}

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const [{ data: enrolments }, { data: lessons }, { data: mastery }, { data: weakPoints }, { data: sessions }, { data: exAttempts }] =
    await Promise.all([
      auth.sb
        .from("subject_enrolments")
        .select("id, subject, board, spec, current_grade, baseline_grade, target_grade, exam_date, action_plan, created_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: true }),
      auth.sb
        .from("lessons")
        .select("id, title, subject, exam_board, spec_topic, stage, concepts, created_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(100),
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
        .limit(60),
      auth.sb
        .from("study_sessions")
        .select("id, kind, ref_id, subject, started_at, last_activity_at")
        .eq("user_id", auth.user.id)
        .order("started_at", { ascending: false })
        .limit(200),
      auth.sb
        .from("attempts")
        .select("result, lesson_id, created_at")
        .eq("user_id", auth.user.id)
        .eq("kind", "exercise")
        .not("result", "is", null)
        .order("created_at", { ascending: true })
        .limit(120),
    ]);

  const lessonSubject = new Map((lessons || []).map((l) => [l.id as string, l.subject as string]));

  // Roll-up par matière : la console distingue TOUT par matière.
  type Roll = {
    lessons: number; lessons_done: number; open_weak_points: number;
    minutes: number; scores: { at: string; pct: number }[];
    avg_pct: number | null; estimated_grade: string | null;
  };
  const roll = new Map<string, Roll>();
  const forSubject = (k: string): Roll => {
    let r = roll.get(k);
    if (!r) { r = { lessons: 0, lessons_done: 0, open_weak_points: 0, minutes: 0, scores: [], avg_pct: null, estimated_grade: null }; roll.set(k, r); }
    return r;
  };

  for (const l of lessons || []) {
    const r = forSubject(l.subject as string);
    r.lessons += 1;
    if (l.stage === "done") r.lessons_done += 1;
  }
  for (const w of weakPoints || []) {
    const subj = lessonSubject.get(w.lesson_id as string);
    if (subj) forSubject(subj).open_weak_points += 1;
  }
  for (const s of sessions || []) {
    if (s.kind !== "lesson") continue;
    const subj = lessonSubject.get(s.ref_id as string);
    if (!subj) continue;
    forSubject(subj).minutes += Math.max(
      1,
      Math.round((new Date(s.last_activity_at).getTime() - new Date(s.started_at).getTime()) / 60000)
    );
  }
  for (const a of exAttempts || []) {
    const subj = lessonSubject.get(a.lesson_id as string);
    const pct = scoreOf(a.result);
    if (subj && pct !== null) forSubject(subj).scores.push({ at: a.created_at as string, pct });
  }
  for (const r of roll.values()) {
    const recent = r.scores.slice(-5);
    const weighted = [...r.scores.map((s) => s.pct), ...recent.map((s) => s.pct)];
    r.avg_pct = weighted.length ? Math.round(weighted.reduce((x, y) => x + y, 0) / weighted.length) : null;
    r.estimated_grade = r.avg_pct !== null ? estimateGrade(r.avg_pct) : null;
  }

  return NextResponse.json({
    first_name: auth.firstName,
    profile: {
      tutor_style: auth.style,
      current_grade: auth.currentGrade,
      baseline_grade: auth.baselineGrade,
      target_grade: auth.targetGrade,
      content_lang: auth.contentLang,
    },
    enrolments: enrolments || [],
    by_subject: Object.fromEntries(roll),
    lessons: lessons || [],
    mastery: mastery || [],
    weak_points: weakPoints || [],
  });
}
