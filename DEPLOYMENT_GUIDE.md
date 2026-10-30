# PANDUAN DEPLOYMENT RESMI USKI STORE
**Arsitektur:** React 18 + Vite + Supabase (PostgreSQL, Auth, Storage, Realtime) + Cloudflare Pages + Domain DomaiNesia

Dokumen ini memandu Anda menghubungkan **USKI STORE** secara menyeluruh dari database backend Supabase, penyimpanan di GitHub, hosting di Cloudflare Pages, hingga kustom domain dari DomaiNesia dengan aman (*production-ready*).

---

## DAFTAR ISI
1. [Langkah 1: Setup Backend Supabase](#langkah-1-setup-backend-supabase)
2. [Langkah 2: Simpan & Push Kode ke GitHub](#langkah-2-simpan--push-kode-ke-github)
3. [Langkah 3: Hosting di Cloudflare Pages](#langkah-3-hosting-di-cloudflare-pages)
4. [Langkah 4: Menghubungkan Domain dari DomaiNesia](#langkah-4-menghubungkan-domain-dari-domainesia)
5. [Langkah 5: Keamanan & Pengujian Akhir](#langkah-5-keamanan--pengujian-akhir)

---

## Langkah 1: Setup Backend Supabase

Supabase bertindak sebagai backend cloud PostgreSQL yang menangani:
- Database produk, kategori, pesanan, riwayat mutasi stok, dan kupon voucher.
- Telemetri GPS real-time kurir toko (`supabase_realtime`).
- Storage bucket untuk foto produk, bukti transfer bank, dan foto bukti serah terima paket kurir.
- Sistem keamanan Row Level Security (RLS).

### Instruksi:
1. Buka [https://supabase.com](https://supabase.com) dan masuk / daftar akun gratis.
2. Klik **New Project**:
   - **Name**: `uski-store`
   - **Database Password**: Buat password yang kuat dan simpan di tempat aman.
   - **Region**: Pilih **Singapore (ap-southeast-1)** agar respon server paling cepat dari Indonesia.
   - Klik **Create new project** dan tunggu 1-2 menit hingga database siap.

3. **Jalankan Schema Database:**
   - Di dashboard Supabase sebelah kiri, klik menu **SQL Editor**.
   - Klik **New query**.
   - Buka file [`supabase/schema.sql`](file:///d:/uski%20store/supabase/schema.sql) di laptop Anda, salin (**Copy**) seluruh isinya.
   - Tempel (**Paste**) ke SQL Editor Supabase, lalu klik tombol **Run** (Ctrl + Enter).
   - *Status:* Seluruh 11 tabel, fungsi otomatis, aturan keamanan RLS, Realtime publication, dan Storage Bucket akan langsung terbuat secara otomatis.

4. **Jalankan Data Awal (Seed Data):**
   - Buat query baru di SQL Editor Supabase.
   - Buka file [`supabase/seed.sql`](file:///d:/uski%20store/supabase/seed.sql), salin (**Copy**) seluruh isinya.
   - Tempel (**Paste**) ke SQL Editor, lalu klik tombol **Run**.
   - *Status:* Data awal kategori (Buku, ATK, Al-Qur'an, Kitab), produk best seller, armada kurir GPS, banner hero, dan kupon voucher langsung aktif.

5. **Salin API Keys Proyek:**
   - Buka menu **Project Settings** (ikon gerigi di kiri bawah) -> **API**.
   - Salin dua data berikut:
     1. **Project URL** (contoh: `https://xyzabcqwerty.supabase.co`)
     2. **Project API keys** bagian `anon` / `public` (contoh: `eyJhbGciOiJIUzI1NiIsInR5...`)
   > ⚠️ **PENTING TENTANG KEAMANAN:**
   > Kunci `anon` / `public` dirancang aman untuk ditaruh di sisi frontend karena seluruh data telah dilindungi oleh **Row Level Security (RLS)**. **JANGAN PERNAH** membagikan atau memasukkan kunci `service_role` (secret) ke kode frontend.

---

## Langkah 2: Simpan & Push Kode ke GitHub

1. Buka [https://github.com](https://github.com) dan buat repository baru bernama: `uski-store` (pilih opsi **Private** atau **Public**).
2. Di terminal komputer Anda pada folder proyek `d:\uski store`, jalankan:
   ```bash
   git add .
   git commit -m "feat: complete backend supabase integration and cloudflare pages spa routing"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/uski-store.git
   git push -u origin main
   ```
   *(Ganti `USERNAME_ANDA` dengan username akun GitHub Anda).*

> 🔒 **Keamanan:** File `.env` berisi kunci rahasia lokal sudah otomatis tercantum di `.gitignore` sehingga tidak akan terunggah ke repositori publik GitHub.

---

## Langkah 3: Hosting di Cloudflare Pages

Cloudflare Pages memberikan hosting frontend berkecepatan tinggi dengan jaringan global CDN, proteksi DDoS tanpa batas, dan SSL HTTPS gratis.

### Instruksi:
1. Buka [https://dash.cloudflare.com](https://dash.cloudflare.com) dan login / buat akun gratis.
2. Di sidebar kiri, klik **Workers & Pages** -> Klik tombol **Create application**.
3. Pilih tab **Pages** -> Klik **Connect to Git**.
4. Pilih akun GitHub Anda dan pilih repository **`uski-store`**, lalu klik **Begin setup**.
5. Atur **Build configuration**:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. Buka bagian **Environment variables (advanced)** -> Klik **Add variable**:
   - Variable 1:
     - Name: `VITE_SUPABASE_URL`
     - Value: Tempel URL Supabase Anda (dari Langkah 1)
   - Variable 2:
     - Name: `VITE_SUPABASE_ANON_KEY`
     - Value: Tempel Kunci Anon Supabase Anda (dari Langkah 1)
7. Klik tombol **Save and Deploy**.
8. Cloudflare Pages akan memproses build sekitar 1-2 menit. Begitu selesai, Anda akan mendapatkan URL gratis seperti:
   `https://uski-store.pages.dev`

> 🚀 **SPA Routing Cloudflare:** File `public/_redirects` (`/* /index.html 200`) telah kami sertakan. Jadi ketika pengunjung me-refresh halaman `/admin/products`, `/courier`, atau detail buku, website **tidak akan pernah error 404**!

---

## Langkah 4: Menghubungkan Domain dari DomaiNesia

Anda memiliki domain di DomaiNesia (misal: `uskistore.id` atau `tokouski.com`). Hubungkan ke Cloudflare Pages dengan salah satu metode berikut:

### METODE A (Sangat Direkomendasikan: Full Cloudflare DNS & Kecepatan Maksimal)
Metode ini memanfaatkan CDN global Cloudflare paling optimal:

1. Di Dashboard Cloudflare:
   - Klik **Websites** -> Klik **Add a domain**.
   - Masukkan nama domain Anda (misal: `uskistore.id`) -> Pilih paket **Free**.
   - Cloudflare akan memindai DNS Anda dan memberikan **2 Nameservers**, contoh:
     - `chloe.ns.cloudflare.com`
     - `oliver.ns.cloudflare.com`
2. Buka Client Area DomaiNesia ([https://my.domainesia.com](https://my.domainesia.com)):
   - Masuk ke menu **Domain Saya** -> Pilih domain Anda.
   - Klik menu **Nameserver**.
   - Ubah dari *Gunakan Default Nameserver* ke **Gunakan Custom Nameserver**.
   - Masukkan 2 Nameserver Cloudflare tadi -> Klik **Ubah Nameserver**.
3. Hubungkan ke Pages:
   - Kembali ke Dashboard Cloudflare -> **Workers & Pages** -> Pilih proyek `uski-store`.
   - Buka tab **Custom domains** -> Klik **Set up a custom domain**.
   - Ketik `uskistore.id` -> Klik **Continue** -> Klik **Activate domain**.
   - Ulangi langkah di atas untuk subdomain `www.uskistore.id`.
4. *Selesai!* Sertifikat SSL HTTPS otomatis terbit dalam 10-30 menit tanpa perlu bayar sepeser pun.

---

### METODE B (Mempertahankan DNS DomaiNesia)
Jika Anda ingin tetap mengelola DNS di portal DomaiNesia:

1. Di Dashboard Cloudflare Pages -> Proyek `uski-store` -> Tab **Custom domains**:
   - Klik **Set up a custom domain**.
   - Masukkan `www.uskistore.id` -> Klik Continue.
   - Cloudflare akan menampilkan instruksi CNAME record yang mengarah ke `uski-store.pages.dev`.
2. Buka Client Area DomaiNesia:
   - Masuk ke **Domain Saya** -> Pilih domain Anda -> Klik **DNS Management**.
   - Tambahkan Record baru:
     - **Host / Name**: `www`
     - **Type**: `CNAME`
     - **RDATA / Target**: `uski-store.pages.dev`
     - **TTL**: `14400` atau `Auto`
   - Untuk domain utama tanpa www (`@`):
     - **Host / Name**: `@`
     - **Type**: `ALIAS` / `ANAME` (atau arahkan redirect web forwarding ke `https://www.uskistore.id`).
3. Kembali ke Cloudflare Pages dan klik **Verify DNS**.

---

## Langkah 5: Keamanan & Pengujian Akhir

Setelah domain aktif:
1. **Verifikasi SSL/TLS di Cloudflare:**
   - Masuk ke menu **SSL/TLS** di Cloudflare -> Ubah encryption mode ke **Full** atau **Full (strict)**.
   - Masuk ke menu **Edge Certificates** -> Aktifkan toggle **Always Use HTTPS** dan **Automatic HTTPS Rewrites**.
2. **Uji Fungsionalitas Lengkap:**
   - ✅ Buka website dengan HP & Laptop di domain Anda: `https://uskistore.id`.
   - ✅ Coba lakukan pembelian produk dan upload bukti bayar.
   - ✅ Buka `/admin/products`: coba scan barcode produk dan cetak stiker label.
   - ✅ Buka `/courier` di HP: izinkan izin GPS, dan periksa di `/admin/couriers` di laptop apakah titik pergerakan kurir terlacak secara live.
   - ✅ Buka menu Supabase -> **Table Editor**: periksa apakah pesanan dan data mutasi baru masuk secara real-time.

---
*Dokumen dibuat khusus untuk USKI STORE. Semua konfigurasi siap digunakan untuk skala produksi.*
