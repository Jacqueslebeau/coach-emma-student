// HARNAIS QUALITÉ — exécute UNE cellule d'évaluation (matière × niveau × topic) :
// séance complète donnée à un agent élève simulé, puis audit par le jury des
// meilleurs profs du monde. Réservé à l'admin. POST = lancer ; GET = résultats.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { askClaude, extractJson } from "@/lib/claude";
import { getSubjectBoard, type SubjectKey } from "@/lib/subjects";
import {
  conceptExtractionSystem, courseSystem, quizSystem, gradeSystem, coachingSystem, formatAnswers,
} from "@/lib/prompts";
import {
  studentAgentSystem, judgeSystem, coachingOpener, EVAL_TOPICS, type EvalLevel,
} from "@/lib/evalHarness";
import type { Concept, Course, QuizQuestion, QuizGrade } from "@/lib/types";

export const maxDuration = 300;
const ADMIN_EMAILS = new Set(["jacques@mindsearch.net"]);

export async function GET() {
  const auth = await requireUser();
  if (!auth || !ADMIN_EMAILS.has(auth.user.email || "")) {
    return NextResponse.json({ error: "réservé à l'admin" }, { status: 403 });
  }
  const { data } = await auth.sb
    .from("eval_runs")
    .select("id, subject, level, topic, scores, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ runs: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth || !ADMIN_EMAILS.has(auth.user.email || "")) {
    return NextResponse.json({ error: "réservé à l'admin" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  // La cellule est calibrée sur LE board demandé (grille tous boards).
  const subject = getSubjectBoard(String(body?.subject || "maths"), String(body?.board || "") || null);
  const level = String(body?.level || "B") as EvalLevel;
  const topic = String(body?.topic || EVAL_TOPICS[subject.key as SubjectKey][0]).slice(0, 200);
  const call = (opts: Parameters<typeof askClaude>[0]) =>
    askClaude({ ...opts, userId: auth.user.id, sb: auth.sb });

  try {
    // 1 · Capture : le topic devient une leçon découpée en concepts.
    const extraction = extractJson<{ lesson_title: string; spec_topic: string; concepts: Concept[] }>(
      await call({
        system: conceptExtractionSystem("Alex", "sympa", subject),
        content: `CE QUE L'ÉLÈVE DONNE SUR SA LEÇON DU JOUR :\nTITRE DE LA LEÇON : ${topic}\n\nIdentifie la leçon dans le programme et découpe-la en concepts.`,
        maxTokens: 2000, effort: "low", workflow: "eval-extract",
      })
    );
    const concepts = extraction.concepts.slice(0, 5);

    // 2 · Le cours (concepts clés — ce que l'élève lit).
    const course = extractJson<Course>(
      await call({
        system: courseSystem("Alex", "sympa", subject, "key", concepts),
        content: `LEÇON : ${extraction.lesson_title}\nTOPIC : ${extraction.spec_topic}\n\nÉcris le cours (concepts clés).`,
        maxTokens: 3500, effort: "medium", workflow: "eval-course",
      })
    );

    // 3 · La vérification de maîtrise.
    const quiz = extractJson<{ questions: QuizQuestion[] }>(
      await call({
        system: quizSystem("Alex", "sympa", subject, concepts),
        content: `LEÇON : ${extraction.lesson_title}\nTOPIC : ${extraction.spec_topic}\n\nÉcris les 5 questions de vérification.`,
        maxTokens: 2500, temperature: 0.4, effort: "medium", workflow: "eval-quiz",
      })
    );

    // 4 · L'agent ÉLÈVE (niveau simulé) répond.
    const studentAnswers = extractJson<{ answers: { id: string; answer: string }[] }>(
      await call({
        system: studentAgentSystem(level, subject.labelFr),
        content:
          `LE COURS QUE TU VIENS DE LIRE (concepts clés) :\n${JSON.stringify(course).slice(0, 4000)}\n\n` +
          `QUESTIONS :\n${quiz.questions.map((q) => `${q.id} [${q.concept_key}] : ${q.question}`).join("\n")}`,
        maxTokens: 1500, temperature: 0.6, effort: "low", workflow: "eval-student",
      })
    );

    // 5 · Emma corrige et diagnostique.
    const grade = extractJson<QuizGrade>(
      await call({
        system: gradeSystem("Alex", "sympa", subject, concepts),
        content:
          `LEÇON : ${extraction.lesson_title}\n\n` +
          formatAnswers(quiz.questions, studentAnswers.answers) +
          `\n\nCorrige, diagnostique par concept, nomme les méprises.`,
        maxTokens: 16000, workflow: "eval-grade",
      })
    );

    // 6 · Une séance de coaching (l'élève ouvre selon son niveau, Emma répond).
    const opener = coachingOpener(level);
    const coachingReply = await call({
      system: coachingSystem("Alex", "sympa", {
        currentGrade: level,
        targetGrade: "A*",
        progressSummary: `a ${subject.labelEn} session just finished`,
        subjectsLine: `${subject.labelEn} (${subject.board})`,
      }),
      content: `NEW MESSAGE FROM ALEX: ${opener}`,
      maxTokens: 700, temperature: 0.6, effort: "medium", workflow: "eval-coaching",
    });

    // 7 · Le JURY audite tout le dossier.
    const judged = extractJson<Record<string, unknown>>(
      await call({
        system: judgeSystem(subject.labelFr, `${subject.board} ${subject.spec}`, level),
        model: "claude-opus-5", // le juge doit être plus fort que le tuteur qu'il audite
        content:
          `DOSSIER DE LA SÉANCE (élève simulé niveau ${level}, topic « ${topic} ») :\n\n` +
          `1. COURS PRODUIT PAR EMMA :\n${JSON.stringify(course).slice(0, 9000)}\n\n` +
          `2. QUESTIONS DE VÉRIFICATION (avec barèmes) :\n${quiz.questions.map((q) => `${q.id} [${q.marks ?? "?"} marks — ${q.tariff || ""}]: ${q.question}`).join("\n")}\n\n` +
          `3. RÉPONSES DE L'ÉLÈVE (niveau ${level}) :\n${studentAnswers.answers.map((a) => `${a.id}: ${a.answer}`).join("\n")}\n\n` +
          `4. CORRECTION & DIAGNOSTIC D'EMMA (intégral) :\n${JSON.stringify(grade).slice(0, 16000)}\n\n` +
          `5. COACHING — message de l'élève : « ${opener} »\nRÉPONSE D'EMMA : ${coachingReply.slice(0, 2500)}\n\n` +
          `Rends ton audit.`,
        maxTokens: 3000, workflow: "eval-judge",
      })
    );

    const { data: saved } = await auth.sb
      .from("eval_runs")
      .insert({
        user_id: auth.user.id,
        subject: subject.key,
        board: subject.board,
        level,
        topic,
        scores: judged,
        artifacts: {
          lesson_title: extraction.lesson_title,
          concepts: concepts.map((c) => c.label),
          questions: quiz.questions,
          student_answers: studentAnswers.answers,
          grade,
          coaching: { opener, reply: coachingReply },
        },
      })
      .select("id")
      .single();

    return NextResponse.json({ id: saved?.id, subject: subject.key, board: subject.board, level, topic, scores: judged });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "éval impossible" }, { status: 502 });
  }
}
