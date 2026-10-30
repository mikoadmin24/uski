-- ==============================================================================
-- USKI STORE — ALL-IN-ONE MASTER SETUP SCRIPT FOR SUPABASE
-- Cukup COPY & PASTE seluruh file ini ke SQL Editor Supabase, lalu klik RUN.
-- Script ini aman dijalankan berulang kali (Idempotent).
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TRIGGER UPDATED_AT
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. PROFILES TABLE
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

-- 6. INVENTORY MOVEMENTS (AUDIT TRAIL)
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

-- 7. ORDERS TABLE
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

-- 8. COURIERS TABLE (GPS TELEMETRY)
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

-- 9. VOUCHERS TABLE
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

-- 10. BANNERS TABLE
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

-- 11. CUSTOM ORDERS (RFQ)
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

-- 12. STORE SETTINGS
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
drop policy if exists "Allow public read profiles" on public.profiles;
create policy "Allow public read profiles" on public.profiles for select using (true);

drop policy if exists "Allow users update own profile" on public.profiles;
create policy "Allow users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Allow admin full profile management" on public.profiles;
create policy "Allow admin full profile management" on public.profiles for all using (public.is_admin_or_staff());

-- Categories Policies
drop policy if exists "Allow public read active categories" on public.categories;
create policy "Allow public read active categories" on public.categories for select using (true);

drop policy if exists "Allow admin manage categories" on public.categories;
create policy "Allow admin manage categories" on public.categories for all using (public.is_admin_or_staff());

-- Products Policies
drop policy if exists "Allow public read active products" on public.products;
create policy "Allow public read active products" on public.products for select using (true);

drop policy if exists "Allow admin manage products" on public.products;
create policy "Allow admin manage products" on public.products for all using (public.is_admin_or_staff());

-- Banners Policies
drop policy if exists "Allow public read active banners" on public.banners;
create policy "Allow public read active banners" on public.banners for select using (true);

drop policy if exists "Allow admin manage banners" on public.banners;
create policy "Allow admin manage banners" on public.banners for all using (public.is_admin_or_staff());

-- Vouchers Policies
drop policy if exists "Allow public read active vouchers" on public.vouchers;
create policy "Allow public read active vouchers" on public.vouchers for select using (is_active = true);

drop policy if exists "Allow admin manage vouchers" on public.vouchers;
create policy "Allow admin manage vouchers" on public.vouchers for all using (public.is_admin_or_staff());

-- Inventory Movements Policies
drop policy if exists "Allow staff and admin manage inventory movements" on public.inventory_movements;
create policy "Allow staff and admin manage inventory movements" on public.inventory_movements for all using (public.is_admin_or_staff());

-- Orders Policies
drop policy if exists "Allow anyone to create order" on public.orders;
create policy "Allow anyone to create order" on public.orders for insert with check (true);

drop policy if exists "Allow customer and admin read orders" on public.orders;
create policy "Allow customer and admin read orders" on public.orders for select using (true);

drop policy if exists "Allow customer upload payment proof" on public.orders;
create policy "Allow customer upload payment proof" on public.orders for update using (true);

drop policy if exists "Allow admin manage orders" on public.orders;
create policy "Allow admin manage orders" on public.orders for all using (public.is_admin_or_staff());

-- Couriers Policies
drop policy if exists "Allow public read courier locations" on public.couriers;
create policy "Allow public read courier locations" on public.couriers for select using (true);

drop policy if exists "Allow courier broadcast GPS updates" on public.couriers;
create policy "Allow courier broadcast GPS updates" on public.couriers for update using (true);

drop policy if exists "Allow admin manage couriers" on public.couriers;
create policy "Allow admin manage couriers" on public.couriers for all using (public.is_admin_or_staff());

-- Custom Requests Policies
drop policy if exists "Allow public submit RFQ" on public.custom_requests;
create policy "Allow public submit RFQ" on public.custom_requests for insert with check (true);

drop policy if exists "Allow public read RFQ by reference" on public.custom_requests;
create policy "Allow public read RFQ by reference" on public.custom_requests for select using (true);

drop policy if exists "Allow admin manage RFQ" on public.custom_requests;
create policy "Allow admin manage RFQ" on public.custom_requests for all using (public.is_admin_or_staff());

-- Store Settings Policies
drop policy if exists "Allow public read store settings" on public.store_settings;
create policy "Allow public read store settings" on public.store_settings for select using (true);

drop policy if exists "Allow admin manage store settings" on public.store_settings;
create policy "Allow admin manage store settings" on public.store_settings for all using (public.is_admin_or_staff());

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare
  t text;
begin
  for t in select unnest(array['orders', 'couriers', 'products', 'inventory_movements']) loop
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ==============================================================================
insert into storage.buckets (id, name, public)
values 
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', true),
  ('delivery-proofs', 'delivery-proofs', true),
  ('custom-order-attachments', 'custom-order-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');

