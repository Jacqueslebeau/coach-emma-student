-- Tableau blanc par leçon : l'espace de travail tapé de l'élève (notes,
-- calculs en LaTeX). Emma le lit quand l'élève pose une question.
alter table public.lessons add column if not exists whiteboard text not null default '';
