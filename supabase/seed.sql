-- ==============================================================================
-- USKI STORE — INITIAL SEED DATA
-- Run this in Supabase SQL Editor AFTER running schema.sql
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
on conflict (id) do nothing;

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
on conflict (id) do nothing;

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
