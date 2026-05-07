-- Zentro platform spine: profiles, billing subscriptions, webhook idempotency.
-- Apply in Supabase → SQL Editor (or `supabase db push` if you use the CLI).
-- Requires: extensions pgcrypto (usually enabled on Supabase).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (created by trigger below).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- subscriptions: Lemon Squeezy subscription rows (written by webhook only).
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  lemon_subscription_id text not null unique,
  lemon_customer_id text,
  lemon_order_id text,
  lemon_product_id text,
  lemon_variant_id text,
  status text not null,
  renews_at timestamptz,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- webhook_event_deliveries: idempotent Lemon webhook processing (hash of body).
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_event_deliveries (
  delivery_id text primary key,
  event_name text not null,
  received_at timestamptz not null default now()
);

alter table public.webhook_event_deliveries enable row level security;
-- No policies: only the service role (bypasses RLS) inserts here.

-- ---------------------------------------------------------------------------
-- Auto-create profile when a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Keep updated_at fresh on profiles (optional convenience).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();
