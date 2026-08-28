import type { SupabaseClient } from "@supabase/supabase-js";

// Wrapper UNIQUE des appels Claude (leçon apprise de l'audit Emma : pas de
// fetch dupliqué, tarifs et logging centralisés). Server-only.
// Pas de service_role : le log passe par le client de session (policy RLS
// « log own runs » sur workflow_runs).
const MODEL = "claude-sonnet-5";
// €/token approx (aligné sur la convention Emma : input ×2.8, output ×14 par million)
const IN_EUR = 2.8 / 1e6;
const OUT_EUR = 14 / 1e6;

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

export async function askClaude(opts: {
  system: string;
  content: string | ContentBlock[];
  maxTokens?: number;
  temperature?: number;
  workflow: string;
  lessonId?: string | null;
  userId?: string | null;
  sb?: SupabaseClient;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante");

  const messages = [
    {
      role: "user",
      content: typeof opts.content === "string" ? opts.content : opts.content,
    },
  ];

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    // NB : `temperature` n'est plus accepté par claude-sonnet-5 (HTTP 400
    // "temperature is deprecated for this model") — l'option est ignorée.
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 4000,
      system: opts.system,
      messages,
    }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    await logRun(opts, null, "error", `HTTP ${r.status} ${errText.slice(0, 300)}`);
    throw new Error(`Claude HTTP ${r.status}`);
  }
  const d = await r.json();
  const text: string = d?.content?.find((b: { type: string }) => b.type === "text")?.text || "";
  await logRun(opts, d?.usage || null, "success", null);
  return text;
}

async function logRun(
  opts: { workflow: string; lessonId?: string | null; userId?: string | null; sb?: SupabaseClient },
  usage: { input_tokens?: number; output_tokens?: number } | null,
  status: string,
  error: string | null
) {
  if (!opts.sb) return;
  try {
    await opts.sb.from("workflow_runs").insert({
      workflow_name: opts.workflow,
      lesson_id: opts.lessonId ?? null,
      user_id: opts.userId ?? null,
      model: MODEL,
      input_tokens: usage?.input_tokens ?? null,
      output_tokens: usage?.output_tokens ?? null,
      cost_eur: usage ? (usage.input_tokens || 0) * IN_EUR + (usage.output_tokens || 0) * OUT_EUR : null,
      status,
      error,
    });
  } catch {
    // best-effort : le logging ne doit jamais casser la boucle d'apprentissage
  }
}

// Les sorties structurées sont demandées en JSON ; on tolère les fences ```json.
export function extractJson<T>(text: string): T {
  const cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*/m, (m) => (text.includes("```") ? "" : m))
    .replace(/```[\s\S]*$/m, "")
    .trim();
  const candidate = cleaned.startsWith("{") || cleaned.startsWith("[")
    ? cleaned
    : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(candidate) as T;
}
