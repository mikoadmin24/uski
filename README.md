# USKI STORE — E-Commerce Toko Kitab & Busana Muslim

Platform e-commerce modern untuk toko kitab dan perlengkapan busana muslim, dilengkapi katalog produk, filter kategori, keranjang belanja, integrasi Supabase, dan panel admin.

---

## 🚀 Tech Stack

* **Frontend:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, Lucide Icons
* **State Management:** Zustand
* **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
* **Routing:** React Router v6

---

## 📋 Prasyarat

Pastikan telah menginstal:
* **Node.js**: Versi 18.x atau 20.x (disarankan LTS)
* **npm**: Versi 9.x atau yang lebih baru

---

## 🛠️ Panduan Instalasi & Menjalankan

### 1. Install Dependencies
Buka terminal di folder proyek dan jalankan:
```bash
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file konfigurasi contoh atau gunakan file `.env` yang sudah disediakan:
```bash
cp .env.example .env
```
Pastikan variabel berikut terisi dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_STORE_NAME="USKI STORE"
VITE_STORE_PHONE="0859-6724-9718"
VITE_STORE_EMAIL="cs@uskistore.id"
```

### 3. Menjalankan Server Pengembangan (Development)
```bash
npm run dev
```
Buka browser di alamat: `http://localhost:5173`

### 4. Build untuk Production
Untuk membuat bundle siap deploy:
```bash
npm run build
```
File output akan dihasilkan di direktori `dist/`.

Untuk melihat preview hasil build production secara lokal:
```bash
npm run preview
```

---

## 🗄️ Database & Panduan Lanjutan

* Skema dan migrasi database PostgreSQL Supabase tersedia di folder `supabase/`.
* Panduan deployment hosting (Vercel) tersedia di [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).
* Dokumentasi struktur database tersedia di [`DATABASE.md`](./DATABASE.md).
