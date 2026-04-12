create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  display_name text not null,
  avatar_url text,
  is_guest boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.question_cases (
  id uuid primary key default gen_random_uuid(),
  specialty text not null,
  modality text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  description text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text not null,
  image_url text not null,
  source_name text,
  source_url text,
  reviewer_name text,
  review_status text not null default 'approved' check (review_status in ('draft', 'reviewing', 'approved', 'archived')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table if exists public.question_cases
add column if not exists reviewer_name text;

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  title text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_challenge_questions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  question_id uuid not null references public.question_cases(id) on delete restrict,
  order_index integer not null,
  points integer not null default 1000 check (points > 0),
  created_at timestamptz not null default now(),
  unique (challenge_id, order_index),
  unique (challenge_id, question_id)
);

create table if not exists public.daily_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.daily_challenges(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  score integer not null default 0 check (score >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  total_time_ms integer not null default 0 check (total_time_ms >= 0),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create table if not exists public.daily_challenge_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.daily_challenge_attempts(id) on delete cascade,
  question_id uuid not null references public.question_cases(id) on delete restrict,
  order_index integer not null,
  selected_answer text,
  is_correct boolean not null,
  time_taken_ms integer not null default 0 check (time_taken_ms >= 0),
  created_at timestamptz not null default now(),
  unique (attempt_id, order_index),
  unique (attempt_id, question_id)
);

create table if not exists public.solo_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  streak_count integer not null default 0 check (streak_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  total_answered integer not null default 0 check (total_answered >= 0),
  total_time_ms integer not null default 0 check (total_time_ms >= 0),
  ended_reason text check (ended_reason in ('wrong_answer', 'timeout', 'manual_exit', 'completed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.solo_run_answers (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.solo_runs(id) on delete cascade,
  question_id uuid not null references public.question_cases(id) on delete restrict,
  sequence_no integer not null,
  selected_answer text,
  is_correct boolean not null,
  time_taken_ms integer not null default 0 check (time_taken_ms >= 0),
  created_at timestamptz not null default now(),
  unique (run_id, sequence_no)
);

create index if not exists idx_question_cases_active on public.question_cases (is_active, specialty, modality, difficulty);
create index if not exists idx_daily_challenges_date on public.daily_challenges (challenge_date desc);
create index if not exists idx_daily_attempts_challenge on public.daily_challenge_attempts (challenge_id, score desc, total_time_ms asc);
create index if not exists idx_daily_attempts_user on public.daily_challenge_attempts (user_id, created_at desc);
create index if not exists idx_daily_answers_attempt on public.daily_challenge_answers (attempt_id);
create index if not exists idx_solo_runs_user on public.solo_runs (user_id, created_at desc);
create index if not exists idx_solo_runs_best on public.solo_runs (streak_count desc, total_time_ms asc);
create index if not exists idx_solo_answers_run on public.solo_run_answers (run_id);

create or replace view public.v_leaderboard_solo_best as
select
  u.id as user_id,
  u.display_name,
  u.avatar_url,
  max(r.streak_count) as best_streak,
  sum(r.total_answered) as total_answered,
  max(r.created_at) as last_played_at
from public.app_users u
join public.solo_runs r on r.user_id = u.id
where r.status in ('completed', 'abandoned')
group by u.id, u.display_name, u.avatar_url;

create or replace view public.v_wrong_questions as
select
  sra.id as answer_id,
  sr.user_id,
  'solo_streak'::text as mode,
  sra.created_at,
  qc.id as question_id,
  qc.specialty,
  qc.modality,
  qc.difficulty,
  qc.description,
  qc.options,
  qc.correct_answer,
  qc.explanation,
  qc.image_url,
  qc.source_name,
  qc.source_url,
  qc.review_status,
  qc.reviewer_name,
  qc.updated_at,
  sra.selected_answer
from public.solo_run_answers sra
join public.solo_runs sr on sr.id = sra.run_id
join public.question_cases qc on qc.id = sra.question_id
where sra.is_correct = false

union all

select
  dca.id as answer_id,
  dct.user_id,
  'daily_challenge'::text as mode,
  dca.created_at,
  qc.id as question_id,
  qc.specialty,
  qc.modality,
  qc.difficulty,
  qc.description,
  qc.options,
  qc.correct_answer,
  qc.explanation,
  qc.image_url,
  qc.source_name,
  qc.source_url,
  qc.review_status,
  qc.reviewer_name,
  qc.updated_at,
  dca.selected_answer
from public.daily_challenge_answers dca
join public.daily_challenge_attempts dct on dct.id = dca.attempt_id
join public.question_cases qc on qc.id = dca.question_id
where dca.is_correct = false;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_question_cases_updated_at on public.question_cases;
create trigger trg_question_cases_updated_at
before update on public.question_cases
for each row
execute function public.set_updated_at();

drop trigger if exists trg_daily_challenges_updated_at on public.daily_challenges;
create trigger trg_daily_challenges_updated_at
before update on public.daily_challenges
for each row
execute function public.set_updated_at();

drop trigger if exists trg_daily_challenge_attempts_updated_at on public.daily_challenge_attempts;
create trigger trg_daily_challenge_attempts_updated_at
before update on public.daily_challenge_attempts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_solo_runs_updated_at on public.solo_runs;
create trigger trg_solo_runs_updated_at
before update on public.solo_runs
for each row
execute function public.set_updated_at();
