-- DatingDex v2 Migration
-- Run this in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- All statements are idempotent (safe to re-run)

-- ============================================================
-- referrals: debrief-to-referral loop
-- ============================================================
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  code text unique not null,
  redeemed_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists referrals_code_idx on public.referrals(code);

alter table public.referrals enable row level security;

drop policy if exists "referrals_owner_read" on public.referrals;
create policy "referrals_owner_read" on public.referrals
  for select using (auth.uid() = referrer_id);

drop policy if exists "referrals_owner_insert" on public.referrals;
create policy "referrals_owner_insert" on public.referrals
  for insert with check (auth.uid() = referrer_id);

-- ============================================================
-- user_date_history: personalization memory
-- (plans table already stores itinerary with venue slugs,
--  so we track via plans query. No separate table needed.)
-- ============================================================

-- ============================================================
-- Add referral bonus function
-- ============================================================
create or replace function public.increment_plan_uses_bonus(p_user_id uuid, p_bonus int)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  -- Subtract from plan_uses_count (giving them more free plans)
  update public.profiles
    set plan_uses_count = greatest(0, plan_uses_count - p_bonus),
        updated_at = now()
    where id = p_user_id
  returning plan_uses_count into v_count;
  return v_count;
end; $$;

-- ============================================================
-- Add neighborhood column to plans (for filtering)
-- ============================================================
alter table public.plans add column if not exists neighborhood text;

-- ============================================================
-- Indexes for personalization query performance
-- ============================================================
create index if not exists plans_user_created_idx
  on public.plans(user_id, created_at desc);

-- ============================================================
-- Verify existing tables have required columns
-- ============================================================
-- These are idempotent - they won't error if columns exist
alter table public.plans add column if not exists debrief_sent_at timestamptz;
alter table public.plans add column if not exists debrief_rating int;
alter table public.plans add column if not exists debrief_note text;
alter table public.plans add column if not exists date_time timestamptz;

-- couples anniversary_date should already exist from v1 migration
-- but let's be safe
alter table public.couples add column if not exists anniversary_date date;
