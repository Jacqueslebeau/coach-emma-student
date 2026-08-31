// Génère le cours de la leçon — complet ou « concepts clés ». Idempotent par
// mode (re-servi depuis la base si déjà généré).
// LATENCE : le cours part chez l'élève dès la première passe (~2 min de
// gagnées) ; la relecture factuelle Opus tourne APRÈS la réponse (after())
// et remplace silencieusement le cours en base — le client re-synchronise.
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession, sessionElapsedMin } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { courseSystem, courseAuditSystem , sessionClock } from "@/lib/prompts";
import type { Concept, Course } from "@/lib/types";

// Deux passes (cours + relecture factuelle) : on prend de la marge.
export const maxDuration = 300;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const mode: "full" | "key" = body?.mode === "key" ? "key" : "full";

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);

  const existing = (lesson.course || {}) as Record<string, Course>;
  if (existing[mode]?.sections?.length) {
    return NextResponse.json({ course: existing[mode] });
  }

  const concepts = (lesson.concepts || []) as Concept[];
  const userMsg =
    `LEÇON : ${lesson.title}\nTOPIC : ${lesson.spec_topic || "—"}\n` +
    (lesson.notes ? `\nSES NOTES DE CLASSE (appuie-toi dessus, garde ses notations si elles sont bonnes) :\n${String(lesson.notes).slice(0, 8000)}` : "") +
    `\n\nÉcris le cours (${mode === "full" ? "complet" : "concepts clés"}).`;

  // L'horloge d'Emma : minutes ecoulees dans la seance de tutorat en cours.
  const elapsed = await sessionElapsedMin({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id });

  try {
    const raw = await askClaude({
      system: courseSystem(auth.firstName, auth.style, subj, mode, concepts) + sessionClock("tutoring", elapsed),
      content: userMsg,
      maxTokens: mode === "full" ? 8000 : 3500,
      // Vitesse façon Coach Emma : réflexion minimale sur la génération — la
      // qualité vient du prompt (fiche board) + de la relectrice Opus en fond.
      effort: "low",
      workflow: `course-${mode}`,
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    const course = extractJson<Course>(raw);

    // Le cours part TOUT DE SUITE — sauvegardé, l'élève commence à lire.
    await auth.sb
      .from("lessons")
      .update({ course: { ...existing, [mode]: course }, stage: lesson.stage === "captured" ? "course" : lesson.stage })
      .eq("id", id);
    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: mode === "full" ? "Cours complet" : "Concepts clés" });

    // Relecture factuelle Opus APRÈS la réponse (faits, chiffres, spec,
    // cohérence) : si elle passe, le cours réparé remplace l'original en
    // base — le client re-synchronise quelques minutes plus tard.
    after(async () => {
      try {
        const audited = extractJson<Course>(
          await askClaude({
            system: courseAuditSystem(auth.firstName, auth.style, subj),
            content: `COURS PROPOSÉ (relis, répare, rends le JSON final) :\n${JSON.stringify(course)}`,
            maxTokens: mode === "full" ? 9000 : 4500,
            effort: "medium",
            model: "claude-opus-5", // la relectrice a le calibre du jury
            workflow: `course-${mode}-audit`,
            lessonId: id,
            userId: auth.user.id,
            sb: auth.sb,
          })
        );
        if (Array.isArray(audited?.sections) && audited.sections.length === course.sections?.length) {
          await auth.sb.from("lessons").update({ course: { ...existing, [mode]: audited } }).eq("id", id);
        }
      } catch { /* on garde le cours initial */ }
    });

    return NextResponse.json({ course });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "génération impossible" }, { status: 502 });
  }
}
