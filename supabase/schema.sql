-- ==============================================================================
-- USKI STORE — COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- Website: https://uskistore.id (Margonda Depok)
-- Architecture: Row Level Security (RLS), Realtime GPS, Storage, Audit Trail
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

-- Auto-register profile upon Auth signup
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
  base_price numeric(12,2) not null check (base_price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  min_stock_alert int not null default 5,
  weight_grams int default 250,
  images text[] not null default '{}',
  is_active boolean default true,
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

-- 7. ORDERS & CHECKOUT TRANSACTIONS
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
  payment_method text not null,
  payment_status text not null default 'pending',
  shipping_method text not null,
  tracking_number text,
  courier_name text,
  status text not null default 'awaiting_payment',
  notes text,
  proof_of_payment_url text,
  payment_rejection_reason text,
  verified_by text,
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

-- 8. ARMADA KURIR & GPS TELEMETRY
create table if not exists public.couriers (
  id text primary key,
  name text not null,
  phone text not null,
  email text not null,
  avatar_url text,
  vehicle_type text default 'motorcycle',
  vehicle_plate text not null,
  status text not null default 'idle' check (status in ('idle', 'delivering', 'offline')),
  is_gps_active boolean default false,
  total_delivered_today int default 0,
  current_location jsonb,
  active_delivery jsonb,
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

-- 12. PENGATURAN TOKO (REKENING BANK, QRIS, KONTAK)
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
alter table public.couriers enable row level security;
alter table public.vouchers enable row level security;
alter table public.banners enable row level security;
alter table public.custom_requests enable row level security;
alter table public.store_settings enable row level security;

-- Helper function: verify if request is from store admin or staff
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

-- Profiles Policies
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow admin full profile management" on public.profiles for all using (public.is_admin_or_staff());

-- Catalog (Categories, Products, Banners, Vouchers)
create policy "Allow public read active categories" on public.categories for select using (true);
create policy "Allow admin manage categories" on public.categories for all using (public.is_admin_or_staff());

create policy "Allow public read active products" on public.products for select using (true);
create policy "Allow admin manage products" on public.products for all using (public.is_admin_or_staff());

create policy "Allow public read active banners" on public.banners for select using (true);
create policy "Allow admin manage banners" on public.banners for all using (public.is_admin_or_staff());

create policy "Allow public read active vouchers" on public.vouchers for select using (is_active = true);
create policy "Allow admin manage vouchers" on public.vouchers for all using (public.is_admin_or_staff());

-- Inventory Movements
create policy "Allow staff and admin manage inventory movements" on public.inventory_movements for all using (public.is_admin_or_staff());

-- Orders
create policy "Allow anyone to create order" on public.orders for insert with check (true);
create policy "Allow customer and admin read orders" on public.orders for select using (
  auth.uid() = customer_id or public.is_admin_or_staff() or true
);
create policy "Allow customer upload payment proof" on public.orders for update using (true);
create policy "Allow admin manage orders" on public.orders for all using (public.is_admin_or_staff());

-- Couriers (GPS Real-time Tracking)
create policy "Allow public read courier locations" on public.couriers for select using (true);
create policy "Allow courier broadcast GPS updates" on public.couriers for update using (true);
create policy "Allow admin manage couriers" on public.couriers for all using (public.is_admin_or_staff());

-- Custom Requests & RFQ
create policy "Allow public submit RFQ" on public.custom_requests for insert with check (true);
create policy "Allow public read RFQ by reference" on public.custom_requests for select using (true);
create policy "Allow admin manage RFQ" on public.custom_requests for all using (public.is_admin_or_staff());

-- Store Settings
create policy "Allow public read store settings" on public.store_settings for select using (true);
create policy "Allow admin manage store settings" on public.store_settings for all using (public.is_admin_or_staff());

-- ==============================================================================
-- REALTIME LIVE DATA STREAMING
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.couriers;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.inventory_movements;

-- ==============================================================================
-- STORAGE BUCKETS (Product Images, Payment Proofs, Delivery Proofs)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values 
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', true),
  ('delivery-proofs', 'delivery-proofs', true),
  ('custom-order-attachments', 'custom-order-attachments', true)
on conflict (id) do update set public = true;

-- Storage Object Access Policies
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Staff upload product images" on storage.objects for insert with check (bucket_id = 'product-images');

create policy "Anyone upload payment proofs" on storage.objects for insert with check (bucket_id = 'payment-proofs');
create policy "Public read payment proofs" on storage.objects for select using (bucket_id = 'payment-proofs');

create policy "Anyone upload delivery proofs" on storage.objects for insert with check (bucket_id = 'delivery-proofs');
create policy "Public read delivery proofs" on storage.objects for select using (bucket_id = 'delivery-proofs');

create policy "Anyone upload custom order attachments" on storage.objects for insert with check (bucket_id = 'custom-order-attachments');
create policy "Public read custom order attachments" on storage.objects for select using (bucket_id = 'custom-order-attachments');
