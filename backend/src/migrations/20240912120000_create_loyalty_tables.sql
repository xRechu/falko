-- Loyalty tables
create table if not exists loyalty_accounts (
  customer_id text primary key,
  balance integer not null default 0,
  locked_balance integer not null default 0,
  last_earned_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id text not null,
  type text not null,
  points integer not null,
  order_id text null,
  cart_id text null,
  note text null,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_customer_created_idx on loyalty_transactions(customer_id, created_at desc);
