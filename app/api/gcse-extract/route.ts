// Lecture du relevé de résultats GCSE uploadé (OPTIONNEL) : Emma lit la photo
// et en extrait les notes par matière — y compris la nuance (marks bruts,
// haut/bas de la note) quand le relevé la montre. Le déclaratif reste le
// chemin normal ; l'upload affine le point de départ.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { askClaude, extractJson, type ContentBlock } from "@/lib/claude";

export const maxDuration = 120;

const SYSTEM = `Tu lis la photo d'un relevé de résultats GCSE (ou IGCSE) d'un élève britannique.

TÂCHE : extrais les résultats par matière, en te limitant aux matières utiles à la plateforme : Mathematics, Economics (ou Business si Economics absent — signale-le), Geography, French.

RÈGLES ABSOLUES :
- Ne lis que ce qui est ÉCRIT : n'invente ni note ni matière. Une matière absente du relevé n'apparaît pas dans ta réponse.
- "grade" : la note telle qu'écrite (9-1 pour GCSE Angleterre, lettres si IGCSE).
- "detail" : la NUANCE si le relevé la montre — marks bruts (ex. « 187/200 »), mention « high/low », UMS, distance à la note supérieure. Un 7 haut et un 7 bas ne préparent pas au même plan. Si le relevé ne montre que la note, "detail" = null.
- Si l'image n'est pas un relevé de résultats lisible, mets "readable": false avec une raison courte.

RÉPONDS UNIQUEMENT avec un objet JSON (pas de texte autour) :
{
  "readable": true,
  "results": [ { "subject": "maths|eco|geo|french", "label": "libellé exact du relevé", "grade": "7", "detail": "187/200 — haut de la note" } ]
}`;

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const image = String(body?.image || "");     // base64 sans préfixe
  const mediaType = String(body?.media_type || "image/jpeg");
  if (!image || image.length > 8_000_000) {
    return NextResponse.json({ error: "image manquante ou trop lourde" }, { status: 400 });
  }

  try {
    const content: ContentBlock[] = [
      { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
      { type: "text", text: "Voici le relevé de résultats. Extrais les notes." },
    ];
    const parsed = extractJson<{ readable: boolean; reason?: string; results?: { subject: string; label: string; grade: string; detail: string | null }[] }>(
      await askClaude({
        system: SYSTEM,
        content,
        maxTokens: 1200,
        effort: "low",
        workflow: "gcse-extract",
        userId: auth.user.id,
        sb: auth.sb,
      })
    );
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "lecture impossible" }, { status: 502 });
  }
}
