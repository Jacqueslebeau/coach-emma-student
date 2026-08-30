// La bibliothèque des matières de Coach Emma Student — TOUS LES BOARDS.
// Chaque matière porte un cœur de technique d'examen (le vrai savoir-faire,
// commun aux boards) + un bloc STRUCTURE propre à chaque board (papers, marks,
// formats de questions, spécificités du mark scheme). L'élève choisit son board
// à l'inscription ; toute la boucle (cours, questions, exercices, corrections)
// est alors calibrée sur CE board.
import { EXAM_TECHNIQUE_MATHS } from "@/lib/examTechnique";

export type SubjectKey = "maths" | "eco" | "geo" | "french";
export type BoardKey = "edexcel" | "aqa" | "ocr";

export type BoardOption = {
  board: BoardKey;
  label: string;     // nom affiché, ex. "Edexcel"
  spec: string;      // code du spec officiel, ex. "9MA0"
  structure: string; // bloc structure d'examen injecté dans les prompts
};

export type Subject = {
  key: SubjectKey;
  labelFr: string;
  labelEn: string;
  board: string;          // label du board choisi
  boardKey: BoardKey;
  spec: string;
  examLang: "en" | "fr";  // langue des copies le jour J
  teachLang: "en" | "fr"; // langue d'enseignement — ANGLAIS par défaut (c'est un A Level)
  kind: "calculation" | "essay" | "language";
  technique: string;      // cœur matière + structure du board
};

// ---------------------------------------------------------------------------
// CŒURS DE TECHNIQUE PAR MATIÈRE (valables quel que soit le board)
// ---------------------------------------------------------------------------

const CORE_ECO = `
=== TECHNIQUE D'EXAMEN — A LEVEL ECONOMICS (cœur, tous boards) ===

LES ASSESSMENT OBJECTIVES (c'est LA grille de l'examinateur) :
- AO1 Knowledge : définitions précises, théorie exacte.
- AO2 Application : TOUJOURS ancré dans le contexte de l'extrait ou d'un exemple réel — une réponse générique plafonne.
- AO3 Analysis : chaînes de raisonnement ("this leads to… which causes… therefore…"), diagrammes corrects et EXPLOITÉS (pas décoratifs).
- AO4 Evaluation : les gros marks des essais longs — "it depends on…", magnitude, court vs long terme, hypothèses du modèle, contre-argument pesé, jugement final justifié.

STRUCTURE GAGNANTE D'UN ESSAI LONG : KAA + E par paragraphe (Knowledge → Application → Analysis, puis Evaluation), 2 gros arguments développés + évaluations > 4 arguments superficiels ; conclusion qui TRANCHE avec un critère.

COMMAND WORDS : "Define" (précis), "Calculate" (formule + unités), "Explain" (chaîne causale), "Examine" (analyse + un peu d'évaluation), "Discuss" / "Evaluate" / "To what extent" (évaluation substantielle obligatoire), "Assess" (jugement pesé).

CE QUI COÛTE L'A* : diagramme absent ou non commenté, évaluation plaquée en fin de copie ("however it depends" sans développement), pas d'application au contexte, définitions floues, conclusion qui ne tranche pas, gestion du temps (essai long ≈ 30 min).

CONVENTION DE NOTATION (absolue) : l'économie se note PAR NIVEAUX (level descriptors adossés aux AO) pour toute question d'analyse/évaluation — JAMAIS en points M1/A1 (c'est une convention de maths qui n'existe pas ici). Un barème d'éco = les niveaux + le contenu indicatif ; seules les petites questions (définition, calcul) se notent par points. Utilise UNIQUEMENT les allocations de marks et les command words qui existent réellement chez CE board (voir STRUCTURE) — n'en invente jamais.`;

