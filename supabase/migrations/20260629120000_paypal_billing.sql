-- PayPal billing: balance, transactions, subscription fields
-- Apply in Supabase SQL Editor or via supabase db push

alter table public.profiles
  add column if not exists billing_balance_cents integer not null default 0;

alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

alter table public.subscriptions
  add column if not exists paypal_subscription_id text;

alter table public.subscriptions
  add column if not exists paypal_plan_id text;

create unique index if not exists subscriptions_paypal_subscription_id_idx
  on public.subscriptions (paypal_subscription_id)
  where paypal_subscription_id is not null;

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  paypal_order_id text,
  paypal_capture_id text,
  status text not null default 'pending',
  description text,
  invoice_url text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_transactions_user_id_idx
  on public.billing_transactions (user_id, created_at desc);

alter table public.billing_transactions enable row level security;

create policy "billing_transactions_select_own"
  on public.billing_transactions for select
  using (auth.uid() = user_id);
