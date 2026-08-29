-- Langue d'enseignement d'Emma. Un A Level se passe en anglais : l'anglais
-- est le défaut ; le français reste disponible comme langue d'explication
-- (le French A Level, lui, s'enseigne toujours en français).
alter table public.student_profiles
  add column if not exists content_lang text not null default 'en';