drop policy if exists "Staff upload product images" on storage.objects;
create policy "Staff upload product images" on storage.objects for insert with check (bucket_id = 'product-images');

drop policy if exists "Anyone upload payment proofs" on storage.objects;
create policy "Anyone upload payment proofs" on storage.objects for insert with check (bucket_id = 'payment-proofs');

drop policy if exists "Public read payment proofs" on storage.objects;
create policy "Public read payment proofs" on storage.objects for select using (bucket_id = 'payment-proofs');

drop policy if exists "Anyone upload delivery proofs" on storage.objects;
create policy "Anyone upload delivery proofs" on storage.objects for insert with check (bucket_id = 'delivery-proofs');

drop policy if exists "Public read delivery proofs" on storage.objects;
create policy "Public read delivery proofs" on storage.objects for select using (bucket_id = 'delivery-proofs');

drop policy if exists "Anyone upload custom order attachments" on storage.objects;
create policy "Anyone upload custom order attachments" on storage.objects for insert with check (bucket_id = 'custom-order-attachments');

drop policy if exists "Public read custom order attachments" on storage.objects;
create policy "Public read custom order attachments" on storage.objects for select using (bucket_id = 'custom-order-attachments');

-- ==============================================================================
-- INITIAL SEED DATA (KATALOG BUKU, ATK, AL-QURAN, KITAB, KURIR & VOUCHER)
-- ==============================================================================

-- 1. CATEGORIES
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
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description;

-- 2. PRODUCTS
insert into public.products (id, sku_master, isbn, name, slug, description, author, category_id, base_price, sale_price, stock_quantity, min_stock_alert, weight_grams, images, is_active, rating, reviews_count, sales_count)
values
  (
    'prod-1',
    'BK-AH-001',
    '978-602-06-3317-6',
    'Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa',
    'atomic-habits',
    'Buku terlaris dunia karya James Clear. Panduan praktis untuk membangun kebiasaan baik dan membuang kebiasaan buruk.',
    'James Clear',
    'cat-1',
    108000,
    91800,
    45,
    5,
    350,
    array['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'],
    true,
    4.9,
    128,
    350
  ),
  (
    'prod-2',
    'BK-QA-002',
    '978-602-04-9876-1',
    'Filosofi Teras: Panduan Stoikisme Hidup Tenang',
    'filosofi-teras',
    'Penerapan filsafat stoisisme kuno Yunani-Romawi untuk mengatasi kecemasan dan stres mental modern.',
    'Henry Manampiring',
    'cat-1',
    98000,
    null,
    28,
    5,
    320,
    array['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800'],
    true,
    4.8,
    94,
    210
  ),
  (
    'prod-3',
    'QR-TJW-003',
    '978-979-1234-56-7',
    'Al-Qur''an Mushaf Al-Bayan Tajwid Warna & Terjemah Per Kata A5',
    'alquran-albayan-tajwid-warna-a5',
    'Mushaf khat Madinah rasm Utsmani dengan panduan hukum tajwid warna tajam dan terjemahan per kata depag.',
    'Tim Lajnah Kemenag RI',
    'cat-2',
    125000,
    106250,
    32,
    5,
    850,
    array['https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&q=80&w=800'],
    true,
    5.0,
    67,
    140
  ),
  (
    'prod-4',
    'ATK-JYK-004',
    null,
    'Joyko Gel Pen 0.5mm GP-265 (Pack 12 Pcs Hitam)',
    'joyko-gel-pen-gp265-pack-12',
    'Pulpen gel tinta hitam pekat, cepat kering anti bocor, ujung jarum presisi halus untuk menulis catatan rapi.',
    'Joyko Official',
    'cat-5',
    36000,
    29900,
    85,
    10,
    180,
    array['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800'],
    true,
    4.9,
    215,
    650
  ),
  (
    'prod-5',
    'ATK-SIDU-005',
    null,
    'Buku Tulis SiDu Kiky 38 Lembar (Pack 10 Buku)',
    'buku-tulis-sidu-38-lembar-pack-10',
    'Kertas HVS putih bersih berkualitas tinggi 70 gsm, garis tajam dan tidak tembus tinta.',
    'Sinar Dunia (SiDu)',
    'cat-6',
    42000,
    36500,
    60,
    15,
    1200,
    array['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=800'],
    true,
    4.8,
    142,
    480
  ),
  (
    'prod-6',
    'KTB-FTH-006',
    '978-979-8877-11-2',
    'Kitab Fathul Qorib Al-Mujib (Syarah Matan Ghoyah wa Taqrib)',
    'kitab-fathul-qorib-syarah-taqrib',
    'Kitab rujukan fikih madzhab Syafi''i standar pesantren nusantara, cetakan harokat lengkap jilid kertas kuning.',
    'Al-Imam Ibnu Qosim Al-Ghazi',
    'cat-7',
    35000,
    null,
    40,
    5,
    300,
    array['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'],
    true,
    4.9,
    53,
    120
  )
