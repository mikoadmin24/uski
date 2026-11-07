-- ==============================================================================
-- USKI STORE — COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA & INITIAL SEED
-- Website: https://uskistore.com (Margonda Depok)
-- Architecture: Row Level Security (RLS), Realtime GPS, Storage, Audit Trail
-- Cukup COPY & PASTE seluruh file ini ke SQL Editor Supabase, lalu klik RUN.
-- Script ini aman dijalankan berulang kali (Idempotent).
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. PROFILES & USERS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  phone_number text,
  role text not null default 'customer' check (role in ('super_admin', 'admin', 'manager', 'staff', 'courier', 'customer')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text default 'BookOpen',
  parent_id text references public.categories(id) on delete set null,
  image_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  sku_master text unique not null,
  isbn text,
  name text not null,
  slug text unique not null,
  description text,
  author text,
  category_id text references public.categories(id) on delete set null,
  brand_id text,
  publisher_id text,
  base_price numeric(12,2) not null check (base_price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  discount_percentage int default 0,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  min_stock_alert int not null default 5,
  weight_grams int default 250,
  dimensions jsonb default '{"length_cm": 0, "width_cm": 0, "height_cm": 0}'::jsonb,
  specifications jsonb default '{}'::jsonb,
  images text[] not null default '{}',
  is_active boolean default true,
  is_featured boolean default false,
  is_best_seller boolean default false,
  is_new_arrival boolean default false,
  is_customizable boolean default false,
  rating numeric(3,2) default 5.0,
  reviews_count int default 0,
  sales_count int default 0,
  variants jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function update_updated_at_column();

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_sku on public.products(sku_master);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active);

-- 6. INVENTORY MOVEMENTS (AUDIT TRAIL GUDANG)
create table if not exists public.inventory_movements (
  id text primary key,
  product_id text references public.products(id) on delete cascade,
  sku text not null,
  product_name text not null,
  type text not null check (type in ('initial', 'purchase_in', 'damaged', 'manual_adjustment', 'sale_out')),
  quantity_delta int not null,
  stock_after int not null,
  notes text,
  operator_name text not null,
  created_at timestamptz default now()
);

create index if not exists idx_movements_product on public.inventory_movements(product_id);
create index if not exists idx_movements_created on public.inventory_movements(created_at desc);

-- 7. ORDERS & ORDER ITEMS
create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  items jsonb not null,
  subtotal numeric(12,2) not null,
  discount_amount numeric(12,2) default 0,
  shipping_fee numeric(12,2) default 0,
  total_amount numeric(12,2) not null,
  voucher_code text,
  payment_method text not null,
  payment_status text not null default 'pending',
  payment jsonb,
  shipping_method text not null,
  shipment jsonb,
  tracking_number text,
  courier_id text,
  courier_name text,
  status text not null default 'awaiting_payment',
  notes text,
  proof_of_payment_url text,
  payment_rejection_reason text,
  verified_by text,
  delivery_proof_url text,
  delivery_signature_url text,
  delivery_recipient_name text,
  delivery_notes text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function update_updated_at_column();

create index if not exists idx_orders_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_courier_id on public.orders(courier_id);

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

-- 8. ARMADA KURIR & GPS TELEMETRY
create table if not exists public.couriers (
  id text primary key,
  name text not null,
  phone text not null,
  email text not null,
  avatar_url text,
  vehicle_type text default 'motorcycle',
  vehicle_plate text not null,
  status text not null default 'idle' check (status in ('available', 'idle', 'delivering', 'offline', 'off_duty')),
  is_gps_active boolean default false,
  total_delivered_today int default 0,
  current_location jsonb,
  active_delivery jsonb,
  last_seen_at timestamptz default now(),
  trip_history jsonb default '[]'::jsonb,
  stationary_alert jsonb default '{"is_stationary": false, "duration_minutes": 0, "alert_type": null}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists set_couriers_updated_at on public.couriers;
create trigger set_couriers_updated_at
before update on public.couriers
for each row execute function update_updated_at_column();

-- 9. VOUCHERS / KUPON DISKON
create table if not exists public.vouchers (
  id text primary key,
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null,
  min_spend numeric(12,2) default 0,
  max_discount numeric(12,2),
  quota int default 100,
  used_count int default 0,
  usage_limit int default 100,
  usage_count int default 0,
  usage_per_user int default 1,
  target_audience text default 'all',
  target_audience_label text default 'Semua Pelanggan (Publik)',
  specific_phones text,
  applicable_category text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 10. HERO BANNER PROMO BERANDA
create table if not exists public.banners (
  id text primary key,
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  badge_text text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 11. PERMINTAAN CUSTOM & RFQ GROSIR
create table if not exists public.custom_requests (
  id text primary key,
  reference_no text unique not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  institution text,
  items jsonb not null,
  notes text,
  attachment_url text,
  status text not null default 'pending_review',
  quotation_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
  status text not null default 'pending_review',
  quote jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12. AUDIT PEMBAYARAN & BUKTI PENGIRIMAN
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

-- 13. PENGATURAN TOKO (REKENING BANK, QRIS, KONTAK)
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.couriers enable row level security;
alter table public.vouchers enable row level security;
alter table public.banners enable row level security;
alter table public.custom_requests enable row level security;
alter table public.bulk_orders enable row level security;
alter table public.payment_confirmations enable row level security;
alter table public.delivery_proofs enable row level security;
alter table public.store_settings enable row level security;

create or replace function public.is_admin_or_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('super_admin', 'admin', 'staff')
  );
end;
$$ language plpgsql security definer;

drop policy if exists "Allow public read profiles" on public.profiles;
create policy "Allow public read profiles" on public.profiles for select using (true);
drop policy if exists "Allow users update own profile" on public.profiles;
create policy "Allow users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Allow admin full profile management" on public.profiles;
create policy "Allow admin full profile management" on public.profiles for all using (public.is_admin_or_staff());

drop policy if exists "Allow public all access on categories" on public.categories;
create policy "Allow public all access on categories" on public.categories for all using (true) with check (true);

drop policy if exists "Allow public all access on products" on public.products;
create policy "Allow public all access on products" on public.products for all using (true) with check (true);

drop policy if exists "Allow public all access on banners" on public.banners;
create policy "Allow public all access on banners" on public.banners for all using (true) with check (true);

drop policy if exists "Allow public all access on vouchers" on public.vouchers;
create policy "Allow public all access on vouchers" on public.vouchers for all using (true) with check (true);

drop policy if exists "Allow public all access on inventory_movements" on public.inventory_movements;
create policy "Allow public all access on inventory_movements" on public.inventory_movements for all using (true) with check (true);

drop policy if exists "Allow public all access on orders" on public.orders;
create policy "Allow public all access on orders" on public.orders for all using (true) with check (true);

drop policy if exists "Allow public all access on order_items" on public.order_items;
create policy "Allow public all access on order_items" on public.order_items for all using (true) with check (true);

drop policy if exists "Allow public all access on couriers" on public.couriers;
create policy "Allow public all access on couriers" on public.couriers for all using (true) with check (true);

drop policy if exists "Allow public all access on custom_requests" on public.custom_requests;
create policy "Allow public all access on custom_requests" on public.custom_requests for all using (true) with check (true);

drop policy if exists "Allow public all access on bulk_orders" on public.bulk_orders;
create policy "Allow public all access on bulk_orders" on public.bulk_orders for all using (true) with check (true);

drop policy if exists "Allow public all access on payment_confirmations" on public.payment_confirmations;
create policy "Allow public all access on payment_confirmations" on public.payment_confirmations for all using (true) with check (true);

drop policy if exists "Allow public all access on delivery_proofs" on public.delivery_proofs;
create policy "Allow public all access on delivery_proofs" on public.delivery_proofs for all using (true) with check (true);

drop policy if exists "Allow public all access on store_settings" on public.store_settings;
create policy "Allow public all access on store_settings" on public.store_settings for all using (true) with check (true);

-- ==============================================================================
-- REALTIME LIVE DATA STREAMING
-- ==============================================================================
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

-- ==============================================================================
-- STORAGE BUCKETS (Product Images, Payment Proofs, Delivery Proofs)
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values 
  ('product-images', 'product-images', true, 10485760),
  ('payment-proofs', 'payment-proofs', true, 10485760),
  ('delivery-proofs', 'delivery-proofs', true, 10485760),
  ('custom-order-attachments', 'custom-order-attachments', true, 20971520)
on conflict (id) do update set public = true;

drop policy if exists "Allow public select all storage objects" on storage.objects;
create policy "Allow public select all storage objects" on storage.objects for select using (true);

drop policy if exists "Allow public insert all storage objects" on storage.objects;
create policy "Allow public insert all storage objects" on storage.objects for insert with check (true);

drop policy if exists "Allow public update all storage objects" on storage.objects;
create policy "Allow public update all storage objects" on storage.objects for update using (true);

drop policy if exists "Allow public delete all storage objects" on storage.objects;
create policy "Allow public delete all storage objects" on storage.objects for delete using (true);

-- ==============================================================================
-- INITIAL SEED DATA (KATALOG AWAL, KURIR, BANNER, VOUCHER & PENGATURAN TOKO)
-- ==============================================================================

insert into public.categories (id, name, slug, description, icon, sort_order, is_active)
values
  ('cat-1', 'Buku & Novel', 'buku-novel', 'Novel best seller, sastra, biografi, dan buku umum', 'BookOpen', 1, true),
  ('cat-2', 'Al-Qur''an', 'alquran', 'Mushaf Al-Qur''an, terjemahan, tajwid warna, dan mushaf hafalan', 'BookMarked', 2, true),
  ('cat-3', 'Buku Pelajaran & Edukasi', 'buku-pelajaran', 'Buku kurikulum merdeka, modul olimpiade, dan buku kuliah', 'GraduationCap', 3, true),
  ('cat-4', 'Buku Anak & Bergambar', 'buku-anak', 'Buku cerita, dongeng edukatif, dan buku mewarnai', 'Sparkles', 4, true),
  ('cat-5', 'Alat Tulis Kantor (ATK)', 'atk', 'Pulpen, pensil, spidol, penghapus, penggaris, dan perlengkapan meja', 'PenTool', 5, true),
  ('cat-6', 'Buku Tulis & Kertas', 'buku-tulis-kertas', 'Buku tulis sekolah, binder, loose leaf, dan kertas HVS', 'FileText', 6, true),
  ('cat-7', 'Kitab Klasik', 'kitab', 'Kitab kuning klasik, syarah pesantren, matan fikih, nahwu & shorof', 'Scroll', 7, true),
  ('cat-8', 'Perlengkapan Kantor & Filing', 'perlengkapan-kantor', 'Map ordner, stapler, kalkulator, dan papan presentasi', 'Folder', 8, true),
  ('cat-9', 'Perlengkapan Islami', 'perlengkapan-islami', 'Sajadah travelling, tasbih digital, peci, dan mukena', 'Compass', 9, true),
  ('cat-10', 'Kerajinan & Seni (Art & Craft)', 'kerajinan-seni', 'Cat air, cat akrilik, kanvas, kuas lukis, dan clay', 'Palette', 10, true)
on conflict (id) do nothing;

insert into public.store_settings (key, value)
values
  ('store_info', jsonb_build_object(
    'name', 'USKI STORE Margonda',
    'legal_name', 'CV USKI KREASI NUSANTARA',
    'phone', '0859-6724-9718',
    'email', 'cs@uskistore.id',
    'address', 'Jl. Margonda Raya No. 45, Pondok Cina, Beji, Kota Depok, Jawa Barat 16424',
    'operating_hours', 'Senin - Ahad: 08.00 - 21.00 WIB'
  ))
on conflict (key) do nothing;
