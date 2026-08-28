-- Coach Emma Student — schéma initial (Phase 0 : MVP Maths Edexcel).
-- Projet Supabase DÉDIÉ : ne pas appliquer sur la base Coach Emma.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profils élèves (créés par trigger à l'inscription)
-- ---------------------------------------------------------------------------
create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text default '',
  target_grade text default 'A*',
  created_at timestamptz not null default now()
);
alter table public.student_profiles enable row level security;
create policy "own profile" on public.student_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_student()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.student_profiles (user_id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', ''))
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created_student on auth.users;
create trigger on_auth_user_created_student
  after insert on auth.users
  for each row execute function public.handle_new_student();

-- ---------------------------------------------------------------------------
-- Leçons capturées (titre / notes / photo → concepts identifiés)
-- ---------------------------------------------------------------------------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'maths',          -- maths | eco (P2) | geo (P2)
  exam_board text not null default 'Edexcel',
  title text,
  notes text,
  photo_path text,                                -- chemin bucket student-uploads
  spec_topic text,
  concepts jsonb,                                 -- [{key,label,spec_ref,why}]
  course jsonb default '{}'::jsonb,               -- {full:{...}, key:{...}}
  stage text not null default 'captured',         -- captured|course|quiz|practice|done
  created_at timestamptz not null default now()
);
create index if not exists lessons_user_idx on public.lessons (user_id, created_at desc);
alter table public.lessons enable row level security;
create policy "own lessons" on public.lessons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tentatives (quiz de maîtrise, re-vérifications de remédiation, exercices)
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                             -- quiz | remediation | exercise
  payload jsonb not null,                         -- questions / exercices posés
  result jsonb,                                   -- correction / verdicts
  created_at timestamptz not null default now()
);
create index if not exists attempts_lesson_idx on public.attempts (lesson_id, created_at desc);
alter table public.attempts enable row level security;
create policy "own attempts" on public.attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Maîtrise par concept (le cœur du diagnostic — base de la future carte des
-- concepts et de la révision espacée de la Phase 1)
-- ---------------------------------------------------------------------------
create table if not exists public.concept_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  concept_key text not null,
  label text not null default '',
  status text not null default 'non_acquis',      -- acquis | fragile | non_acquis
  history jsonb not null default '[]'::jsonb,     -- [{at,status,source}]
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id, concept_key)
);
alter table public.concept_mastery enable row level security;
create policy "own mastery" on public.concept_mastery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Points à travailler (liste vivante ; due_at prépare la révision espacée P1)
-- ---------------------------------------------------------------------------
create table if not exists public.weak_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  concept_key text not null,
  label text not null default '',
  misconception text,
  status text not null default 'open',            -- open | resolved
  due_at timestamptz,                             -- prochain rappel (révision espacée)
  created_at timestamptz not null default now()
);
create index if not exists weak_points_user_idx on public.weak_points (user_id, status, created_at desc);
alter table public.weak_points enable row level security;
create policy "own weak points" on public.weak_points
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Log des appels IA (coût par appel — convention Emma)
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_runs (
  id bigint generated always as identity primary key,
  workflow_name text not null,
  lesson_id uuid,
  user_id uuid,
  model text,
  input_tokens int,
  output_tokens int,
  cost_eur numeric,
  status text,
  error text,
  created_at timestamptz not null default now()
);
alter table public.workflow_runs enable row level security;
-- insert par l'utilisateur authentifié (log de ses propres appels) ; aucune
-- policy select → le client ne relit jamais cette table.
create policy "log own runs" on public.workflow_runs
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bucket photos (cours photographiés, copies d'exercices)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('student-uploads', 'student-uploads', false)
on conflict (id) do nothing;

create policy "own uploads read" on storage.objects
  for select using (bucket_id = 'student-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own uploads write" on storage.objects
  for insert with check (bucket_id = 'student-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own uploads update" on storage.objects
  for update using (bucket_id = 'student-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
