// HARNAIS QUALITÉ — la mesure de ce qu'on vend.
// Des agents « élèves » de niveau 5 à 9 suivent de vraies séances (cours →
// vérification → correction + un échange de coaching) dans chaque matière ;
// un jury d'agents « meilleurs professeurs et examinateurs au monde » note la
// qualité du tutoring reçu sur des indicateurs précis. Résultat : une note
// détaillée par matière × niveau × topic + les améliorations à faire.
import type { SubjectKey } from "@/lib/subjects";

export const EVAL_LEVELS = ["5", "6", "7", "8", "9"] as const;
export type EvalLevel = (typeof EVAL_LEVELS)[number];

// Profil réaliste de l'élève simulé à chaque niveau (base GCSE 9-1, transposée
// au travail A Level : 5 = moyen-fragile … 9 = excellent).
const LEVEL_PROFILES: Record<EvalLevel, string> = {
  "5": "Élève de niveau 5 : bases présentes mais fragiles. Comprend les idées simples, se perd dès qu'il y a deux étapes. Fait des erreurs de fond typiques (confusions de concepts, méthode incomplète), vocabulaire technique approximatif, se décourage vite.",
  "6": "Élève de niveau 6 : correct sur les questions standard, mais irrégulier. Erreurs d'étourderie fréquentes, méthode partiellement montrée, difficultés sur les questions multi-étapes.",
  "7": "Élève de niveau 7 : bon élève. Réussit la plupart des questions, mais perd des marks sur la technique d'examen (étapes sautées, forme non respectée, conclusion oubliée) et bute sur les questions discriminantes.",
  "8": "Élève de niveau 8 : très bon. Contenu quasi maîtrisé ; ses pertes de marks viennent presque uniquement de la précision fine et des questions les plus difficiles. A besoin d'être poussé, pas ré-expliqué.",
  "9": "Élève de niveau 9 : excellent. Répond juste presque partout, cherche l'exhaustivité et la nuance. Le tuteur doit l'étirer vers le niveau A* (rigueur totale, questions les plus dures) sans lui faire perdre son temps.",
};

// 3 topics de référence par matière (les « cours » que suivent les agents).
export const EVAL_TOPICS: Record<SubjectKey, string[]> = {
  maths: ["Differentiation — chain rule", "Trigonometric identities and equations", "Integration by parts"],
  eco: ["Price elasticity of demand", "Market failure and externalities", "Monetary policy and inflation"],
  geo: ["Carbon cycle — human impacts", "Coastal landscapes — erosion processes", "Global migration — patterns and impacts"],
  french: ["Paper 2 — étude d'une œuvre : No et moi (Delphine de Vigan)", "Traduction FR↔EN — méthode et pièges", "Paper 1 — résumé et compréhension écrite"],
};

// Messages de coaching typiques par niveau (l'élève simulé ouvre la séance).
const COACHING_OPENERS: Record<EvalLevel, string> = {
  "5": "Franchement je sais pas si ça sert à quelque chose, je rate tout en ce moment et l'examen approche. J'ai envie de laisser tomber cette matière.",
  "6": "J'ai eu une mauvaise note à mon dernier test alors que j'avais révisé. Je stresse pour les mocks, je sais pas comment m'organiser.",
  "7": "Je bosse beaucoup mais je plafonne. Le jour du test je panique sur les grosses questions et je perds tout mon temps dessus.",
  "8": "Je vise A* mais je perds toujours 2-3 marks bêtement. Comment je m'entraîne pour être vraiment sûr le jour J ?",
  "9": "Je suis en avance sur le programme. J'ai peur de m'ennuyer et de me relâcher avant l'examen — comment je garde le rythme ?",
};

export function coachingOpener(level: EvalLevel): string {
  return COACHING_OPENERS[level];
}

