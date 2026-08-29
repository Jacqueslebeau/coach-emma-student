// COACHING D'EXAMEN — pas du contenu : le mental, la préparation, le jour J.
// Emma écoute, guide, motive, et repart toujours sur des actions concrètes.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { askClaude } from "@/lib/claude";
import { coachingSystem, sessionClock } from "@/lib/prompts";
import { touchSession, sessionElapsedMin } from "@/lib/sessionTrack";
import { estimateGrade } from "@/lib/examTechnique";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";

export const maxDuration = 60;
const DAILY_CAP = 80; // garde-fou coût : messages max / jour

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { data } = await auth.sb
    .from("coaching_messages")
    .select("role, message, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(40);
  return NextResponse.json({ messages: (data || []).reverse(), first_name: auth.firstName, style: auth.style });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const { message } = await req.json().catch(() => ({}));
  const text = String(message || "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "message vide" }, { status: 400 });

  // Plafond quotidien.
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const { count } = await auth.sb
    .from("coaching_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .gte("created_at", dayStart.toISOString());
  if ((count || 0) >= DAILY_CAP) {
    return NextResponse.json({ error: "Grosse journée de coaching ! On reprend demain 💪", capped: true }, { status: 429 });
  }

  // Contexte réel : matières inscrites, progression + points en travail (le coach cite du VRAI).
  const [{ data: enrolments }, { data: attempts }, { data: weakPoints }, { data: history }] = await Promise.all([
    auth.sb
      .from("subject_enrolments")
      .select("subject, board, target_grade")
      .eq("user_id", auth.user.id),
    auth.sb
      .from("attempts")
      .select("result, created_at")
      .eq("user_id", auth.user.id)
      .eq("kind", "exercise")
      .not("result", "is", null)
      .order("created_at", { ascending: false })
      .limit(6),
    auth.sb
      .from("weak_points")
      .select("label")
      .eq("user_id", auth.user.id)
      .eq("status", "open")
      .limit(8),
    auth.sb
      .from("coaching_messages")
      .select("role, message")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const pcts = (attempts || [])
    .map((a) => {
      const items = (a.result as { items?: { marks_awarded?: number; marks_total?: number }[] })?.items || [];
      const tot = items.reduce((s, i) => s + (i.marks_total || 0), 0);
      const got = items.reduce((s, i) => s + (i.marks_awarded || 0), 0);
      return tot > 0 ? Math.round((100 * got) / tot) : null;
    })
    .filter((p): p is number => p !== null);
  const progressSummary = pcts.length
    ? `dernières séries d'exercices (du plus récent) : ${pcts.map((p) => p + "%").join(", ")} — niveau indicatif actuel ${estimateGrade(pcts[0])}`
    : "pas encore d'exercices corrigés";
  const weakPointsSummary = (weakPoints || []).map((w) => w.label).join(" · ") || "";
  const subjectsLine = (enrolments || []).length
    ? (enrolments || [])
        .map((e) => `${SUBJECTS[e.subject as SubjectKey]?.labelFr || e.subject} (${e.board}${e.subject === "french" ? ", candidat libre" : ""})`)
        .join(", ")
    : undefined;

  const convo = (history || [])
    .reverse()
    .map((h) => (h.role === "user" ? `${auth.firstName || "ÉLÈVE"}: ` : "EMMA: ") + h.message)
    .join("\n")
    .slice(0, 6000);

  // L'horloge d'Emma : la séance de coaching vise 15 min, clôture dès 12.
  const elapsed = await sessionElapsedMin({ sb: auth.sb, userId: auth.user.id, kind: "coaching" });

  try {
    const reply = await askClaude({
      system: coachingSystem(auth.firstName, auth.style, {
        currentGrade: auth.currentGrade,
        targetGrade: auth.targetGrade,
        progressSummary,
        weakPointsSummary,
        subjectsLine,
        lang: auth.contentLang,
      }) + sessionClock("coaching", elapsed),
      content:
        (convo ? `CONVERSATION JUSQU'ICI :\n${convo}\n\n` : "") +
        `NOUVEAU MESSAGE DE ${auth.firstName || "L'ÉLÈVE"} : ${text}`,
      maxTokens: 800,
      temperature: 0.6, // coach vivant, pas mécanique
      workflow: "exam-coaching",
      userId: auth.user.id,
      sb: auth.sb,
    });

    const sessionId = await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "coaching", subject: "general", covered: "Coaching d'examen" });
    await auth.sb.from("coaching_messages").insert([
      { user_id: auth.user.id, session_id: sessionId, role: "user", message: text },
      { user_id: auth.user.id, session_id: sessionId, role: "assistant", message: reply },
    ]);

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "coaching indisponible" }, { status: 502 });
  }
}
