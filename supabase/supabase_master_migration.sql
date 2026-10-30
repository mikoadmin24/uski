-- ==============================================================================
-- USKI STORE — MASTER DATABASE ALIGNMENT MIGRATION
-- Project URL: https://kxbdoqviqzseymjofsjg.supabase.co
-- Idempotent script for schema alignment, RLS policies, and storage buckets
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. PRODUCTS: ADD MISSING COLUMNS
alter table public.products
  add column if not exists specifications jsonb default '{}'::jsonb,
  add column if not exists dimensions jsonb default '{"length_cm": 0, "width_cm": 0, "height_cm": 0}'::jsonb,
  add column if not exists discount_percentage int default 0,
  add column if not exists is_featured boolean default false,
  add column if not exists is_best_seller boolean default false,
  add column if not exists is_new_arrival boolean default false,
  add column if not exists is_customizable boolean default false,
  add column if not exists brand_id text,
  add column if not exists publisher_id text;

-- 3. CATEGORIES: ADD MISSING COLUMNS
alter table public.categories
  add column if not exists parent_id text references public.categories(id) on delete set null,
  add column if not exists image_url text;

-- 4. ORDERS: ADD MISSING COURIER, DELIVERY PROOF, & VOUCHER COLUMNS
alter table public.orders
  add column if not exists voucher_code text,
  add column if not exists courier_id text,
  add column if not exists delivery_proof_url text,
  add column if not exists delivery_signature_url text,
  add column if not exists delivery_recipient_name text,
  add column if not exists delivery_notes text,
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists payment jsonb,
  add column if not exists shipment jsonb;

create index if not exists idx_orders_courier_id on public.orders(courier_id);
create index if not exists idx_orders_voucher_code on public.orders(voucher_code);

