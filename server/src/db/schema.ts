import { DIETS, MEAL_SLOTS, PLAN_SLOTS, REGIONS } from '../types.ts';

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

-- One night per row, dated by the morning the user woke up. Times are minutes after
-- midnight; the database works out the duration itself, wrapping past midnight
-- (23:30 → 06:45 is 435 minutes), so it can never disagree with the times.
create table if not exists app.sleep_logs (
  user_id uuid not null references app.users (id) on delete cascade,
  date date not null,
  bed_minutes smallint not null check (bed_minutes between 0 and 1439),
  wake_minutes smallint not null check (wake_minutes between 0 and 1439),
  duration_minutes smallint generated always as (((wake_minutes - bed_minutes + 1440) % 1440)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date),
  constraint sleep_logs_duration_range check (duration_minutes between 60 and 960)
);

-- Sign-in methods: a password, a Google account, or both. Google-only accounts have no
-- password hash; every account must keep at least one way in.
alter table app.users alter column password_hash drop not null;
alter table app.users add column if not exists google_sub text unique;
-- Set whenever the password changes; sessions issued before it stop working.
alter table app.users add column if not exists password_changed_at timestamptz;
alter table app.users drop constraint if exists users_has_sign_in;
alter table app.users add constraint users_has_sign_in check (password_hash is not null or google_sub is not null);

-- Password reset links. Only a SHA-256 hash of each token is kept, so a copy of this
-- table cannot be used to reset anyone's password.
create table if not exists app.password_resets (
  token_hash text primary key,
  user_id uuid not null references app.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_resets_user_idx on app.password_resets (user_id, created_at desc);

-- What was actually eaten. A check-in records each planned meal as eaten, skipped or
-- swapped (eaten something else instead), with a snapshot of the planned meal's numbers,
-- so reshuffling the plan later never rewrites what the diary says was eaten.
create table if not exists app.meal_checkins (
  user_id uuid not null references app.users (id) on delete cascade,
  date date not null,
  slot text not null check (slot in ${oneOf(PLAN_SLOTS)}),
  status text not null check (status in ('eaten', 'skipped', 'swapped')),
  meal_name text not null,
  kcal double precision not null check (kcal >= 0),
  protein double precision not null check (protein >= 0),
  carbs double precision not null check (carbs >= 0),
  fat double precision not null check (fat >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, date, slot)
);

-- Food eaten outside the plan: a dish from the meal list, one of the user's own foods, or a
-- packaged product found by barcode. Numbers are stored for the amount eaten (already
-- multiplied by servings). "slot" is set when it replaced a planned meal.
create table if not exists app.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users (id) on delete cascade,
  date date not null,
  slot text check (slot in ${oneOf(PLAN_SLOTS)}),
  source text not null check (source in ('meal', 'custom', 'barcode')),
  ref text,
  name text not null check (char_length(name) between 1 and 120),
  serving_label text not null check (char_length(serving_label) between 1 and 60),
  servings double precision not null check (servings > 0 and servings <= 20),
  kcal double precision not null check (kcal between 0 and 10000),
  protein double precision not null check (protein between 0 and 1000),
  carbs double precision not null check (carbs between 0 and 1000),
  fat double precision not null check (fat between 0 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists food_entries_user_date_idx on app.food_entries (user_id, date);

-- The user's own dishes, saved once and logged by the serving.
create table if not exists app.custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  serving_label text not null check (char_length(serving_label) between 1 and 40),
  kcal double precision not null check (kcal between 0 and 5000),
  protein double precision not null check (protein between 0 and 500),
  carbs double precision not null check (carbs between 0 and 500),
  fat double precision not null check (fat between 0 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists custom_foods_user_name_idx on app.custom_foods (user_id, lower(name));

do $$
declare
  t text;
begin
  foreach t in array array['users', 'meals', 'plans', 'water_logs', 'weight_logs', 'sleep_logs', 'meal_checkins', 'custom_foods'] loop
    execute format('drop trigger if exists touch_updated_at on app.%I', t);
    execute format(
      'create trigger touch_updated_at before update on app.%I for each row execute function app.touch_updated_at()',
      t
    );
  end loop;
  foreach t in array array['users', 'meals', 'plans', 'water_logs', 'weight_logs', 'sleep_logs', 'password_resets', 'meal_checkins', 'food_entries', 'custom_foods'] loop
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
