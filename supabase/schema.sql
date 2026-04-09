-- DatingDex schema
-- Run this in the Supabase SQL editor for project nrsrjamnecanpmeiwivk
-- (Dashboard → SQL Editor → New query → paste → Run)

-- ============================================================
-- profiles: one row per auth.users, holds plan + usage counters
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user','restaurant')),
  tier text not null default 'free' check (tier in ('free','premium','annual','featured','restaurant_premium')),
  plan_uses_count int not null default 0,
  preferences jsonb not null default '{}'::jsonb,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- restaurants: claimed venue listings owned by restaurant accounts
-- ============================================================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  venue_slug text not null,
  display_name text not null,
  contact_email text,
  phone text,
  website text,
  hero_photo text,
  description text,
  tags text[] not null default '{}',
  date_packages jsonb not null default '[]'::jsonb,
  tier text not null default 'free' check (tier in ('free','featured','restaurant_premium')),
  views_count int not null default 0,
  clicks_count int not null default 0,
  saves_count int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, venue_slug)
);

create index if not exists restaurants_venue_slug_idx on public.restaurants(venue_slug);
create index if not exists restaurants_tier_idx on public.restaurants(tier);

alter table public.restaurants enable row level security;

drop policy if exists "restaurants_public_read" on public.restaurants;
create policy "restaurants_public_read" on public.restaurants for select using (true);

drop policy if exists "restaurants_owner_write" on public.restaurants;
create policy "restaurants_owner_write" on public.restaurants for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

alter table public.profiles enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- plans: every Plan My Date generation
-- ============================================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  share_id text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  city text not null default 'Washington, DC',
  situation text,
  vibe text,
  activity text,
  budget text,
  natural_language text,
  date_at timestamptz,
  itinerary jsonb not null,
  share_blurb text,
  is_public boolean not null default true,
  debrief_sent boolean not null default false,
  debrief_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists plans_share_id_idx on public.plans(share_id);
create index if not exists plans_debrief_pending_idx on public.plans(date_at) where debrief_sent = false;

alter table public.plans enable row level security;

-- public can read plans flagged is_public (used for /plan/[shareId])
drop policy if exists "plans_public_read" on public.plans;
create policy "plans_public_read" on public.plans
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "plans_owner_write" on public.plans;
create policy "plans_owner_write" on public.plans
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "plans_owner_update" on public.plans;
create policy "plans_owner_update" on public.plans
  for update using (auth.uid() = user_id);

-- ============================================================
-- favorites: simple per-user venue saves
-- ============================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_slug)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_self_all" on public.favorites;
create policy "favorites_self_all" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- helper: increment plan_uses_count atomically
-- ============================================================
create or replace function public.increment_plan_uses(p_user_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  update public.profiles
    set plan_uses_count = plan_uses_count + 1,
        updated_at = now()
    where id = p_user_id
  returning plan_uses_count into v_count;
  return v_count;
end; $$;
