-- ===== Pré-requisitos =====
create extension if not exists pgcrypto;

-- Usaremos o schema multi-tenant:
create schema if not exists "Produto_Afiliado";

-- ===== Util: trigger p/ updated_at =====
create or replace function "Produto_Afiliado".touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- SEARCHES (consulta/briefing de produtos)
-- =========================
create table if not exists "Produto_Afiliado".searches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references "Produto_Afiliado".orgs(id) on delete cascade,
  user_id uuid references "Produto_Afiliado".app_users(id) on delete set null,
  term text not null,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists searches_org_idx on "Produto_Afiliado".searches(org_id);
create index if not exists searches_user_idx on "Produto_Afiliado".searches(user_id);
drop trigger if exists trg_searches_touch on "Produto_Afiliado".searches;
create trigger trg_searches_touch before update on "Produto_Afiliado".searches
for each row execute function "Produto_Afiliado".touch_updated_at();

-- =========================
-- PRODUCTS (itens vindos do provider)
-- =========================
create table if not exists "Produto_Afiliado".products (
  id uuid primary key default gen_random_uuid(),
  search_id uuid not null references "Produto_Afiliado".searches(id) on delete cascade,
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
  created_at timestamptz not null default now(),
  unique(search_id, provider, provider_pid)
);
create index if not exists products_search_idx on "Produto_Afiliado".products(search_id);

-- =========================
-- SELECTIONS (curadoria/seleção manual)
-- =========================
create table if not exists "Produto_Afiliado".selections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references "Produto_Afiliado".products(id) on delete cascade,
  title text not null,
  price_cents int,
  image_url text,
  final_url text,
  notes text,
  position int,
  created_at timestamptz not null default now()
);
create index if not exists selections_product_idx on "Produto_Afiliado".selections(product_id);

-- =========================
-- POSTS (conteúdo para publicar)
-- =========================
create table if not exists "Produto_Afiliado".posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references "Produto_Afiliado".orgs(id) on delete cascade,
  search_id uuid references "Produto_Afiliado".searches(id) on delete set null,
  title text not null,
  caption text,
  template text,
  status text not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  channel text default 'telegram',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_org_idx on "Produto_Afiliado".posts(org_id);
create index if not exists posts_search_idx on "Produto_Afiliado".posts(search_id);
drop trigger if exists trg_posts_touch on "Produto_Afiliado".posts;
create trigger trg_posts_touch before update on "Produto_Afiliado".posts
for each row execute function "Produto_Afiliado".touch_updated_at();

-- =========================
-- POST_ITEMS (relação post x seleção)
-- =========================
create table if not exists "Produto_Afiliado".post_items (
  post_id uuid not null references "Produto_Afiliado".posts(id) on delete cascade,
  selection_id uuid not null references "Produto_Afiliado".selections(id) on delete cascade,
  position int not null,
  primary key (post_id, selection_id)
);
create index if not exists post_items_post_idx on "Produto_Afiliado".post_items(post_id);
create index if not exists post_items_selection_idx on "Produto_Afiliado".post_items(selection_id);

-- =========================
-- TELEGRAM_SETTINGS (por organização)
-- =========================
create table if not exists "Produto_Afiliado".telegram_settings (
  org_id uuid primary key references "Produto_Afiliado".orgs(id) on delete cascade,
  bot_token text not null,
  chat_id text not null,
  utm_source text default 'telegram',
  utm_medium text default 'social',
  utm_campaign text default 'shopee',
  created_at timestamptz not null default now()
);
