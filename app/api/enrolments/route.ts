// Inscriptions par matière : la matière, SON board, le niveau de départ,
// l'objectif au A Level et la session d'examen visée. C'est la colonne
// vertébrale de la console par matière — chaque leçon hérite du board choisi ici.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { BOARD_OPTIONS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";

const GRADE_SET = new Set(["E", "D", "C", "B", "A", "A*", ""]);

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { data } = await auth.sb
    .from("subject_enrolments")
    .select("id, subject, board, spec, current_grade, baseline_grade, target_grade, exam_date, action_plan, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });
  return NextResponse.json({ enrolments: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const list: unknown[] = Array.isArray(body?.enrolments) ? body.enrolments : [];
  if (!list.length) return NextResponse.json({ error: "aucune matière sélectionnée" }, { status: 400 });

  const { data: existingRows } = await auth.sb
    .from("subject_enrolments")
    .select("subject, board, current_grade, target_grade, baseline_grade, exam_date")
    .eq("user_id", auth.user.id);
  const existing = new Map((existingRows || []).map((e) => [e.subject as string, e]));

  const rows = [];
  for (const raw of list) {
    const e = raw as Record<string, unknown>;
    const subject = String(e.subject || "");
    if (!SUBJECT_KEYS.includes(subject as SubjectKey)) continue;
    const options = BOARD_OPTIONS[subject as SubjectKey];
    const wanted = String(e.board || "").trim().toLowerCase();
    const opt = options.find((o) => o.board === wanted || o.label.toLowerCase() === wanted) || options[0];
    const current = GRADE_SET.has(String(e.current_grade ?? "")) ? String(e.current_grade || "") || null : null;
    const target = GRADE_SET.has(String(e.target_grade ?? "")) && e.target_grade ? String(e.target_grade) : "A*";
    const examDate = String(e.exam_date || "").slice(0, 10) || null;

    const prev = existing.get(subject);
    // Le plan d'action dépend du board et des niveaux : s'ils changent, il se régénère.
    const settingsChanged =
      !prev || prev.board !== opt.label || prev.current_grade !== current ||
      prev.target_grade !== target || prev.exam_date !== examDate;
    rows.push({
      user_id: auth.user.id,
      subject,
      board: opt.label,
      spec: opt.spec,
      current_grade: current,
      // Le niveau de départ se fige à la première inscription : c'est la ligne de base.
      baseline_grade: prev?.baseline_grade || current,
      target_grade: target,
      exam_date: examDate,
      ...(settingsChanged ? { action_plan: null } : {}),
    });
  }
  if (!rows.length) return NextResponse.json({ error: "matières invalides" }, { status: 400 });

  const { error } = await auth.sb
    .from("subject_enrolments")
    .upsert(rows, { onConflict: "user_id,subject" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = await auth.sb
    .from("subject_enrolments")
    .select("id, subject, board, spec, current_grade, baseline_grade, target_grade, exam_date, action_plan")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });
  return NextResponse.json({ enrolments: data || [] });
}
