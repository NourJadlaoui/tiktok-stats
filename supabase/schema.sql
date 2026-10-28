-- NicheTok.io — Supabase schema
--
-- Run this once in your Supabase project's SQL editor (Dashboard -> SQL Editor -> New query),
-- after creating the project and before signing in to the app for the first time.
--
-- Mirrors the app's existing storage shape almost exactly: db.ts already treats most data as a
-- JSON blob per row, keyed by one column (username / term / a settings key) — kv_channels,
-- kv_profile_cache, kv_video_overrides, kv_niche_search_cache, kv_settings below are that same
-- shape, just backed by Postgres instead of the old embedded SQLite file. Every table carries a
-- `user_id` defaulting to `auth.uid()`, and Row Level Security enforces that a signed-in user can
-- only read/write their own rows — except accounts listed in `admin_emails`, who can read (and,
-- where useful, write) every row via the `is_admin()` bypass baked into each policy. That's what
-- makes "I'm the admin, I can see what other users see" a database guarantee, not something the
-- app has to get right in application code.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admin allowlist
-- ---------------------------------------------------------------------------

create table if not exists public.admin_emails (
  email text primary key
);

-- Seed yourself as the first admin. Add more later from the app's Settings page,
-- or by inserting more rows here directly.
insert into public.admin_emails (email) values ('pawpunchlines@gmail.com')
  on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_emails ae
    where lower(ae.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.admin_emails enable row level security;

-- Only admins can read this table now — the app never needs a non-admin
-- session to see who the admins are (admin status is checked entirely
-- through is_admin(), which doesn't need table-level SELECT access since
-- it's SECURITY DEFINER), so there's no reason to expose admin emails to
-- every signed-in user.
drop policy if exists "only admins can read the admin list" on public.admin_emails;
create policy "only admins can read the admin list" on public.admin_emails
  for select using (public.is_admin());
drop policy if exists "only admins can manage the admin list" on public.admin_emails;
create policy "only admins can manage the admin list" on public.admin_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- Looks up another user's email by id — used only by the "Act as user"
-- banner (see src/lib/auth.ts's getEffectiveUser()) to show a human name
-- instead of a raw UUID while impersonating. SECURITY DEFINER so it can
-- read auth.users (not otherwise exposed to PostgREST at all), but it
-- checks is_admin() itself first, so a non-admin caller gets nothing.
create or replace function public.get_user_email(target_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case when public.is_admin() then email else null end
  from auth.users where id = target_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Helper: attach the standard "own rows, or admin sees everything" RLS
-- policies to any table that has a `user_id` column.
-- ---------------------------------------------------------------------------

-- drop policy has no "if exists ... on conflict"-style guard in Postgres, so
-- each policy is explicitly dropped first — makes this function (and the
-- whole file) safe to re-run against a project that already has these
-- tables/policies from an earlier run, instead of erroring out partway
-- through with "policy already exists" and leaving later CREATE TABLE
-- statements (this round's new tables) never reached.
create or replace function public._apply_owner_policies(table_name text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security', table_name);
  execute format('drop policy if exists "select own or admin" on public.%I', table_name);
  execute format(
    'create policy "select own or admin" on public.%I for select using (user_id = auth.uid() or public.is_admin())',
    table_name
  );
  execute format('drop policy if exists "insert own or admin" on public.%I', table_name);
  execute format(
    'create policy "insert own or admin" on public.%I for insert with check (user_id = auth.uid() or public.is_admin())',
    table_name
  );
  execute format('drop policy if exists "update own or admin" on public.%I', table_name);
  execute format(
    'create policy "update own or admin" on public.%I for update using (user_id = auth.uid() or public.is_admin())',
    table_name
  );
  execute format('drop policy if exists "delete own or admin" on public.%I', table_name);
  execute format(
    'create policy "delete own or admin" on public.%I for delete using (user_id = auth.uid() or public.is_admin())',
    table_name
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- KV-blob tables — one JSON blob per row, exactly like the old kv_* SQLite
-- tables in src/lib/sql/engine.ts, just with a user_id added.
-- ---------------------------------------------------------------------------

create table if not exists public.kv_channels (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  data jsonb not null,
  primary key (user_id, username)
);

create table if not exists public.kv_profile_cache (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  data jsonb not null,
  primary key (user_id, username)
);

create table if not exists public.kv_video_overrides (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  data jsonb not null,
  primary key (user_id, username)
);

create table if not exists public.kv_niche_search_cache (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term text not null,
  data jsonb not null,
  primary key (user_id, term)
);

create table if not exists public.kv_settings (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key text not null,
  data jsonb not null,
  primary key (user_id, key)
);

-- ---------------------------------------------------------------------------
-- Niche Finder runs — one row per run, same shape as the old SQLite table.
-- ---------------------------------------------------------------------------

create table if not exists public.niche_finder_runs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  started_at text not null,
  data jsonb not null,
  primary key (user_id, id)
);
create index if not exists niche_finder_runs_started_idx on public.niche_finder_runs (user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- Bulk scan jobs — background multi-username scans (Bulk Search page)
-- ---------------------------------------------------------------------------

create table if not exists public.bulk_scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'error')),
  usernames text[] not null,
  results jsonb not null default '[]',
  current_index int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bulk_scan_jobs_user_idx on public.bulk_scan_jobs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Append-only history snapshots — one row per real sync (unchanged shape
-- from the old SQLite tables, just with user_id added).
-- ---------------------------------------------------------------------------

create table if not exists public.profile_history (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  captured_at text not null,
  followers bigint not null,
  total_views bigint not null,
  total_likes bigint not null,
  total_shares bigint not null,
  video_count int not null,
  total_revenue numeric not null
);
create index if not exists profile_history_lookup_idx on public.profile_history (user_id, username, captured_at);

create table if not exists public.niche_history (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term text not null,
  captured_at text not null,
  score_overall numeric not null,
  profiles_found int not null,
  videos_scanned int not null,
  data jsonb not null
);
create index if not exists niche_history_lookup_idx on public.niche_history (user_id, term, captured_at);

-- ---------------------------------------------------------------------------
-- Usage events — one row per billable action (profile scan, niche search,
-- bulk-scan item, niche-finder term) — powers plan-limit enforcement and
-- the Admin dashboard's per-user request counts.
-- ---------------------------------------------------------------------------

create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('profile_scan', 'niche_search', 'bulk_scan_item', 'niche_finder_term')),
  subject text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_idx on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_created_idx on public.usage_events (created_at desc);

-- ---------------------------------------------------------------------------
-- Plans — subscription tiers, fully admin-configurable. Publicly readable
-- (unauthenticated visitors need to see pricing on the landing page) but
-- only admins can create/edit/deactivate one.
-- ---------------------------------------------------------------------------

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price_cents int not null default 0,
  currency text not null default 'usd',
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year', 'one_time')),
  monthly_request_limit int, -- null = unlimited
  max_tracked_profiles int, -- null = unlimited
  max_videos_per_profile int, -- null = unlimited
  bulk_scan_max_usernames int not null default 10,
  is_free_trial boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  features jsonb not null default '[]',
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;
drop policy if exists "anyone can read active plans" on public.plans;
create policy "anyone can read active plans" on public.plans for select using (is_active or public.is_admin());
drop policy if exists "only admins manage plans" on public.plans;
create policy "only admins manage plans" on public.plans for insert with check (public.is_admin());
drop policy if exists "only admins update plans" on public.plans;
create policy "only admins update plans" on public.plans for update using (public.is_admin());
drop policy if exists "only admins delete plans" on public.plans;
create policy "only admins delete plans" on public.plans for delete using (public.is_admin());

-- Seed a free trial plan and two paid tiers — edit limits/prices anytime
-- from the Admin > Plans page after this runs; these are just a sane
-- starting point, not fixed defaults the app assumes exist.
insert into public.plans (slug, name, price_cents, monthly_request_limit, max_tracked_profiles, max_videos_per_profile, bulk_scan_max_usernames, is_free_trial, sort_order, features)
values
  ('free', 'Free Trial', 0, 2, 2, 50, 2, true, 0, '["2 profile scans total", "Up to 50 videos per profile", "Basic Creator Score"]'),
  ('starter', 'Starter', 1900, 100, 25, 300, 25, false, 1, '["100 scans / month", "Track up to 25 creators", "Full video history per profile", "Bulk Search up to 25 at once", "Niche Stats & Niche Finder"]'),
  ('pro', 'Pro', 4900, 500, 150, 1000, 100, false, 2, '["500 scans / month", "Track up to 150 creators", "Bulk Search up to 100 at once", "Priority sync interval", "Everything in Starter"]')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Subscriptions — one row per user, tracks which plan + Stripe status.
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- App-wide config — single-row table for admin-toggleable platform
-- settings, e.g. whether the payment gateway is active.
-- ---------------------------------------------------------------------------

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null
);
insert into public.app_config (key, value) values ('payments_enabled', 'false') on conflict (key) do nothing;

alter table public.app_config enable row level security;
drop policy if exists "anyone can read app config" on public.app_config;
create policy "anyone can read app config" on public.app_config for select using (true);
drop policy if exists "only admins write app config" on public.app_config;
create policy "only admins write app config" on public.app_config for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Apply RLS to every user-owned table
-- ---------------------------------------------------------------------------

select public._apply_owner_policies('kv_channels');
select public._apply_owner_policies('kv_profile_cache');
select public._apply_owner_policies('kv_video_overrides');
select public._apply_owner_policies('kv_niche_search_cache');
select public._apply_owner_policies('kv_settings');
select public._apply_owner_policies('niche_finder_runs');
select public._apply_owner_policies('bulk_scan_jobs');
select public._apply_owner_policies('profile_history');
select public._apply_owner_policies('niche_history');
select public._apply_owner_policies('usage_events');
select public._apply_owner_policies('subscriptions');

-- Every user needs a subscription row from the moment they first sign in
-- (defaulted to the free-trial plan) — this trigger creates it
-- automatically right after Supabase Auth creates the auth.users row, so
-- the app never has to handle "what if this user has no subscription yet"
-- as a special case.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_plan_id uuid;
begin
  select id into free_plan_id from public.plans where slug = 'free' limit 1;
  if free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, status)
    values (new.id, free_plan_id, 'trialing')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
