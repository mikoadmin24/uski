-- ==============================================================================
-- USKI STORE — FIX RLS POLICIES FOR FULL CLIENT ACCESS
-- Jalankan file ini di Supabase SQL Editor jika ingin memastikan semua operasi
-- Tambah Produk, Ubah Stok, dan Unggah Bukti tidak pernah terblokir oleh RLS.
-- ==============================================================================

-- 1. PRODUCTS
drop policy if exists "Allow admin manage products" on public.products;
create policy "Allow admin manage products" on public.products for all using (true) with check (true);

-- 2. CATEGORIES
drop policy if exists "Allow admin manage categories" on public.categories;
create policy "Allow admin manage categories" on public.categories for all using (true) with check (true);

-- 3. BANNERS
drop policy if exists "Allow admin manage banners" on public.banners;
create policy "Allow admin manage banners" on public.banners for all using (true) with check (true);

-- 4. VOUCHERS
drop policy if exists "Allow admin manage vouchers" on public.vouchers;
create policy "Allow admin manage vouchers" on public.vouchers for all using (true) with check (true);

-- 5. INVENTORY MOVEMENTS (AUDIT TRAIL)
drop policy if exists "Allow staff and admin manage inventory movements" on public.inventory_movements;
create policy "Allow staff and admin manage inventory movements" on public.inventory_movements for all using (true) with check (true);

-- 6. ORDERS
drop policy if exists "Allow admin manage orders" on public.orders;
create policy "Allow admin manage orders" on public.orders for all using (true) with check (true);

-- 7. COURIERS
drop policy if exists "Allow admin manage couriers" on public.couriers;
create policy "Allow admin manage couriers" on public.couriers for all using (true) with check (true);

-- 8. CUSTOM REQUESTS (RFQ)
drop policy if exists "Allow admin manage RFQ" on public.custom_requests;
create policy "Allow admin manage RFQ" on public.custom_requests for all using (true) with check (true);

-- 9. STORE SETTINGS
drop policy if exists "Allow admin manage store settings" on public.store_settings;
create policy "Allow admin manage store settings" on public.store_settings for all using (true) with check (true);

-- 10. STORAGE BUCKET POLICIES (Allow public upload & read)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('custom-order-attachments', 'custom-order-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public storage upload product-images" on storage.objects;
create policy "Allow public storage upload product-images" on storage.objects for insert with check (true);

drop policy if exists "Allow public storage select product-images" on storage.objects for select using (true);

drop policy if exists "Allow public storage update product-images" on storage.objects for update using (true);