-- 5. ORDER_ITEMS: CREATE RELATIONAL ITEMS TABLE
create table if not exists public.order_items (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  variant_name text,
  sku text not null,
  price numeric(12,2) not null check (price >= 0),
  quantity int not null check (quantity > 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  image_url text,
  created_at timestamptz default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- 6. COURIERS: FIX STATUS CHECK CONSTRAINT & TELEMETRY COLUMNS
alter table public.couriers drop constraint if exists couriers_status_check;
alter table public.couriers add constraint couriers_status_check
  check (status in ('available', 'idle', 'delivering', 'offline', 'off_duty'));

alter table public.couriers
  add column if not exists last_seen_at timestamptz default now(),
  add column if not exists trip_history jsonb default '[]'::jsonb,
  add column if not exists stationary_alert jsonb default '{"is_stationary": false, "duration_minutes": 0, "alert_type": null}'::jsonb;

-- 7. VOUCHERS: ADD TARGET AUDIENCE & USAGE COLUMNS
alter table public.vouchers
  add column if not exists target_audience text default 'all',
  add column if not exists target_audience_label text default 'Semua Pelanggan (Publik)',
  add column if not exists specific_phones text,
  add column if not exists usage_per_user int default 1,
  add column if not exists applicable_category text,
  add column if not exists usage_limit int default 100,
  add column if not exists usage_count int default 0;

-- Sync existing quota/used_count with usage_limit/usage_count
update public.vouchers set usage_limit = coalesce(quota, 100) where usage_limit is null;
update public.vouchers set usage_count = coalesce(used_count, 0) where usage_count is null;

-- 8. BULK_ORDERS: CREATE BULK ORDER / RFQ TABLE
create table if not exists public.bulk_orders (
  id text primary key,
  reference_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  institution_name text,
  title text not null,
  category text,
  description text,
  specifications text,
  quantity int default 1 check (quantity > 0),
  target_date text,
  estimated_budget numeric(12,2),
  shipping_address text,
  attachments jsonb default '[]'::jsonb,
  status text not null default 'pending_review' check (
    status in (
      'pending_review',
      'checking_supplier',
      'quote_sent',
      'awaiting_customer_approval',
      'approved',
      'converted_to_order',
      'rejected',
      'cancelled',
      'expired'
    )
  ),
  quote jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bulk_orders_status on public.bulk_orders(status);
create index if not exists idx_bulk_orders_ref on public.bulk_orders(reference_number);

-- 9. PAYMENT_CONFIRMATIONS: CREATE AUDIT TABLE
create table if not exists public.payment_confirmations (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  order_number text not null,
  customer_name text not null,
  payment_method text not null,
  amount numeric(12,2) not null check (amount >= 0),
  proof_image_url text not null,
  bank_name text,
  account_name text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by text,
  verified_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payment_confirmations_order on public.payment_confirmations(order_id);
create index if not exists idx_payment_confirmations_status on public.payment_confirmations(status);

-- 10. DELIVERY_PROOFS: CREATE HANDOVER AUDIT TABLE
create table if not exists public.delivery_proofs (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  courier_id text references public.couriers(id) on delete set null,
  recipient_name text not null,
  proof_photo_url text not null,
  signature_url text,
  delivery_notes text,
  delivered_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_delivery_proofs_order_id on public.delivery_proofs(order_id);
create index if not exists idx_delivery_proofs_courier_id on public.delivery_proofs(courier_id);
create index if not exists idx_delivery_proofs_delivered_at on public.delivery_proofs(delivered_at);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES FOR FULL CLIENT ACCESS
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.couriers enable row level security;
alter table public.vouchers enable row level security;
alter table public.bulk_orders enable row level security;
alter table public.payment_confirmations enable row level security;
alter table public.delivery_proofs enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.banners enable row level security;

-- Drop existing restrictive/conflicting policies and set permissive ones
drop policy if exists "Allow public all access on products" on public.products;
drop policy if exists "Allow admin manage products" on public.products;
drop policy if exists "Allow public read active products" on public.products;
create policy "Allow public all access on products" on public.products for all using (true) with check (true);

drop policy if exists "Allow public all access on categories" on public.categories;
drop policy if exists "Allow admin manage categories" on public.categories;
drop policy if exists "Allow public read active categories" on public.categories;
create policy "Allow public all access on categories" on public.categories for all using (true) with check (true);

drop policy if exists "Allow public all access on orders" on public.orders;
drop policy if exists "Allow admin manage orders" on public.orders;
drop policy if exists "Allow anyone to create order" on public.orders;
drop policy if exists "Allow customer and admin read orders" on public.orders;
drop policy if exists "Allow customer upload payment proof" on public.orders;
create policy "Allow public all access on orders" on public.orders for all using (true) with check (true);

drop policy if exists "Allow public all access on order_items" on public.order_items;
create policy "Allow public all access on order_items" on public.order_items for all using (true) with check (true);

drop policy if exists "Allow public all access on couriers" on public.couriers;
drop policy if exists "Allow admin manage couriers" on public.couriers;
drop policy if exists "Allow public read courier locations" on public.couriers;
drop policy if exists "Allow courier broadcast GPS updates" on public.couriers;
create policy "Allow public all access on couriers" on public.couriers for all using (true) with check (true);

drop policy if exists "Allow public all access on vouchers" on public.vouchers;
drop policy if exists "Allow admin manage vouchers" on public.vouchers;
drop policy if exists "Allow public read active vouchers" on public.vouchers;
create policy "Allow public all access on vouchers" on public.vouchers for all using (true) with check (true);

drop policy if exists "Allow public all access on bulk_orders" on public.bulk_orders;
create policy "Allow public all access on bulk_orders" on public.bulk_orders for all using (true) with check (true);

drop policy if exists "Allow public all access on payment_confirmations" on public.payment_confirmations;
create policy "Allow public all access on payment_confirmations" on public.payment_confirmations for all using (true) with check (true);

drop policy if exists "Allow public all access on delivery_proofs" on public.delivery_proofs;
create policy "Allow public all access on delivery_proofs" on public.delivery_proofs for all using (true) with check (true);

drop policy if exists "Allow public all access on inventory_movements" on public.inventory_movements;
drop policy if exists "Allow staff and admin manage inventory movements" on public.inventory_movements;
create policy "Allow public all access on inventory_movements" on public.inventory_movements for all using (true) with check (true);

drop policy if exists "Allow public all access on banners" on public.banners;
drop policy if exists "Allow admin manage banners" on public.banners;
drop policy if exists "Allow public read active banners" on public.banners;
create policy "Allow public all access on banners" on public.banners for all using (true) with check (true);

-- 12. STORAGE BUCKETS (INITIALIZE ALL REQUIRED BUCKETS)
insert into storage.buckets (id, name, public, file_size_limit)
values 
  ('product-images', 'product-images', true, 10485760),
  ('payment-proofs', 'payment-proofs', true, 10485760),
  ('delivery-proofs', 'delivery-proofs', true, 10485760),
  ('custom-order-attachments', 'custom-order-attachments', true, 20971520)
on conflict (id) do update set public = true;

-- Storage object policies (permissive for client-ready deployment)
drop policy if exists "Allow public select all storage objects" on storage.objects;
create policy "Allow public select all storage objects" on storage.objects for select using (true);

drop policy if exists "Allow public insert all storage objects" on storage.objects for insert with check (true);
create policy "Allow public insert all storage objects" on storage.objects for insert with check (true);

drop policy if exists "Allow public update all storage objects" on storage.objects for update using (true);
create policy "Allow public update all storage objects" on storage.objects for update using (true);

drop policy if exists "Allow public delete all storage objects" on storage.objects for delete using (true);
create policy "Allow public delete all storage objects" on storage.objects for delete using (true);

-- 13. REALTIME PUBLICATIONS
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  for t in select unnest(array['orders', 'order_items', 'couriers', 'products', 'vouchers', 'bulk_orders', 'payment_confirmations', 'delivery_proofs', 'inventory_movements', 'categories', 'banners']) loop
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
