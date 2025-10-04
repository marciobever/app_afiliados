create extension if not exists pgcrypto;

create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  filters jsonb default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references searches(id) on delete cascade,
  provider text not null default 'shopee',
  provider_pid text not null,
  title text not null,
  price_cents int not null,
  original_price_cents int,
  currency text default 'BRL',
  image_url text,
  rating numeric,
  reviews_count int,
  product_url text,
  raw jsonb,
  created_at timestamptz default now(),
  unique(search_id, provider, provider_pid)
);

create table if not exists selections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  title text not null,
  price_cents int,
  image_url text,
  final_url text,
  notes text,
  position int,
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references searches(id) on delete set null,
  title text not null,
  caption text,
  template text,
  status text not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  channel text default 'telegram',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists post_items (
  post_id uuid references posts(id) on delete cascade,
  selection_id uuid references selections(id) on delete cascade,
  position int not null,
  primary key (post_id, selection_id)
);

create table if not exists telegram_settings (
  id boolean primary key default true,
  bot_token text not null,
  chat_id text not null,
  utm_source text default 'telegram',
  utm_medium text default 'social',
  utm_campaign text default 'shopee'
);