const CORE_GEO = `
=== TECHNIQUE D'EXAMEN — A LEVEL GEOGRAPHY (cœur, tous boards) ===

ASSESSMENT OBJECTIVES :
- AO1 Knowledge : lieux, processus, concepts, théories — PRÉCIS (chiffres, dates, noms).
- AO2 Application : appliquer au cas / à la question EXACTE posée.
- AO3 Skills : données, cartes, statistiques exploitées.

COMMAND WORDS (chacun est un contrat) : "Describe" (quoi, pas pourquoi), "Explain" (pourquoi, chaînes causales), "Examine" (décortiquer les relations), "Analyse" (composants + liens), "Assess" (peser importance/succès + jugement), "Evaluate" (forces/faiblesses + verdict), "To what extent" (position défendue, nuancée), "Discuss" (les deux côtés).

STRUCTURE D'ESSAI GAGNANTE : plan en 30 secondes ; paragraphes PEEL (Point, Evidence — case study précise avec CHIFFRES, Explain, Link à la question) ; évaluation FILÉE dans les paragraphes, pas plaquée à la fin ; conclusion qui répond littéralement à la question posée.

CE QUI COÛTE L'A* : case studies vagues (sans données chiffrées), réciter la case study au lieu de répondre À LA question, ignorer le command word ("assess" traité comme "describe"), pas de contre-perspective, synopticité absente (liens entre thèmes), gestion du temps sur l'essai le plus long.

CONVENTION DE NOTATION (absolue) : la géographie se note PAR NIVEAUX (level descriptors adossés aux AO) dès ~6 marks — JAMAIS en points M1/A1 (convention de maths inexistante ici). Un barème de géo = les niveaux + le contenu indicatif ; seules les très petites questions factuelles se notent par points. Utilise UNIQUEMENT les allocations de marks et les command words réels de CE board (voir STRUCTURE).`;

const CORE_FRENCH = `
=== TECHNIQUE D'EXAMEN — A LEVEL FRENCH (cœur) — élève francophone en candidat libre ===

ATTENTION AU PIÈGE : être francophone natif ne garantit PAS l'A* — l'examen note une MÉTHODE, pas la fluency. Les natifs perdent des marks sur la technique, le registre et les exercices formatés.

CE QUE NOTE L'EXAMINATEUR :
- Langue : précision grammaticale (même un natif fait des fautes d'accord à l'écrit rapide), variété des structures (subjonctif, passif, connecteurs soutenus), registre SOUTENU.
- Connaissance critique : les essais notent l'ANALYSE de l'œuvre/du film (thèmes, techniques, contexte social) — structure dissertation : problématique, arguments avec CITATIONS/scènes précises, conclusion.
- Traduction : fidélité EXACTE au sens, pas de paraphrase élégante — chaque segment est un point.
- Résumé / réponses guidées : respecte le nombre de mots demandé par la consigne, reformulation (pas de copier-coller), les points du texte source.

GARDE-FOU RÈGLES D'EXAMEN : n'énonce JAMAIS une règle de notation, une pénalité, une limite de mots ou une convention de comptage comme un fait du board si elle ne figure pas dans ta STRUCTURE — un « au-delà de X mots, pénalité » inventé est une faute grave. Un conseil d'entraînement (« pour t'entraîner, vise X mots ») se donne comme TON conseil, clairement distinct de la règle officielle. Et tu n'imposes jamais à la copie un critère absent de la question posée.

CE QUI COÛTE L'A* AU CANDIDAT LIBRE : essais hors méthode (brillants mais non structurés selon le barème du board), traductions paraphrasées, dépassement des limites de mots, œuvre/film mal choisis ou connus superficiellement (citations approximatives), speaking : ne pas défendre l'IRP avec des sources.

GARDE-FOU ŒUVRES (absolu) : n'invente JAMAIS un fait d'intrigue, un personnage, un chapitre ou une CITATION d'une œuvre. Cela vaut pour les DÉTAILS : âge, origine sociale, chronologie — si tu n'es pas certain d'un détail, ne l'affirme pas (reste au niveau des thèmes et de ce qui est indiscutable). Tu ne cites entre guillemets que si tu es certain du mot à mot ; sinon tu décris la scène SANS guillemets et tu invites l'élève à retrouver le passage exact dans son édition.
FICHE VÉRIFIÉE — « No et moi » (Delphine de Vigan, 2007) : Lou Bertignac, narratrice, 13 ans, intellectuellement précoce (deux classes d'avance, en seconde) ; No (Nolwenn), jeune femme SDF de 18 ans rencontrée gare d'Austerlitz ; Lucas, camarade de classe de Lou, 17 ans ; la mère de Lou est murée dans la dépression après la mort du bébé Thaïs ; Lou fréquente la gare d'Austerlitz pour OBSERVER les voyageurs — c'est là qu'elle rencontre No, et c'est APRÈS la rencontre qu'elle lui propose une interview pour son exposé de classe sur les jeunes femmes sans abri (elle ne va PAS à la gare « pour son exposé » : la rencontre précède l'exposé) ; écart d'âge No/Lou : environ CINQ ans (18 et 13) — jamais « une dizaine d'années » ; thèmes : exclusion/SDF, famille en deuil, amitié, normalité. Ne va pas au-delà de ces faits sans certitude.

GARDE-FOU TRADUCTION : un CONTRESENS (sens changé, référent ajouté, structure grammaticale déformée) ne peut JAMAIS être accepté comme correct — le segment est perdu, dis-le. Proposer deux traductions concurrentes dont une fautive = le point est perdu à l'examen : signale cette habitude. Terminologie grammaticale : n'étiquette une construction (gérondif, participe…) que si tu es sûr du terme exact ; sinon décris la construction sans l'étiqueter. TES DEUX LANGUES SONT NOTÉES : tes exemples et corrigés anglais doivent être d'un anglais irréprochable et IDIOMATIQUE (vérifie tes phrases anglaises aussi sévèrement que le français — temps compatibles avec les marqueurs comme « since », pas de calques de formules françaises) ; n'énonce jamais une affirmation absolue sur la grammaire de l'une ou l'autre langue sans certitude, et corrige aussi les maladresses d'anglais de l'élève (archaïsmes, calques) même quand le sens est fidèle.

SPÉCIFICITÉ : les consignes et essais sont EN FRANÇAIS ; les traductions travaillent les DEUX sens. Le tuteur explique la MÉTHODE en français et entraîne au format exact des papers.`;

