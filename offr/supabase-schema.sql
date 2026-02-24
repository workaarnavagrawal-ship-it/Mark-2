-- Run this in your Supabase SQL editor

-- Add missing columns to existing profiles table (if upgrading)
alter table if exists profiles
  add column if not exists academic_context text,
  add column if not exists extracurricular_interests text[] default '{}',
  add column if not exists wants_predicted_grades boolean default false;

-- Profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  year text not null check (year in ('11', '12')),
  curriculum text not null check (curriculum in ('IB', 'A_LEVELS')),
  home_or_intl text not null default 'intl' check (home_or_intl in ('home', 'intl')),
  interests text[] default '{}',
  academic_context text,
  extracurricular_interests text[] default '{}',
  wants_predicted_grades boolean default false,
  core_points integer default 2,
  ps_format text default 'UCAS_3Q',
  ps_q1 text,
  ps_q2 text,
  ps_q3 text,
  ps_statement text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subjects
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  level text not null check (level in ('HL', 'SL', 'A_LEVEL')),
  predicted_grade text not null,
  current_grade text
);

-- Assessments (offer tracker)
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id text not null,
  course_name text not null,
  university_id text not null,
  university_name text not null,
  band text not null check (band in ('Safe', 'Target', 'Reach')),
  chance_percent integer not null,
  result_json jsonb not null default '{}',
  label text,
  created_at timestamptz default now()
);

-- UCAS Choices (manually added 5 choices)
create table if not exists ucas_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  position integer not null check (position >= 1 and position <= 5),
  course_id text not null,
  course_name text not null,
  university_id text not null,
  university_name text not null,
  label text check (label in ('Firm', 'Insurance', 'Backup', null)),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, position)
);

-- RLS
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table assessments enable row level security;
alter table ucas_choices enable row level security;

create policy "Users own their profile" on profiles for all using (auth.uid() = user_id);
create policy "Users own their subjects" on subjects for all using (
  auth.uid() = (select user_id from profiles where id = profile_id)
);
create policy "Users own their assessments" on assessments for all using (auth.uid() = user_id);
create policy "Users own their UCAS choices" on ucas_choices for all using (auth.uid() = user_id);
