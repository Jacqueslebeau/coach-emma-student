// Profil élève : style d'Emma (strict/sympa/direct/chatty) + niveaux.
// Le niveau de DÉPART (baseline) se fige à la première saisie — c'est la
// référence de la progression affichée au tableau de bord.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";

const STYLES = new Set(["strict", "sympa", "direct", "chatty"]);
const GRADES = new Set(["E", "D", "C", "B", "A", "A*"]);

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  return NextResponse.json({
    first_name: auth.firstName,
    tutor_style: auth.style,
    current_grade: auth.currentGrade,
    baseline_grade: auth.baselineGrade,
    target_grade: auth.targetGrade,
    content_lang: auth.contentLang,
    parent_email: auth.parentEmail,
    parent_consent_at: auth.parentConsentAt,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, string> = {};
  if (typeof body.tutor_style === "string" && STYLES.has(body.tutor_style)) updates.tutor_style = body.tutor_style;
  if (typeof body.current_grade === "string" && GRADES.has(body.current_grade)) {
    updates.current_grade = body.current_grade;
    if (!auth.baselineGrade) updates.baseline_grade = body.current_grade; // figé au départ
  }
  if (typeof body.target_grade === "string" && GRADES.has(body.target_grade)) updates.target_grade = body.target_grade;
  if (typeof body.first_name === "string" && body.first_name.trim()) updates.first_name = body.first_name.trim().slice(0, 60);
  if (body.content_lang === "en" || body.content_lang === "fr") updates.content_lang = body.content_lang;
  if (typeof body.parent_email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.parent_email.trim())) {
    updates.parent_email = body.parent_email.trim().slice(0, 200);
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "rien à mettre à jour" }, { status: 400 });

  const { error } = await auth.sb.from("student_profiles").update(updates).eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
