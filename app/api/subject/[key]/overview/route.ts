// LE TABLEAU DE BORD D'UNE MATIÈRE : inscription (board, niveaux, plan
// d'action), leçons, maîtrise, points à travailler, séances et tendance des
// scores d'exercices — tout est filtré sur CETTE matière.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { estimateGrade } from "@/lib/examTechnique";
import { SUBJECT_KEYS, getSubjectBoard, type SubjectKey } from "@/lib/subjects";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { key } = await ctx.params;
  if (!SUBJECT_KEYS.includes(key as SubjectKey)) {
    return NextResponse.json({ error: "matière inconnue" }, { status: 404 });
  }

  const [{ data: enrolment }, { data: lessons }] = await Promise.all([
    auth.sb
      .from("subject_enrolments")
      .select("id, subject, board, spec, current_grade, baseline_grade, target_grade, exam_date, gcse_grade, gcse_note, action_plan")
      .eq("user_id", auth.user.id)
      .eq("subject", key)
      .maybeSingle(),
    auth.sb
      .from("lessons")
      .select("id, title, subject, exam_board, spec_topic, stage, concepts, created_at")
      .eq("user_id", auth.user.id)
      .eq("subject", key)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const lessonIds = (lessons || []).map((l) => l.id);
  const inIds = lessonIds.length ? lessonIds : ["00000000-0000-0000-0000-000000000000"];

  const [{ data: mastery }, { data: weakPoints }, { data: sessions }, { data: exAttempts }] =
    await Promise.all([
      auth.sb
        .from("concept_mastery")
        .select("lesson_id, concept_key, label, status, updated_at")
        .eq("user_id", auth.user.id)
        .in("lesson_id", inIds),
      auth.sb
        .from("weak_points")
        .select("id, lesson_id, concept_key, label, misconception, due_at, created_at")
        .eq("user_id", auth.user.id)
        .eq("status", "open")
        .in("lesson_id", inIds)
        .order("created_at", { ascending: false })
        .limit(30),
      auth.sb
        .from("study_sessions")
        .select("id, kind, ref_id, title, subject, started_at, last_activity_at, summary")
        .eq("user_id", auth.user.id)
        .eq("kind", "lesson")
        .in("ref_id", inIds)
        .order("started_at", { ascending: false })
        .limit(50),
      auth.sb
        .from("attempts")
        .select("id, result, payload, lesson_id, created_at")
        .eq("user_id", auth.user.id)
        .eq("kind", "exercise")
        .in("lesson_id", inIds)
        .order("created_at", { ascending: true })
        .limit(60),
    ]);

  // Papers DÉBRIEFÉS avec Emma (échanges kind=qa stage=paper) → « Coached ✓ »
  // dans le cycle du topic : leçon → paper → débrief → variation → secured.
  const { data: paperCoach } = await auth.sb
    .from("attempts")
    .select("payload")
    .eq("user_id", auth.user.id)
    .eq("kind", "qa")
    .contains("payload", { stage: "paper" })
    .in("lesson_id", inIds)
    .limit(200);
  const coachedPaperIds = [...new Set((paperCoach || []).map((a) => (a.payload as { paper_id?: string })?.paper_id).filter(Boolean))] as string[];

  // Tendance des scores d'exercices de la matière + niveau indicatif.
  const scores = (exAttempts || [])
    .map((a) => {
      const items = (a.result as { items?: { marks_awarded?: number; marks_total?: number }[] })?.items || [];
      const tot = items.reduce((s, i) => s + (i.marks_total || 0), 0);
      const got = items.reduce((s, i) => s + (i.marks_awarded || 0), 0);
      return tot > 0 ? { at: a.created_at as string, pct: Math.round((100 * got) / tot) } : null;
    })
    .filter((s): s is { at: string; pct: number } => s !== null);
  const recent = scores.slice(-5);
  const weighted = [...scores.map((s) => s.pct), ...recent.map((s) => s.pct)];
  const avgPct = weighted.length ? Math.round(weighted.reduce((a, b) => a + b, 0) / weighted.length) : null;

  // La bibliothèque des past papers de la matière (faits et en cours) —
  // chaque série d'exercices est un paper consultable/réimprimable.
  const lessonTitle = new Map((lessons || []).map((l) => [l.id as string, l.title as string]));
  const papers = (exAttempts || [])
    .map((a) => {
      const items = (a.result as { items?: { marks_awarded?: number; marks_total?: number }[] } | null)?.items || [];
      const awarded = items.reduce((s, i) => s + (i.marks_awarded || 0), 0);
      const gradedTotal = items.reduce((s, i) => s + (i.marks_total || 0), 0);
      const exs = ((a.payload as { exercises?: { marks?: number }[] })?.exercises || []);
      const total = gradedTotal || exs.reduce((s, e) => s + (e.marks || 0), 0);
      return {
        id: a.id as string,
        lesson_id: a.lesson_id as string,
        title: lessonTitle.get(a.lesson_id as string) || "Practice paper",
        at: a.created_at as string,
        total_marks: total,
        awarded: a.result ? awarded : null,
        decision: (a.result as { decision?: string } | null)?.decision || null,
        prep_points: (a.result as { prep_points?: string[] } | null)?.prep_points || [],
      };
    })
    .reverse();

  const subj = getSubjectBoard(key, enrolment?.board);
  return NextResponse.json({
    first_name: auth.firstName,
    subject: { key: subj.key, labelFr: subj.labelFr, board: subj.board, spec: subj.spec },
    enrolment: enrolment || null,
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
    papers,
    coached_paper_ids: coachedPaperIds,
    exam_scores: scores,
    avg_pct: avgPct,
    estimated_grade: avgPct !== null ? estimateGrade(avgPct) : null,
  });
}
