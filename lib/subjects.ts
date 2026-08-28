// Les matières de Coach Emma Student — chaque matière porte son exam board,
// son spec, la langue de l'examen et SA technique d'examen (le cœur du produit).
import { EXAM_TECHNIQUE_MATHS } from "@/lib/examTechnique";

export type SubjectKey = "maths" | "eco" | "geo" | "french";

export type Subject = {
  key: SubjectKey;
  labelFr: string;
  labelEn: string;
  board: string;
  spec: string;           // code du spec officiel
  examLang: "en" | "fr";  // langue des copies le jour J
  kind: "calculation" | "essay" | "language";
  technique: string;      // bloc technique d'examen injecté dans les prompts
};

const TECHNIQUE_ECO = `
=== TECHNIQUE D'EXAMEN — EDEXCEL A LEVEL ECONOMICS A (9EC0) ===

STRUCTURE : 3 papers de 2h (Markets & business behaviour / The national & global economy / Microeconomics & macroeconomics). Questions de 5 à 25 marks.

LES ASSESSMENT OBJECTIVES (c'est LA grille de l'examinateur) :
- AO1 Knowledge : définitions précises, théorie exacte.
- AO2 Application : TOUJOURS ancré dans le contexte de l'extrait ou d'un exemple réel — une réponse générique plafonne.
- AO3 Analysis : chaînes de raisonnement ("this leads to… which causes… therefore…"), diagrammes corrects et EXPLOITÉS (pas décoratifs).
- AO4 Evaluation : les gros marks des 25-markers — "it depends on…", magnitude, court vs long terme, hypothèses du modèle, contre-argument pesé, jugement final justifié.

STRUCTURE GAGNANTE D'UN 25-MARKER : KAA + E par paragraphe (Knowledge → Application → Analysis, puis Evaluation), 2 gros arguments développés + évaluations > 4 arguments superficiels ; conclusion qui TRANCHE avec un critère.

COMMAND WORDS : "Define" (précis, 2 marks), "Calculate" (formule + unités), "Explain" (chaîne causale), "Examine" (analyse + un peu d'évaluation), "Discuss" / "Evaluate" / "To what extent" (évaluation substantielle obligatoire), "Assess" (jugement pesé).

CE QUI COÛTE L'A* : diagramme absent ou non commenté, évaluation plaquée en fin de copie ("however it depends" sans développement), pas d'application au contexte, définitions floues, conclusion qui ne tranche pas, gestion du temps (25-marker ≈ 30 min).
`;

const TECHNIQUE_GEO = `
=== TECHNIQUE D'EXAMEN — OCR A LEVEL GEOGRAPHY (H481) ===

STRUCTURE : Physical systems / Human interactions / Geographical debates + investigation indépendante. Questions courtes → essais de 16 et 33 marks.

ASSESSMENT OBJECTIVES :
- AO1 Knowledge : lieux, processus, concepts, théories — PRÉCIS (chiffres, dates, noms).
- AO2 Application : appliquer au cas / à la question EXACTE posée.
- AO3 Skills : données, cartes, statistiques exploitées.

COMMAND WORDS OCR (chacun est un contrat) : "Describe" (quoi, pas pourquoi), "Explain" (pourquoi, chaînes causales), "Examine" (décortiquer les relations), "Analyse" (composants + liens), "Assess" (peser importance/succès + jugement), "Evaluate" (forces/faiblesses + verdict), "To what extent" (position défendue, nuancée), "Discuss" (les deux côtés).

STRUCTURE D'ESSAI GAGNANTE : plan en 30 secondes ; paragraphes PEEL (Point, Evidence — case study précise avec CHIFFRES, Explain, Link à la question) ; évaluation FILÉE dans les paragraphes, pas plaquée à la fin ; conclusion qui répond littéralement à la question posée.

CE QUI COÛTE L'A* : case studies vagues (sans données chiffrées), réciter la case study au lieu de répondre À LA question, ignorer le command word ("assess" traité comme "describe"), pas de contre-perspective, synopticité absente (liens entre thèmes), gestion du temps sur le 33-marker.
`;

const TECHNIQUE_FRENCH = `
=== TECHNIQUE D'EXAMEN — AQA A LEVEL FRENCH (7652) — élève francophone en candidat libre ===

ATTENTION AU PIÈGE : être francophone natif ne garantit PAS l'A* — l'examen note une MÉTHODE, pas la fluency. Les natifs perdent des marks sur la technique, le registre et les exercices formatés.

STRUCTURE : Paper 1 Listening/Reading/Writing (dont TRADUCTIONS FR↔EN), Paper 2 Writing (2 essais sur œuvre littéraire et/ou film étudiés), Paper 3 Speaking (stimulus card + Independent Research Project).

CE QUE NOTE L'EXAMINATEUR :
- AO3 Langue : précision grammaticale (même un natif fait des fautes d'accord à l'écrit rapide), variété des structures (subjonctif, passif, connecteurs soutenus), registre SOUTENU.
- AO4 Connaissance critique : les essais notent l'ANALYSE de l'œuvre/du film (thèmes, techniques, contexte social) — structure dissertation : problématique, arguments avec CITATIONS/scènes précises, conclusion.
- Traduction : fidélité EXACTE au sens, pas de paraphrase élégante — chaque segment est un point.
- Résumé : nombre de mots STRICT, reformulation (pas de copier-coller), les points du texte source.

CE QUI COÛTE L'A* AU CANDIDAT LIBRE : essais hors méthode (brillants mais non structurés AQA), traductions paraphrasées, dépassement des limites de mots, œuvre/film mal choisis ou connus superficiellement (citations approximatives), speaking : ne pas défendre l'IRP avec des sources.

SPÉCIFICITÉ : les consignes et essais sont EN FRANÇAIS ; les traductions travaillent les DEUX sens. Le tuteur explique la MÉTHODE en français et entraîne au format exact des papers.
`;

export const SUBJECTS: Record<SubjectKey, Subject> = {
  maths: {
    key: "maths", labelFr: "Mathématiques", labelEn: "Mathematics",
    board: "Edexcel", spec: "9MA0", examLang: "en", kind: "calculation",
    technique: EXAM_TECHNIQUE_MATHS,
  },
  eco: {
    key: "eco", labelFr: "Économie", labelEn: "Economics",
    board: "Edexcel", spec: "9EC0", examLang: "en", kind: "essay",
    technique: TECHNIQUE_ECO,
  },
  geo: {
    key: "geo", labelFr: "Géographie", labelEn: "Geography",
    board: "OCR", spec: "H481", examLang: "en", kind: "essay",
    technique: TECHNIQUE_GEO,
  },
  french: {
    key: "french", labelFr: "Français (candidat libre)", labelEn: "French (private candidate)",
    board: "AQA", spec: "7652", examLang: "fr", kind: "language",
    technique: TECHNIQUE_FRENCH,
  },
};

export function getSubject(key: string): Subject {
  return SUBJECTS[(key as SubjectKey)] || SUBJECTS.maths;
}

// Description courte de la matière pour les prompts.
export function subjectLine(s: Subject): string {
  const langNote = s.examLang === "fr"
    ? "L'examen se passe EN FRANÇAIS (consignes, essais) avec traductions FR↔EN."
    : "L'examen se passe EN ANGLAIS : énoncés, command words et termes techniques restent en anglais tel que le jour J.";
  return `${s.labelFr} — ${s.board} A Level (${s.spec}). ${langNote}`;
}