// ---------------------------------------------------------------------------
// Agent ÉLÈVE : répond au quiz comme un vrai élève de ce niveau.
// ---------------------------------------------------------------------------
export function studentAgentSystem(level: EvalLevel, subjectLabel: string) {
  return `Tu es un AGENT DE TEST qui simule, de façon réaliste, un élève de sixth form en ${subjectLabel}.

PROFIL À INCARNER : ${LEVEL_PROFILES[level]}

TÂCHE : réponds aux questions comme CET élève répondrait — ni mieux, ni pire.
- Reproduis les erreurs TYPIQUES de ce niveau (pas des erreurs absurdes) : méprises classiques, étapes sautées, imprécisions, réponses partielles.
- Le niveau ${level} détermine la proportion de réponses justes/partielles/fausses. Niveau 5 ≈ 1-2 justes sur 5 ; niveau 7 ≈ 3-4 justes avec des pertes de technique ; niveau 9 ≈ quasi tout juste avec de petites imperfections.
- Écris comme un élève écrit (concis, parfois brouillon), pas comme un manuel.
- Réponds dans la LANGUE DES QUESTIONS : en anglais pour les matières examinées en anglais (c'est un A Level), en français pour le français.

RÉPONDS UNIQUEMENT en JSON : { "answers": [ { "id": "q1", "answer": "..." } ] }`;
}

// ---------------------------------------------------------------------------
// Jury : les meilleurs professeurs et examinateurs au monde de la matière.
// ---------------------------------------------------------------------------
export const JUDGE_INDICATORS = [
  ["accuracy", "Justesse du contenu : zéro erreur factuelle/mathématique dans le cours, les questions, les corrigés."],
  ["spec_alignment", "Alignement sur le spec du board : contenu exigible, références correctes, rien de hors programme présenté comme exigible."],
  ["exam_technique", "Technique d'examen : command words réels, attentes du mark scheme explicites, notation crédible mark par mark, habitudes coûteuses signalées."],
  ["pedagogy", "Pédagogie : clarté, progression logique, exemples travaillés, ré-explications sous un angle différent."],
  ["level_fit", "Adaptation au niveau de l'élève : ni trop dur ni condescendant, remédiation ciblée là où il échoue, étirement vers le haut s'il excelle."],
  ["feedback_quality", "Qualité du feedback : méprises NOMMÉES précisément, verdicts par concept justes vu les réponses, corrigés modèles impeccables."],
  ["motivation_tone", "Ton & motivation : chaleureux, exigeant, jamais humiliant ; l'élève a envie de continuer."],
  ["coaching_quality", "Coaching d'examen : écoute réelle, validation de l'émotion, conseils concrets et actionnables, garde-fous respectés (aucun propos déplacé, orientation adulte si mal-être)."],
] as const;

export function judgeSystem(subjectLabel: string, board: string, level: EvalLevel) {
  return `Tu es un JURY composé des meilleurs professeurs, tuteurs et examinateurs seniors AU MONDE en ${subjectLabel} (${board}), réunis pour auditer la qualité d'un tuteur IA nommé Emma Student.

Tu vas recevoir le dossier COMPLET d'une séance donnée à un élève simulé de niveau ${level} : le cours produit, les questions posées, les réponses de l'élève, la correction/diagnostic d'Emma, et un échange de coaching.

TA MISSION : juger la QUALITÉ DU TUTORING REÇU — sévèrement, honnêtement, comme si ta réputation d'examinateur en dépendait. Tu VÉRIFIES toi-même chaque affirmation (refais les calculs, contrôle les faits, la conformité au spec, la crédibilité de la notation). Une seule erreur factuelle non détectée par Emma est grave.

BARÈME — note chaque indicateur de 0 à 10 (10 = irréprochable au standard des meilleurs tuteurs humains ; 5 = passable ; <4 = inacceptable pour un produit payant) :
${JUDGE_INDICATORS.map(([k, d]) => `- "${k}" : ${d}`).join("\n")}

RÈGLES :
- Chaque note s'accompagne d'une justification d'une phrase CITANT un élément précis du dossier.
- "errors_found" : liste TOUTE erreur factuelle, mathématique ou de notation commise par Emma (vide si aucune).
- "improvements" : les 3 à 5 améliorations LES PLUS IMPORTANTES, concrètes et actionnables, par ordre d'impact.
- "overall" : moyenne pondérée honnête (accuracy et feedback_quality pèsent double) — pas de complaisance : NE tasse PAS tout entre 7 et 8.
- "verdict" : une phrase franche de jury ("prêt à vendre", "bon mais à corriger avant vente", "pas au niveau").

RÉPONDS UNIQUEMENT en JSON :
{
  "scores": { ${JUDGE_INDICATORS.map(([k]) => `"${k}": {"score": 0, "why": "..."}`).join(", ")} },
  "errors_found": ["..."],
  "improvements": ["..."],
  "overall": 0.0,
  "verdict": "..."
}`;
}
