// LE CŒUR DU PRODUIT : la technique d'examen. On ne vend pas du contenu,
// on vend des A* — donc chaque exercice, chaque correction, chaque question
// est ancré sur ce que l'examinateur attend réellement.
// Cœur maths valable pour tous les boards (Edexcel/AQA/OCR notent tous en
// M/A/B/ft) ; la structure des papers de chaque board vit dans lib/subjects.ts.

export const EXAM_TECHNIQUE_MATHS = `
=== TECHNIQUE D'EXAMEN — A LEVEL MATHEMATICS (cœur, tous boards) ===

RYTHME : ~1 mark ≈ 1 minute. Un exercice de 5 marks doit être faisable en ~5-6 min.

TYPES DE MARKS (c'est COMME ÇA qu'on note, et comme ça que TU notes) :
- M (method) : la méthode est engagée correctement — se gagne MÊME si le calcul final est faux.
- A (accuracy) : le résultat exact — ne se gagne QUE si le M correspondant est gagné.
- B (independent) : un fait/résultat indépendant correct.
- ft (follow-through) : erreur antérieure reportée proprement → marks suivants préservés.
- cao/cso : correct answer only / correct solution only — aucune tolérance.

COMMAND WORDS (chaque verbe de consigne = un contrat précis avec l'examinateur) :
- "Find" / "Calculate" : résultat + méthode visible. Réponse seule = perte des M marks si la question vaut >2 marks.
- "Show that…" : le résultat est DONNÉ → 100% des marks sont dans le cheminement. CHAQUE étape écrite, aucun saut, pas de raisonnement à rebours depuis le résultat, conclusion explicite.
- "Prove" : rigueur logique complète + phrase de conclusion (ex. "hence true for all n").
- "Hence" : tu DOIS utiliser le résultat précédent — une autre méthode = 0.
- "Hence or otherwise" : le résultat précédent est le chemin rapide ; autre méthode acceptée.
- "Write down" : réponse directe attendue, pas de travail nécessaire (1 mark, ne pas perdre de temps).
- "Sketch" : allure correcte + points clés ÉTIQUETÉS (intersections axes, asymptotes, points stationnaires). Pas un tracé précis.
- "Solve" : TOUTES les solutions dans le domaine demandé (les oublis en trig coûtent des A marks).
- "Exact value" : surds, π, e, ln — AUCUN décimal.
- "Given that" : information à UTILISER — si tu ne t'en sers pas, tu as raté le chemin prévu.
- "Verify" : substitution suffit (pas besoin de résoudre).
- "In the context of the model" (stats/mécanique) : réponse EN CONTEXTE avec les mots de l'énoncé, pas abstraite.

LES HABITUDES QUI COÛTENT L'A* (à traquer et corriger systématiquement) :
1. Arrondir trop tôt en cours de calcul (on garde exact/pleine précision, on arrondit À LA FIN — 3 s.f. par défaut, angles 1 d.p.).
2. Réponse calculatrice sans méthode écrite → M marks perdus.
3. "Show that" traité comme "Find" : étapes sautées parce que « c'est évident ».
4. Solutions manquantes en trigonométrie (oubli du cadran / de la période).
5. Constante d'intégration oubliée (+C).
6. Unités manquantes, ou réponse hors contexte en stats/mécanique.
7. Pas de phrase de conclusion dans les preuves.
8. "Hence" ignoré → méthode alternative non créditée.
9. Mauvaise gestion du temps : s'acharner 15 min sur 3 marks au lieu d'avancer.

ÉCHELLE DES TYPES DE QUESTIONS (pour graduer les exercices) :
- fluency (1-3 marks) : application directe d'une technique.
- standard (4-5 marks) : technique + une étape de mise en place.
- multi-step (6-9 marks) : plusieurs concepts enchaînés, style fin de paper — LE terrain où se joue l'A*.
- show-that / proof : cheminement noté, pas le résultat.
- modelling : situation concrète, hypothèses, critique du modèle (stats/mécanique).

RÈGLE D'OR : viser un A* = viser ~90% des marks. Ça se gagne sur les method marks
sécurisés partout, les réponses exactes quand demandées, et les questions multi-step
finies — pas sur des éclairs de génie.

NOTATION UK : écris « cosec » (jamais « csc ») — c'est la notation des papers et
du formulaire. HORS SPEC (single maths, tous boards) : le calculus des fonctions
trigonométriques réciproques (dérivée/intégrale d'arcsin, arctan…) relève de
Further Mathematics — ne le présente JAMAIS comme exigible au A level Maths.
`;

// Niveaux A Level (auto-déclaration + estimation) — ordre croissant.
export const GRADES = ["E", "D", "C", "B", "A", "A*"] as const;
export type Grade = (typeof GRADES)[number];

// Estimation indicative du grade à partir du % de marks sur les exercices
// récents (bandes indicatives Edexcel — les vraies boundaries varient chaque année).
export function estimateGrade(pct: number): Grade {
  if (pct >= 85) return "A*";
  if (pct >= 72) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "E";
}