// ---------------------------------------------------------------------------
// STRUCTURES PAR BOARD — la bibliothèque tous boards
// ---------------------------------------------------------------------------

export const BOARD_OPTIONS: Record<SubjectKey, BoardOption[]> = {
  maths: [
    {
      board: "edexcel", label: "Edexcel", spec: "9MA0",
      structure: `
STRUCTURE EDEXCEL 9MA0 : Paper 1 & Paper 2 Pure Mathematics (2h, 100 marks chacun) ; Paper 3 Statistics & Mechanics (2h, 100 marks — Section A stats avec le Large Data Set, Section B mécanique). Rythme ~1 mark/min. Mark scheme M/A/B/ft strict ; les questions stats exigent des réponses EN CONTEXTE avec les mots de l'énoncé.`,
    },
    {
      board: "aqa", label: "AQA", spec: "7357",
      structure: `
STRUCTURE AQA 7357 (FAITS VÉRIFIÉS) : 3 papers de 2h, 100 marks chacun. Paper 1 : PURE uniquement. Paper 2 : Pure + MÉCANIQUE. Paper 3 : Pure + STATISTIQUES (avec le Large Data Set). Ne place JAMAIS la mécanique dans le Paper 3 ni les stats dans le Paper 2. Mark scheme M/A/B/ft ; "Fully justify" = chaque étape écrite.`,
    },
    {
      board: "ocr", label: "OCR", spec: "H240",
      structure: `
STRUCTURE OCR (Mathematics A) H240 : Paper 1 Pure (2h, 100 marks) ; Paper 2 Pure + Statistics (2h, 100 marks — Large Data Set) ; Paper 3 Pure + Mechanics (2h, 100 marks). SPÉCIFICITÉ OCR : l'étiquette "In this question you must show detailed reasoning" = calculatrice interdite comme raccourci, TOUT le raisonnement doit être écrit — une réponse juste sans cheminement complet perd presque tout. Mark scheme M/A/B/ft.`,
    },
  ],
  eco: [
    {
      board: "edexcel", label: "Edexcel", spec: "9EC0",
      structure: `
STRUCTURE EDEXCEL 9EC0 (Economics A — FAITS VÉRIFIÉS) : Paper 1 Markets and business behaviour = MICRO (thèmes 1 & 3) ; Paper 2 The national and global economy = MACRO (thèmes 2 & 4) ; Paper 3 synoptique — 2h, 100 marks chacun. Références spec au format thème.section.item (ex. 1.3.2 = thème 1) : le premier chiffre EST le thème — jamais de code « 3.x » pour un contenu du thème 1, et ne cite un code précis que si tu en es CERTAIN, sinon nomme le thème en toutes lettres. Le 25-marker (choix entre deux) se gagne en KAA + E avec diagramme exploité. Grille AO1-AO4 par niveaux.`,
    },
    {
      board: "aqa", label: "AQA", spec: "7136",
      structure: `
STRUCTURE AQA 7136 (FAITS VÉRIFIÉS) : le spec est numéroté 4.1.x = MICRO (Individuals, firms, markets and market failure) et 4.2.x = MACRO (The national and international economy) — n'utilise jamais un code 4.1 pour un contenu macro ni l'inverse, et ne cite un code précis que si tu en es certain. Paper 1 ≈ section 4.1 ; Paper 2 ≈ section 4.2 ; Paper 3 les deux (dont 30 QCM + étude de cas) — 2h, 80 marks chacun. N'emploie JAMAIS la nomenclature « Theme 1/2/3/4 » (c'est Edexcel) : chez AQA on dit section 4.1.x / 4.2.x ou le nom du chapitre. ALLOCATIONS RÉELLES AQA : 2, 4, 9, 15 et 25 marks — AUCUNE autre (jamais de question à 3, 5, 6 ou 8 marks). En diagnostic rapide, utilise 2 et 4 marks ; 9/15/25 = questions longues notées PAR NIVEAUX. COMMAND WORDS AQA ÉCO : Define, Calculate, Explain, Analyse, Assess, Evaluate, To what extent — « Examine » n'existe PAS chez AQA. AQA note par NIVEAUX holistiques. RÉPARTITION DES AO : le 15-marker est une question d'EXPLICATION/ANALYSE (AO1-AO3, pas d'évaluation) ; l'ÉVALUATION (« To what extent », jugement AO4) appartient au 25-marker UNIQUEMENT — ne présente jamais un 15 marks comme une question d'évaluation.`,
    },
    {
      board: "ocr", label: "OCR", spec: "H460",
      structure: `
STRUCTURE OCR H460 : Component 01 Microeconomics ; Component 02 Macroeconomics ; Component 03 Themes in economics — 2h, 80 marks chacun. VOCABULAIRE OCR : on dit « Component 01/02/03 », JAMAIS « Theme 1/2/3/4 » (Edexcel) ni « section 4.1 » (AQA) : désigne les contenus par leur nom de chapitre. TARIFS : l'essai long OCR vaut 20 marks — le « 25-marker » n'existe PAS chez OCR (c'est Edexcel/AQA) ; pas non plus de « 9-marker AO1/AO2/AO3 » à l'AQA. En diagnostic, utilise des petits tarifs (2/4/6) et annonce l'essai de 20 marks comme l'objectif. Mélange de questions courtes, réponses sur données et essais longs (20-25 marks) exigeant analyse ET évaluation ; le jugement final doit s'appuyer sur un critère explicite (magnitude, horizon temporel, hypothèses).`,
    },
  ],
  geo: [
    {
      board: "ocr", label: "OCR", spec: "H481",
      structure: `
STRUCTURE OCR H481 : Paper 1 Physical systems (1h30, 66 marks) ; Paper 2 Human interactions (1h30, 66 marks) ; Paper 3 Geographical debates (2h30, 108 marks) ; + investigation indépendante (NEA, 20%). Questions courtes → essais de 16 marks et le grand 33-marker synoptique du Paper 3 (planifier 5 min, PEEL, évaluation filée).
ALLOCATIONS RÉELLES OCR : les questions étendues valent 8, 12, 16 marks (et le 33-marker du Paper 3) — n'invente pas d'autres tarifs d'essai (pas de « 9-marker » chez OCR). Les level descriptors OCR sont construits sur les AO : un barème par niveaux DOIT dire ce que chaque niveau exige en AO1 (connaissance) et AO2 (application/analyse), et en AO3 quand des données/figures sont exploitées.
CADRE SYSTÉMIQUE OBLIGATOIRE (Landscape Systems) : chez OCR, les paysages (côtes, glaciaires, dunes) s'enseignent en SYSTÈME — sediment cell, inputs/outputs/stores/flows (transfers), dynamic equilibrium et feedbacks — un cours de géographie physique OCR sans ce cadre n'est pas aligné sur le spec.`,
    },
    {
      board: "aqa", label: "AQA", spec: "7037",
      structure: `
STRUCTURE AQA 7037 (FAITS VÉRIFIÉS) : Paper 1 Physical geography (2h30, 120 marks) ; Paper 2 Human geography (2h30, 120 marks) ; + NEA (20%). AQA n'a PAS de Paper 3 écrit — ne l'invente jamais. ALLOCATIONS ET NOTATION : 4 marks (points), 6 marks (NIVEAUX 1-2), 9 marks (NIVEAUX 1-3, souvent synoptiques), 20 marks (essai par NIVEAUX, AO1 10 + AO2 10) — les 6/9/20-markers ne se notent JAMAIS en points cochés. AQA valorise fortement les liens explicites au matériel fourni (figures, cartes).`,
    },
    {
      board: "edexcel", label: "Edexcel", spec: "9GE0",
      structure: `
STRUCTURE EDEXCEL 9GE0 : Paper 1 (physique, 2h15, 105 marks) ; Paper 2 (humaine, 2h15, 105 marks) ; Paper 3 synoptique sur ressources (2h15, 70 marks) ; + NEA (20%). NUMÉROTATION DES TOPICS (FAITS VÉRIFIÉS) : Topic 1 Tectonic Processes and Hazards ; Topic 2A Glaciated Landscapes / 2B Coastal Landscapes and Change ; Topic 3 Globalisation ; Topic 4A Regenerating Places / 4B Diverse Places ; Topic 5 The Water Cycle and Water Insecurity ; Topic 6 The Carbon Cycle and Energy Security ; Topic 7 Superpowers ; Topic 8A Health, Human Rights and Intervention / 8B Migration, Identity and Sovereignty — les côtes sont le Topic 2B, JAMAIS « Topic 4 ». TARIFS : 4, 6, 12 et 20 marks (12 et 20 par niveaux) ; essais de 12 et 20 marks ; le Paper 3 exige la synopticité via les lentilles officielles : players, attitudes and actions, futures and uncertainties — les citer et les utiliser rapporte.`,
    },
  ],
  french: [
    {
      board: "aqa", label: "AQA", spec: "7652",
      structure: `
STRUCTURE AQA 7652 (FAITS VÉRIFIÉS) : Paper 1 Listening, reading and writing (2h30, 100 marks) ; Paper 2 Writing (2h, 80 marks — 2 essais d'environ 300 mots sur œuvre littéraire et/ou film étudiés, notés langue + analyse critique) ; Paper 3 Speaking (stimulus card + Independent Research Project).
TÂCHES EXIGIBLES AU PAPER 1 — LISTE FERMÉE : compréhension de l'oral et de l'écrit (réponses en français), TRADUCTION anglais→français ET français→anglais, et RÉSUMÉ (écoute ou lecture). RÈGLE EXACTE DU RÉSUMÉ : la consigne officielle demande « environ 90 mots » (ce n'est PAS un plafond strict à 90) ; seuls les points de contenu émis avant la barre des 100 mots sont crédités — au-delà de 100 mots, la suite n'est pas notée. Ne présente ni « 90 maximum strict » ni « 90-100 » comme la consigne, et n'invente aucune autre règle de comptage. AUCUNE autre tâche n'existe : n'invente jamais un format.
ESSAIS DU PAPER 2 : chaque dissertation est notée sur 40 (20 marks AO3 langue + 20 marks AO4 réponse critique) — deux essais = 80 marks.
Candidat libre : l'inscription inclut l'épreuve orale dans un centre agréé.`,
    },
    {
      board: "edexcel", label: "Edexcel", spec: "9FR0",
      structure: `
STRUCTURE EDEXCEL 9FR0 (FAITS VÉRIFIÉS) : Paper 1 Listening, reading and translation (2h, 80 marks — compréhension orale et écrite + TRADUCTION français→anglais UNIQUEMENT) ; Paper 2 Written response to works and translation (2h40, 120 marks — Section A : traduction anglais→français de 20 marks ; Sections B/C : 2 essais sur œuvres/films de 50 marks chacun, 300-350 mots) ; Paper 3 Speaking (discussion + Independent Research Project).
ATTENTION — LISTE FERMÉE : il n'y a PAS d'épreuve de résumé chez Edexcel. Si l'élève travaille « le résumé », dis-lui clairement que ce format n'existe pas dans SON board et entraîne-le sur les tâches réelles (compréhension, traductions, essais).
NOTATION DU PAPER 1 : les réponses de compréhension sont notées sur le CONTENU (la compréhension) — la qualité de langue, la cohésion et les connecteurs n'y sont PAS notés ; la langue est notée dans les traductions et les essais du Paper 2. Ne présente jamais la cohésion comme un critère du Paper 1. Le Paper 1 Edexcel n'impose PAS de longueur de réponse (pas de « nombre de mots attendu ») et n'a pas de consigne générale « dans vos propres mots » (c'est un réflexe AQA) — n'affirme ni l'un ni l'autre.`,
    },
  ],
};
// NB : OCR n'offre pas le français au A Level — d'où 2 boards pour le français.

