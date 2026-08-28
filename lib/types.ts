// Types partagés de la boucle d'apprentissage.

export type MasteryStatus = "acquis" | "fragile" | "non_acquis";

// Style d'Emma choisi par l'élève — le ton change, jamais l'efficacité.
export type TutorStyle = "strict" | "sympa" | "direct" | "chatty";

export type Concept = {
  key: string;        // slug stable, ex. "chain-rule"
  label: string;      // ex. "Chain rule (dérivation composée)"
  spec_ref?: string;  // ex. "Edexcel 9MA0 – Pure 7.2"
  why?: string;       // pourquoi ce concept compte pour l'A*
};

export type CourseSection = {
  concept_key: string;
  title: string;
  body: string; // markdown restreint + LaTeX \( \) / \[ \]
};

export type Course = {
  mode: "full" | "key";
  intro: string;
  sections: CourseSection[];
  recap: string;
};

export type QuizQuestion = {
  id: string;
  concept_key: string;
  question: string;
};

export type QuizGradeItem = {
  id: string;
  verdict: "correct" | "partial" | "wrong";
  feedback: string;
  misconception: string | null;
  model_answer: string;
};

export type ConceptVerdict = {
  concept_key: string;
  status: MasteryStatus;
  note: string;
};

export type QuizGrade = {
  items: QuizGradeItem[];
  concepts: ConceptVerdict[];
  encouragement: string;
};

export type Remediation = {
  concept_key: string;
  explanation: string;      // ré-explication sous un autre angle
  questions: QuizQuestion[]; // 2 questions de re-vérification
};

export type Exercise = {
  id: string;
  concept_keys: string[];
  statement: string;        // énoncé style past paper (anglais)
  marks: number;            // total marks
  command_word?: string;    // "Show that", "Hence", "Find"…
  question_type?: string;   // fluency | standard | multi-step | show-that | proof | modelling
  time_min?: number;        // budget temps examen (~marks + 1)
  exam_expectation?: string; // ce que l'examinateur attend pour donner tous les marks
  method_note?: string;     // (legacy) où sont les method marks
};

export type ExerciseMarkItem = {
  id: string;
  marks_awarded: number;
  marks_total: number;
  verdict: "secure" | "fragile" | "failed";
  method_comment: string;   // lecture au mark scheme (M/A marks)
  exam_habits?: string[];   // habitudes coûteuses repérées (technique d'examen)
  feedback: string;         // où c'est juste, où ça casse
  misconception: string | null;
  model_solution: string;   // corrigé pas à pas
};

export type ExerciseMark = {
  items: ExerciseMarkItem[];
  decision: "advance" | "redo";
  redo_concept_keys: string[];
  summary: string;
};

export type WeakPoint = {
  id: string;
  lesson_id: string;
  concept_key: string;
  label: string;
  misconception: string | null;
  status: "open" | "resolved";
  created_at: string;
};