on conflict (id) do update set
  base_price = excluded.base_price,
  sale_price = excluded.sale_price,
  stock_quantity = excluded.stock_quantity;

-- 3. COURIERS (REAL-TIME GPS TELEMETRY)
insert into public.couriers (id, name, phone, email, avatar_url, vehicle_type, vehicle_plate, status, is_gps_active, total_delivered_today, current_location, active_delivery)
values
  (
    'cour-1',
    'Bambang Supriyadi',
    '0857-1122-3344',
    'bambang.kurir@uskistore.id',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'motorcycle',
    'B 4521 EXD (Honda Beat Hitam)',
    'delivering',
    true,
    6,
    jsonb_build_object(
      'lat', -6.3850,
      'lng', 106.8280,
      'heading', 195,
      'speed_kmh', 34,
      'accuracy_meters', 4,
      'address_approx', 'Jl. Margonda Raya Km 4.5, dekat RS Bunda',
      'last_updated', '10:42 WIB',
      'battery_level', 86
    ),
    jsonb_build_object(
      'order_id', 'ord-1001',
      'order_number', 'USKI-2026-0089',
      'recipient_name', 'Budi Santoso',
      'recipient_phone', '0812-9876-5432',
      'destination_address', 'Jl. Margonda Raya No. 102, Beji, Kota Depok',
      'destination_coords', jsonb_build_object('lat', -6.3920, 'lng', 106.8240),
      'started_at', '10:15 WIB',
      'eta_minutes', 8,
      'distance_km', 1.4,
      'progress_pct', 65
    )
  ),
  (
    'cour-2',
    'Ahmad Fauzi',
    '0813-5566-7788',
    'fauzi.kurir@uskistore.id',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    'motorcycle',
    'B 3890 TKO (Yamaha NMAX Putih)',
    'idle',
    true,
    4,
    jsonb_build_object(
      'lat', -6.3728,
      'lng', 106.8335,
      'heading', 0,
      'speed_kmh', 0,
      'accuracy_meters', 3,
      'address_approx', 'Gudang Pusat USKI STORE Margonda Depok',
      'last_updated', '10:35 WIB',
      'battery_level', 92
    ),
    null
  )
on conflict (id) do nothing;

-- 4. PROMO BANNERS
insert into public.banners (id, title, subtitle, image_url, link_url, badge_text, is_active, sort_order)
values
  (
    'ban-1',
    'Tahun Ajaran Baru & Koleksi Kitab Klasik',
    'Dapatkan diskon hingga 30% untuk perlengkapan sekolah, Al-Qur''an rasm Utsmani, dan kitab rujukan pesantren.',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1600',
    '/products?category=atk',
    'PROMO SPESIAL',
    true,
    1
  ),
  (
    'ban-2',
    'Paket Grosir Instansi & Pesantren',
    'Layanan pemesanan pengadaan buku cetak kustom, seragam ATK kantor, dan faktur pajak resmi.',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1600',
    '/bulk-order',
    'LAYANAN B2B',
    true,
    2
  )
on conflict (id) do nothing;

-- 5. VOUCHERS
insert into public.vouchers (id, code, description, discount_type, discount_value, min_spend, max_discount, quota, used_count, is_active)
values
  ('v-1', 'USKIBARU', 'Diskon selamat datang pelanggan baru USKI STORE', 'percentage', 10, 50000, 20000, 1000, 48, true),
  ('v-2', 'HEMATATK', 'Potongan Rp 15.000 belanja perlengkapan sekolah & ATK', 'fixed', 15000, 75000, 15000, 500, 89, true),
  ('v-3', 'BERKAHRAMADHAN', 'Diskon 15% spesial Al-Qur''an dan Kitab Islami', 'percentage', 15, 100000, 50000, 300, 12, true)
on conflict (id) do nothing;

-- 6. STORE SETTINGS
insert into public.store_settings (key, value)
values
  ('store_info', jsonb_build_object(
    'name', 'USKI STORE Margonda',
    'legal_name', 'CV USKI KREASI NUSANTARA',
    'phone', '0812-3456-7890',
    'email', 'cs@uskistore.id',
    'address', 'Jl. Margonda Raya No. 45, Pondok Cina, Beji, Kota Depok, Jawa Barat 16424',
    'operating_hours', 'Senin - Ahad: 08.00 - 21.00 WIB'
  )),
  ('payment_accounts', jsonb_build_object(
    'bca_number', '8830-1928-33',
    'bca_holder', 'CV USKI KREASI NUSANTARA',
    'bsi_number', '719-283-9911',
    'bsi_holder', 'USKI STORE RESMI',
    'qris_image_url', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226670014ID.LINKAJA.WWW0118936005030000088301021588301928330000303UME51440014ID.CO.QRIS.WWW0215ID10200238491825204581453033605802ID5910USKI STORE6005DEPOK61051642462070703A016304E8A3'
  ))
on conflict (key) do update set value = excluded.value;
