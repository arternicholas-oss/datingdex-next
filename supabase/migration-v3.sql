-- DatingDex v3 Migration
-- Rich plan output + 1-anon + 1-email + 1-free tier funnel
-- Run in Supabase SQL Editor. All statements idempotent.

-- ============================================================
-- email_captures: plan 2 in the funnel (email wall, no signup)
-- IP-hashed so we don't store raw IP, but can rate-limit.
-- ============================================================
create table if not exists public.email_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text,
  source text not null default 'email_wall',
  plans_used int not null default 0,
  last_plan_at timestamptz,
  converted_user_id uuid references auth.users(id) on delete set null,
  marketing_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists email_captures_email_idx on public.email_captures(lower(email));
create index if not exists email_captures_ip_idx on public.email_captures(ip_hash);
create index if not exists email_captures_created_idx on public.email_captures(created_at);

alter table public.email_captures enable row level security;

-- No public policies. Service role only (we read/write via service client).

-- ============================================================
-- anonymous_plan_counts: plan 1 (pure anon) by IP hash
-- ============================================================
create table if not exists public.anonymous_plan_counts (
  ip_hash text primary key,
  count int not null default 0,
  last_plan_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- plans: extend for rich payload and deep-routing
-- ============================================================
alter table public.plans add column if not exists plan_payload jsonb;
alter table public.plans add column if not exists anon_email text;
alter table public.plans add column if not exists ip_hash text;
alter table public.plans add column if not exists city_slug text;
alter table public.plans add column if not exists weather jsonb;
alter table public.plans add column if not exists playlist_url text;
alter table public.plans add column if not exists version int not null default 3;

create index if not exists plans_anon_email_idx on public.plans(anon_email);
create index if not exists plans_city_slug_idx on public.plans(city_slug);

-- ============================================================
-- Helper RPC: atomic increment for anonymous_plan_counts
-- ============================================================
create or replace function public.increment_anon_plan_count(p_ip_hash text)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  insert into public.anonymous_plan_counts (ip_hash, count, last_plan_at, updated_at)
  values (p_ip_hash, 1, now(), now())
  on conflict (ip_hash) do update
    set count = public.anonymous_plan_counts.count + 1,
        last_plan_at = now(),
        updated_at = now()
  returning count into v_count;
  return v_count;
end; $$;

create or replace function public.increment_email_capture_plans(p_email text)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  update public.email_captures
    set plans_used = plans_used + 1,
        last_plan_at = now()
    where lower(email) = lower(p_email)
  returning plans_used into v_count;
  return coalesce(v_count, 0);
end; $$;
