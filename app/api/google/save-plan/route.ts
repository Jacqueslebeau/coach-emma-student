// Enregistre le TUTORING PLAN d'une matière dans le Google Drive de l'élève :
// Google Doc propre rangé dans « Coach Emma Student / <Subject> / ».
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { getAccessToken, ensureFolder, uploadHtmlAsDoc, driveConfigured } from "@/lib/googleDrive";
import { getSubject } from "@/lib/subjects";

export const maxDuration = 60;

function esc(s: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Plan = {
  headline?: string; gap_analysis?: string;
  weekly_rhythm?: { sessions_per_week?: number; minutes_per_session?: number; detail?: string };
  priorities?: { title?: string; why?: string; spec_area?: string }[];
  milestones?: { when?: string; goal?: string }[];
  exam_technique_focus?: string[]; first_actions?: string[];
};

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  if (!driveConfigured()) return NextResponse.json({ error: "Google Drive is not configured yet" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const subjectKey = String(body?.subject || "");
  const { data: enr } = await auth.sb
    .from("subject_enrolments")
    .select("subject, board, spec, baseline_grade, gcse_grade, target_grade, exam_date, action_plan")
    .eq("user_id", auth.user.id)
    .eq("subject", subjectKey)
    .maybeSingle();
  if (!enr?.action_plan) return NextResponse.json({ error: "no plan yet" }, { status: 404 });

  const token = await getAccessToken(auth.sb, auth.user.id);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 428 });

  const p = enr.action_plan as Plan;
  const subjLabel = getSubject(enr.subject).labelEn;
  const start = enr.gcse_grade ? `GCSE ${enr.gcse_grade}` : `level ${enr.baseline_grade || "—"}`;

  const html =
    `<h1>Tutoring Plan — ${esc(subjLabel)} (${esc(enr.board)} ${esc(enr.spec)})</h1>` +
    `<p><b>Start:</b> ${esc(start)} · <b>Target:</b> ${esc(enr.target_grade)}${enr.exam_date ? ` · <b>Exam:</b> ${esc(String(enr.exam_date).slice(0, 7))}` : ""}</p>` +
    (p.headline ? `<h2>${esc(p.headline)}</h2>` : "") +
    (p.gap_analysis ? `<p>${esc(p.gap_analysis).replace(/\n/g, "<br/>")}</p>` : "") +
    (p.weekly_rhythm ? `<h3>Rhythm</h3><p>${p.weekly_rhythm.sessions_per_week ?? 3} sessions/week · ${p.weekly_rhythm.minutes_per_session ?? 45} min${p.weekly_rhythm.detail ? `<br/>${esc(p.weekly_rhythm.detail)}` : ""}</p>` : "") +
    (p.priorities?.length ? `<h3>Priorities</h3><ol>${p.priorities.map((x) => `<li><b>${esc(x.title || "")}</b>${x.spec_area ? ` <i>(${esc(x.spec_area)})</i>` : ""}${x.why ? `<br/>${esc(x.why)}` : ""}</li>`).join("")}</ol>` : "") +
    (p.milestones?.length ? `<h3>Milestones</h3><ul>${p.milestones.map((m) => `<li><b>${esc(m.when || "")}</b> — ${esc(m.goal || "")}</li>`).join("")}</ul>` : "") +
    (p.exam_technique_focus?.length ? `<h3>Exam technique to build</h3><ul>${p.exam_technique_focus.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "") +
    (p.first_actions?.length ? `<h3>This week</h3><ul>${p.first_actions.map((a) => `<li>☐ ${esc(a)}</li>`).join("")}</ul>` : "") +
    `<p><i>Coach Emma Student — generated ${new Date().toLocaleDateString("en-GB")}</i></p>`;

  try {
    const rootId = await ensureFolder(token, "Coach Emma Student");
    const subjectFolderId = await ensureFolder(token, subjLabel, rootId);
    const name = `Tutoring Plan — ${subjLabel} (${enr.board}) — ${new Date().toLocaleDateString("en-GB")}`;
    const doc = await uploadHtmlAsDoc(token, { name, parentId: subjectFolderId, html });
    return NextResponse.json({ link: doc.link });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Drive upload failed" }, { status: 502 });
  }
}
