// Logique des notes — le contrat produit : on vend une PROGRESSION réaliste.
// Point de départ = la note GCSE (9-1) obtenue dans la matière ; l'objectif
// A Level est borné par le bas (jamais en dessous du niveau projeté, jamais
// sous B — on vend des A*, pas de la gestion de l'échec) ; le plan d'action
// croise ensuite écart × temps restant, franchement.

export const ALEVEL_GRADES = ["E", "D", "C", "B", "A", "A*"] as const;
export type ALevelGrade = (typeof ALEVEL_GRADES)[number];

// GCSE Angleterre : 9-1 (9 = top). On accepte aussi les lettres historiques
// (iGCSE / anciens systèmes) en les rabattant sur l'échelle 9-1.
export const GCSE_GRADES = ["9", "8", "7", "6", "5", "4", "3", "2", "1"] as const;

// Projection GCSE → point de départ A Level (calibrage type value-added UK :
// un 9 démarre en A, un 8 en B, un 7 en C… — c'est un POINT DE DÉPART, pas
// un plafond).
export function gcseToStart(gcse: string): ALevelGrade {
  const map: Record<string, ALevelGrade> = {
    "9": "A", "8": "B", "7": "C", "6": "C", "5": "D", "4": "E", "3": "E", "2": "E", "1": "E",
    "A*": "A", "A": "B", "B": "C", "C": "D",
  };
  return map[gcse.trim().toUpperCase()] || map[gcse.trim()] || "C";
}

// Les objectifs proposables : jamais en dessous du niveau actuel projeté,
// jamais en dessous de B (si tu vaux déjà B → B/A/A* ; A → A/A* ; A* → A*).
export function allowedTargets(currentGrade?: string | null): ALevelGrade[] {
  const idx = Math.max(
    ALEVEL_GRADES.indexOf("B"),
    currentGrade ? ALEVEL_GRADES.indexOf(currentGrade as ALevelGrade) : -1
  );
  return ALEVEL_GRADES.slice(idx) as ALevelGrade[];
}

// Mois restants avant la session d'examen ("2027-06") — plancher 0.
export function monthsToExam(examDate?: string | null): number | null {
  if (!examDate) return null;
  const m = /^(\d{4})-(\d{2})/.exec(examDate);
  if (!m) return null;
  const now = new Date();
  return Math.max(0, (Number(m[1]) - now.getFullYear()) * 12 + (Number(m[2]) - 1 - now.getMonth()));
}
