-- Inscriptions par matière (matière × board × niveaux × plan d'action) et
-- rattachement de la matière à toutes les données de suivi.

create table if not exists public.subject_enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,                 -- maths | eco | geo | french
  board text not null,                   -- AQA | Edexcel | OCR
  spec text not null default '',
  current_grade text,                    -- niveau au départ
  baseline_grade text,                   -- figé à la création
  target_grade text not null default 'A*',
  exam_date text,                        -- ex. "2027-06"
  action_plan jsonb,                     -- le plan d'action généré (rapport d'adéquation)
  created_at timestamptz not null default now(),
  unique (user_id, subject)
);
alter table public.subject_enrolments enable row level security;
create policy "own enrolments" on public.subject_enrolments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- La matière partout (backfill depuis lessons pour l'existant)
alter table public.concept_mastery add column if not exists subject text not null default '';
alter table public.weak_points add column if not exists subject text not null default '';
update public.concept_mastery cm set subject = l.subject
  from public.lessons l where l.id = cm.lesson_id and cm.subject = '';
update public.weak_points wp set subject = l.subject
  from public.lessons l where l.id = wp.lesson_id and wp.subject = '';
