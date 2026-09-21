import { DIETS, MEAL_SLOTS, REGIONS } from '../types.js';

/** `('a', 'b')` for a CHECK constraint, built from the same constants the API validates with. */
const oneOf = (values: readonly string[]) => `(${values.map((value) => `'${value}'`).join(', ')})`;

/**
 * The whole database schema, as one idempotent script: `npm run db:migrate` runs it
 * against DATABASE_URL, and running it again is harmless.
 *
 * Why a private `app` schema: Supabase publishes every table in `public` through its
 * REST API, where the anon key is meant to be public. This API has its own auth, so
 * nothing here should be reachable that way. Keeping the tables out of `public`,
 * enabling row level security with no policies, and revoking the API roles makes
 * sure of it — only this server's own database connection can read or write.
 */
export const SCHEMA_SQL = /* sql */ `
create schema if not exists app;

-- Keeps updated_at honest without every query having to remember it.
create or replace function app.touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists app.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  email text not null unique check (email = lower(email)),
  password_hash text not null,
  -- Partial while onboarding is unfinished; validated by the API before it is saved.
  profile jsonb not null default '{}'::jsonb,
  profile_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.meals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  slot text not null check (slot in ${oneOf(MEAL_SLOTS)}),
  diet text not null check (diet in ${oneOf(DIETS)}),
  region text not null check (region in ${oneOf(REGIONS)}),
  items jsonb not null,
  ingredients jsonb not null,
  kcal double precision not null check (kcal >= 0),
  protein double precision not null check (protein >= 0),
  carbs double precision not null check (carbs >= 0),
  fat double precision not null check (fat >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meals_slot_diet_idx on app.meals (slot, diet);

-- Meals are stored inside a plan as snapshots, so editing the meal table never rewrites an old plan.
create table if not exists app.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users (id) on delete cascade,
  inputs jsonb not null,
  targets jsonb not null,
  days jsonb not null,
  grocery_checked text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_user_created_idx on app.plans (user_id, created_at desc);
-- At most one active plan per user, enforced by the database rather than by convention.
create unique index if not exists plans_one_active_per_user on app.plans (user_id) where is_active;

create table if not exists app.water_logs (
  user_id uuid not null references app.users (id) on delete cascade,
  -- The user's own calendar day, so "today" follows their timezone.
  date date not null,
  glasses integer not null check (glasses between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists app.weight_logs (
  user_id uuid not null references app.users (id) on delete cascade,
  date date not null,
  weight_kg double precision not null check (weight_kg between 30 and 250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

do $$
declare
  t text;
begin
  foreach t in array array['users', 'meals', 'plans', 'water_logs', 'weight_logs'] loop
    execute format('drop trigger if exists touch_updated_at on app.%I', t);
    execute format(
      'create trigger touch_updated_at before update on app.%I for each row execute function app.touch_updated_at()',
      t
    );
    execute format('alter table app.%I enable row level security', t);
  end loop;
end
$$;

-- Supabase's API roles get nothing. (Plain Postgres has no such roles, so check first.)
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema app from %I', r);
      execute format('revoke all on all tables in schema app from %I', r);
      execute format('revoke all on all functions in schema app from %I', r);
      execute format('alter default privileges in schema app revoke all on tables from %I', r);
      execute format('alter default privileges in schema app revoke all on functions from %I', r);
    end if;
  end loop;
end
$$;
`;
