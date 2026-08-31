// LA VOIX D'EMMA — ElevenLabs (la voix UK approuvée de la démo). Reçoit un
// script DÉJÀ ORAL (pas de markdown/LaTeX) et rend l'audio MP3 en flux.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { askClaude } from "@/lib/claude";

export const maxDuration = 60;

const VOICE_ID = "6MCJQJe3NCkhDRHZaJ31"; // Emma UK — approuvée (« j'adore cette voix »)

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "voice not configured" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  let text = String(body?.text || "").trim().slice(0, 4800);
  if (!text) return NextResponse.json({ error: "texte vide" }, { status: 400 });

  // raw=true : le texte contient du markdown/LaTeX (ex. une question de maths) —
  // Emma le transforme d'abord en script oral naturel (formules dites en mots).
  if (body?.raw === true) {
    try {
      text = (
        await askClaude({
          system:
            "Turn the text below into a natural SPOKEN script for a UK tutor's voice, in the same language as the text. Say every formula and symbol in words (\"x squared\", \"pi over three\"). Keep ALL the content, add nothing. No markdown. Unhurried pace: short sentences, and insert <break time=\"0.5s\" /> between distinct ideas (sparingly, 1 per 2-3 sentences). Output only the script.",
          content: text,
          maxTokens: 800,
          effort: "low",
          workflow: "tts-spoken-script",
          userId: auth.user.id,
          sb: auth.sb,
        })
      ).trim().slice(0, 4800);
    } catch { /* on lit le texte brut en dernier recours */ }
  }

  // eleven_turbo_v2_5 : ~2-3× plus rapide que multilingual_v2 pour la même
  // voix (même voice ID) ; débit 22050/64 = fichier ~2× plus léger à
  // télécharger. Qualité vocale très proche — réversible si besoin.
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        // speed 0.9 : débit posé, agréable pour suivre un cours (vérifié 200
        // sur l'API avant déploiement — plage acceptée 0.7-1.2).
        voice_settings: { stability: 0.7, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true, speed: 0.9 },
      }),
    }
  );
  if (!r.ok || !r.body) {
    const err = await r.text().catch(() => "");
    return NextResponse.json({ error: `voice error ${r.status} ${err.slice(0, 120)}` }, { status: 502 });
  }
  return new NextResponse(r.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
  });
}
