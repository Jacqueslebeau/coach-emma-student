import type { SupabaseClient } from "@supabase/supabase-js";

// Wrapper UNIQUE des appels Claude (leçon apprise de l'audit Emma : pas de
// fetch dupliqué, tarifs et logging centralisés). Server-only.
// Pas de service_role : le log passe par le client de session (policy RLS
// « log own runs » sur workflow_runs).
const MODEL = "claude-sonnet-5";
// Le thinking adaptatif (actif par défaut) consomme le budget max_tokens :
// on garantit un plancher pour que la réponse utile ne soit jamais tronquée.
const MIN_MAX_TOKENS = 12000;
// €/token approx (aligné sur la convention Emma : input ×2.8, output ×14 par million)
const IN_EUR = 2.8 / 1e6;
const OUT_EUR = 14 / 1e6;

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

export async function askClaude(opts: {
  system: string;
  content: string | ContentBlock[];
  maxTokens?: number;
  temperature?: number;
  workflow: string;
  lessonId?: string | null;
  userId?: string | null;
  sb?: SupabaseClient;
  model?: string; // ex. claude-opus-5 pour le jury du harnais qualité
  // Profondeur de réflexion (output_config.effort) : "low"/"medium" accélèrent
  // nettement les étapes simples sans toucher au budget de sortie ; défaut high.
  effort?: "low" | "medium" | "high";
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
      model: opts.model || MODEL,
      max_tokens: Math.max(opts.maxTokens ?? 4000, MIN_MAX_TOKENS),
      ...(opts.effort ? { output_config: { effort: opts.effort } } : {}),
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

function opts2Model(o: { model?: string }) { return o.model || MODEL; }

async function logRun(
  opts: { workflow: string; lessonId?: string | null; userId?: string | null; sb?: SupabaseClient; model?: string },
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
      model: opts2Model(opts),
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

// Les sorties structurées sont demandées en JSON ; on tolère les fences ```json,
// les backslashes LaTeX non échappés, les sauts de ligne bruts dans les chaînes
// et les sorties tronquées (max_tokens) — réparées au mieux.
export function extractJson<T>(text: string): T {
  const cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*/m, (m) => (text.includes("```") ? "" : m))
    .replace(/```[\s\S]*$/m, "")
    .trim();
  const candidate = cleaned.startsWith("{") || cleaned.startsWith("[")
    ? cleaned
    : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return JSON.parse(repairJson(candidate)) as T;
  }
}

// Réparation best-effort d'un JSON « presque valide » sorti d'un LLM.
function repairJson(s: string): string {
  let out = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!inStr) {
      if (c === '"') inStr = true;
      out += c;
    } else if (c === "\\") {
      const n = s[i + 1];
      if (n !== undefined && '"\\/bfnrtu'.includes(n)) { out += c + n; i++; }
      else out += "\\\\"; // backslash LaTeX non échappé (\frac, \( …)
    } else if (c === '"') { inStr = false; out += c; }
    else if (c === "\n") out += "\\n";      // saut de ligne brut dans une chaîne
    else if (c === "\r") { /* ignoré */ }
    else if (c === "\t") out += "\\t";
    else out += c;
  }
  if (inStr) out += '"'; // chaîne coupée par max_tokens
  // Ferme les structures restées ouvertes (troncature).
  const stack: string[] = [];
  let str = false;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (str) { if (c === "\\") i++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") stack.pop();
  }
  // Virgules traînantes ({"a":1,} / [1,2,]) — hors chaînes.
  let noTrail = "";
  let inS = false;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (inS) { noTrail += c; if (c === "\\") { noTrail += out[++i] ?? ""; } else if (c === '"') inS = false; continue; }
    if (c === '"') { inS = true; noTrail += c; continue; }
    if (c === ",") {
      let j = i + 1;
      while (j < out.length && /\s/.test(out[j])) j++;
      if (out[j] === "}" || out[j] === "]") continue; // virgule traînante : sautée
    }
    noTrail += c;
  }
  let closed = noTrail.replace(/,\s*$/, "");
  while (stack.length) closed += stack.pop() === "{" ? "}" : "]";
  return closed;
}
