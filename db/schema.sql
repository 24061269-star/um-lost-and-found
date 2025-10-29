-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- Enums
do $$ begin
  create type item_status as enum ('pending','approved','claimed','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_type as enum ('general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_lost_or_found as enum ('lost','found');
exception when duplicate_object then null; end $$;

do $$ begin
  create type claim_status as enum ('open','approved','denied');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('student','admin');
exception when duplicate_object then null; end $$;

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'student',
  phone_number text,
  phone_verified boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_profile_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_profile_updated_at();

-- Items
create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  status item_status not null default 'pending',
  type item_type not null default 'general',
  title text not null,
  description text,
  lost_or_found item_lost_or_found not null,
  location_text text,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
before update on public.items
for each row execute function public.handle_profile_updated_at();

-- Item images
create table if not exists public.item_images (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  url text not null
);

-- Item tags
create table if not exists public.item_tags (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  tag text not null
);
create index if not exists idx_item_tags_item_id on public.item_tags(item_id);
create index if not exists idx_item_tags_tag on public.item_tags(tag);

-- Embeddings (OpenAI text-embedding-3-small uses 1536 dims)
create table if not exists public.item_embeddings (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null unique references public.items(id) on delete cascade,
  embedding vector(1536) not null,
  provider text not null default 'openai',
  created_at timestamptz not null default now()
);
create index if not exists idx_item_embeddings_ivfflat on public.item_embeddings using ivfflat (embedding vector_cosine_ops);

-- Claims
create table if not exists public.claims (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  claimer_user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  evidence_urls text[] default '{}',
  status claim_status not null default 'open',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id)
);
create index if not exists idx_claims_item_id on public.claims(item_id);
create index if not exists idx_claims_claimer on public.claims(claimer_user_id);

-- Reports
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz
);
create index if not exists idx_reports_item_id on public.reports(item_id);
create index if not exists idx_reports_reporter on public.reports(reporter_user_id);

-- Sync profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

