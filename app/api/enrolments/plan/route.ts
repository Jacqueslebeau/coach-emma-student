// Le PLAN D'ACTION d'une matière — le rapport d'adéquation entre le niveau
// actuel et l'objectif au A Level, calibré sur le board choisi. Généré à la
// demande (première visite du tableau de bord matière) puis conservé.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { askClaude, extractJson } from "@/lib/claude";
import { actionPlanSystem } from "@/lib/prompts";
import { getSubjectBoard } from "@/lib/subjects";
import { monthsToExam } from "@/lib/grades";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const subjectKey = String(body?.subject || "");
  const force = body?.force === true;

  const { data: enrolment } = await auth.sb
    .from("subject_enrolments")
    .select("id, subject, board, current_grade, target_grade, exam_date, gcse_grade, gcse_note, action_plan")
    .eq("user_id", auth.user.id)
    .eq("subject", subjectKey)
    .maybeSingle();
  if (!enrolment) return NextResponse.json({ error: "matière non inscrite" }, { status: 404 });

  if (enrolment.action_plan && !force) {
    return NextResponse.json({ plan: enrolment.action_plan, cached: true });
  }

  const subj = getSubjectBoard(enrolment.subject, enrolment.board, auth.contentLang);
  try {
    const raw = await askClaude({
      system: actionPlanSystem(auth.firstName, auth.style, subj, {
        currentGrade: enrolment.current_grade,
        targetGrade: enrolment.target_grade,
        examDate: enrolment.exam_date,
        gcseGrade: enrolment.gcse_grade,
        gcseNote: enrolment.gcse_note,
        monthsToExam: monthsToExam(enrolment.exam_date),
      }),
      content: subj.teachLang === "fr"
        ? `Écris le plan d'action de ${auth.firstName || "l'élève"} en ${subj.labelFr} (${subj.board} ${subj.spec}).`
        : `Write ${auth.firstName || "the student"}'s action plan for ${subj.labelEn} (${subj.board} ${subj.spec}).`,
      maxTokens: 3000,
      workflow: "action-plan",
      userId: auth.user.id,
      sb: auth.sb,
    });
    const plan = extractJson<Record<string, unknown>>(raw);
    await auth.sb
      .from("subject_enrolments")
      .update({ action_plan: plan })
      .eq("id", enrolment.id);
    return NextResponse.json({ plan });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "plan impossible" }, { status: 502 });
  }
}