// ---------------------------------------------------------------------------
// MATIÈRES
// ---------------------------------------------------------------------------

type SubjectBase = {
  key: SubjectKey; labelFr: string; labelEn: string;
  examLang: "en" | "fr"; kind: Subject["kind"]; core: string;
};

const SUBJECT_BASE: Record<SubjectKey, SubjectBase> = {
  maths: { key: "maths", labelFr: "Mathématiques", labelEn: "Mathematics", examLang: "en", kind: "calculation", core: EXAM_TECHNIQUE_MATHS },
  eco: { key: "eco", labelFr: "Économie", labelEn: "Economics", examLang: "en", kind: "essay", core: CORE_ECO },
  geo: { key: "geo", labelFr: "Géographie", labelEn: "Geography", examLang: "en", kind: "essay", core: CORE_GEO },
  french: { key: "french", labelFr: "Français (candidat libre)", labelEn: "French (private candidate)", examLang: "fr", kind: "language", core: CORE_FRENCH },
};

export const SUBJECT_KEYS: SubjectKey[] = ["maths", "eco", "geo", "french"];

function buildSubject(base: SubjectBase, opt: BoardOption, teachLang?: string | null): Subject {
  return {
    key: base.key,
    labelFr: base.labelFr,
    labelEn: base.labelEn,
    board: opt.label,
    boardKey: opt.board,
    spec: opt.spec,
    examLang: base.examLang,
    // Un A Level se passe en anglais : l'enseignement est en ANGLAIS par
    // défaut. Le français A Level s'enseigne en français, toujours.
    teachLang: base.examLang === "fr" ? "fr" : teachLang === "fr" ? "fr" : "en",
    kind: base.kind,
    technique: `${base.core}\n${opt.structure}\n`,
  };
}

