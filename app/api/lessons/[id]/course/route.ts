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
    const sys = courseSystem(auth.firstName, auth.style, subj, mode, concepts) + sessionClock("tutoring", elapsed);
    const common = { content: userMsg, effort: "low" as const, lessonId: id, userId: auth.user.id, sb: auth.sb };

    let course: Course;
    if (mode === "full" && concepts.length > 1) {
      // FULL LESSON EN PARALLÈLE : une requête par section + une pour le
      // cadre (intro/recap) → le temps total = la section la plus longue
      // (~30 s) au lieu de la somme. La relectrice Opus (en fond) garantit
      // la cohérence inter-sections — c'est sa checklist. En cas de pépin
      // sur une section, on retombe sur la génération monobloc.
      const secP = concepts.map((c) =>
        askClaude({
          ...common,
          system: sys +
            `\n\nMODE PARALLÈLE : écris UNIQUEMENT la section du concept « ${c.key} » (${c.label}). Les autres concepts (${concepts.filter((x) => x.key !== c.key).map((x) => x.label).join(", ")}) ont leur propre section écrite séparément — ne les développe pas (une référence d'une phrase au plus). RÉPONDS UNIQUEMENT avec ce JSON : {"concept_key":"${c.key}","title":"…","body":"markdown + LaTeX selon MISE EN PAGE"}`,
          maxTokens: 2200,
          workflow: "course-full-section",
        }).then((r) => extractJson<{ concept_key: string; title: string; body: string }>(r))
      );
      const frameP = askClaude({
        ...common,
        system: sys +
          `\n\nMODE PARALLÈLE : écris UNIQUEMENT l'intro (l'accroche : ce qu'on va maîtriser, où ça rapporte des marks) et le recap minute (réflexes à retenir, en bullets) — les sections sont écrites séparément. RÉPONDS UNIQUEMENT avec : {"intro":"…","recap":"…"}`,
        maxTokens: 900,
        workflow: "course-full-frame",
      }).then((r) => extractJson<{ intro: string; recap: string }>(r));

      try {
        const [frame, ...secs] = await Promise.all([frameP, ...secP]);
        const ordered = concepts.map((c) => secs.find((s) => s?.concept_key === c.key));
        if (ordered.some((s) => !s?.body)) throw new Error("section manquante");
        course = {
          mode: "full",
          intro: frame.intro || "",
          recap: frame.recap || "",
          sections: ordered.map((s) => ({ concept_key: s!.concept_key, title: s!.title, body: s!.body })),
        } as Course;
      } catch {
        // Repli monobloc (rare) — plus lent mais toujours juste.
        course = extractJson<Course>(
          await askClaude({ ...common, system: sys, maxTokens: 8000, workflow: "course-full" })
        );
      }
    } else {
      course = extractJson<Course>(
        await askClaude({
          ...common,
          system: sys,
          maxTokens: mode === "full" ? 8000 : 3500,
          workflow: `course-${mode}`,
        })
      );
    }

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
