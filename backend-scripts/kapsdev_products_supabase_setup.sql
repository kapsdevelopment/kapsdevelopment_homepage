-- Kapsdevelopment products setup for a shared Supabase project.
-- Intended to run in the Supabase SQL editor for the Famlo project.

create table if not exists public.kapsdev_products_order_access (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz,

  stripe_mode text not null check (stripe_mode in ('test', 'live')),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_price_id text not null,
  stripe_product_id text,

  customer_email text not null,
  product_slug text not null,
  product_name text not null,
  bundle_version text not null,
  bundle_path text not null,

  payment_status text not null default 'pending',
  currency text not null default 'nok',
  amount_subtotal integer,
  amount_tax integer,
  amount_total integer,

  access_token_hash text unique,
  access_expires_at timestamptz,
  last_access_sent_at timestamptz,

  metadata jsonb not null default '{}'::jsonb
);

alter table public.kapsdev_products_order_access enable row level security;

create index if not exists kapsdev_products_order_access_product_slug_idx
  on public.kapsdev_products_order_access (product_slug);

create index if not exists kapsdev_products_order_access_customer_email_idx
  on public.kapsdev_products_order_access (lower(customer_email));

create index if not exists kapsdev_products_order_access_access_token_hash_idx
  on public.kapsdev_products_order_access (access_token_hash)
  where access_token_hash is not null;

create or replace function public.kapsdev_products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_kapsdev_products_order_access_updated_at
  on public.kapsdev_products_order_access;

create trigger set_kapsdev_products_order_access_updated_at
before update on public.kapsdev_products_order_access
for each row
execute function public.kapsdev_products_set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kapsdev-products-private-downloads',
  'kapsdev-products-private-downloads',
  false,
  104857600,
  array['application/zip', 'application/octet-stream']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upload ZIP files to this private bucket using paths like:
-- agentic-reference/user-and-auth-reference/v1/user-and-auth-reference.zip
-- agentic-reference/iap-and-billing-reference/v1/iap-and-billing-reference.zip
-- agentic-reference/integrity-attestation-reference/v1/integrity-attestation-reference.zip
-- agentic-reference/all-in-one-reference/v1/all-in-one-reference.zip