// La matière calibrée sur un board précis. `board` accepte la key ("aqa") ou
// le label ("AQA") — tombe sur le board par défaut de la matière sinon.
// `teachLang` : préférence de langue d'enseignement de l'élève ("en" défaut).
export function getSubjectBoard(key: string, board?: string | null, teachLang?: string | null): Subject {
  const k = (SUBJECT_KEYS.includes(key as SubjectKey) ? key : "maths") as SubjectKey;
  const options = BOARD_OPTIONS[k];
  const wanted = String(board || "").trim().toLowerCase();
  const opt = options.find((o) => o.board === wanted || o.label.toLowerCase() === wanted) || options[0];
  return buildSubject(SUBJECT_BASE[k], opt, teachLang);
}

// Compat : la matière sur son board par défaut (premier de la liste).
export function getSubject(key: string): Subject {
  return getSubjectBoard(key, null);
}

// Les 4 matières sur leur board par défaut (pickers, vitrines).
export const SUBJECTS: Record<SubjectKey, Subject> = Object.fromEntries(
  SUBJECT_KEYS.map((k) => [k, getSubject(k)])
) as Record<SubjectKey, Subject>;

// Description courte de la matière pour les prompts.
export function subjectLine(s: Subject): string {
  const langNote = s.examLang === "fr"
    ? "L'examen se passe EN FRANÇAIS (consignes, essais) avec traductions FR↔EN."
    : "L'examen se passe EN ANGLAIS : énoncés, command words et termes techniques restent en anglais tel que le jour J.";
  return `${s.labelFr} — ${s.board} A Level (${s.spec}). ${langNote}`;
}
