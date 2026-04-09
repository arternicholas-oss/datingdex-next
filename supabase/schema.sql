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

-- ============================================================
-- email_subscribers: home capture
-- ============================================================
create table if not exists public.email_subscribers (
  email text primary key,
  source text,
  created_at timestamptz not null default now()
);
alter table public.email_subscribers enable row level security;
-- no user-facing read access; writes via service role only

-- ============================================================
-- couples: two-user shared date brain
-- ============================================================
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  partner_a uuid not null references auth.users(id) on delete cascade,
  partner_b uuid references auth.users(id) on delete cascade,
  invite_token text unique,
  anniversary_date date,
  display_name text,
  created_at timestamptz not null default now(),
  joined_at timestamptz,
  status text not null default 'pending' check (status in ('pending','active','ended'))
);
create index if not exists couples_partner_a_idx on public.couples(partner_a);
create index if not exists couples_partner_b_idx on public.couples(partner_b);
create index if not exists couples_invite_token_idx on public.couples(invite_token);

alter table public.couples enable row level security;

drop policy if exists "couples_members_read" on public.couples;
create policy "couples_members_read" on public.couples
  for select using (auth.uid() = partner_a or auth.uid() = partner_b);

drop policy if exists "couples_partner_a_insert" on public.couples;
create policy "couples_partner_a_insert" on public.couples
  for insert with check (auth.uid() = partner_a);

drop policy if exists "couples_members_update" on public.couples;
create policy "couples_members_update" on public.couples
  for update using (auth.uid() = partner_a or auth.uid() = partner_b);

-- shared favorites
create table if not exists public.couple_favorites (
  couple_id uuid not null references public.couples(id) on delete cascade,
  venue_slug text not null,
  saved_by uuid not null references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  primary key (couple_id, venue_slug)
);
alter table public.couple_favorites enable row level security;

drop policy if exists "couple_favorites_members_all" on public.couple_favorites;
create policy "couple_favorites_members_all" on public.couple_favorites
  for all using (
    exists (select 1 from public.couples c
      where c.id = couple_favorites.couple_id
        and (auth.uid() = c.partner_a or auth.uid() = c.partner_b))
  ) with check (
    exists (select 1 from public.couples c
      where c.id = couple_favorites.couple_id
        and (auth.uid() = c.partner_a or auth.uid() = c.partner_b))
  );

-- voting sessions: each partner picks spots, overlap wins
create table if not exists public.couple_votes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_slug text not null,
  vote text not null check (vote in ('yes','no')),
  created_at timestamptz not null default now(),
  unique (couple_id, user_id, venue_slug)
);
alter table public.couple_votes enable row level security;

drop policy if exists "couple_votes_members_all" on public.couple_votes;
create policy "couple_votes_members_all" on public.couple_votes
  for all using (
    exists (select 1 from public.couples c
      where c.id = couple_votes.couple_id
        and (auth.uid() = c.partner_a or auth.uid() = c.partner_b))
  ) with check (
    exists (select 1 from public.couples c
      where c.id = couple_votes.couple_id
        and (auth.uid() = c.partner_a or auth.uid() = c.partner_b))
  );

-- ============================================================
-- reviews: UGC captured via debrief flow
-- ============================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_slug text not null,
  plan_id uuid references public.plans(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  quote text,
  sentiment text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists reviews_venue_idx on public.reviews(venue_slug);
create index if not exists reviews_user_idx on public.reviews(user_id);

alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (published = true);

drop policy if exists "reviews_owner_write" on public.reviews;
create policy "reviews_owner_write" on public.reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "reviews_owner_update" on public.reviews;
create policy "reviews_owner_update" on public.reviews
  for update using (auth.uid() = user_id);

-- debrief tracking fields on plans
alter table public.plans add column if not exists debrief_sent_at timestamptz;
alter table public.plans add column if not exists debrief_rating int;
alter table public.plans add column if not exists debrief_note text;
alter table public.plans add column if not exists date_time timestamptz;
