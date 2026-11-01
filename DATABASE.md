# DOKUMENTASI STRUKTUR DATABASE RESMI USKI STORE
**Platform:** PostgreSQL 15 via Supabase Cloud  
**Keamanan:** Row-Level Security (RLS) + Enkripsi SSL + UUID Validation  
**Real-time:** Supabase Realtime Channel (`public:live_sync`)

---

## 1. Diagram Relasi Antar Tabel (Entity Relationship)

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : "mengelompokkan"
    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : "riwayat stok"
    PROFILES ||--o{ ORDERS : "melakukan pemesanan"
    ORDERS ||--o{ ORDER_ITEMS : "memiliki item pesanan"
    VOUCHERS ||--o{ ORDERS : "digunakan pada"

    CATEGORIES {
        string id PK "cat-1, cat-2, ..."
        string name "Nama Kategori (Buku, ATK, Kitab)"
        string slug UK "buku-novel, alquran, atk"
        int sort_order "Urutan Tampilan"
        boolean is_active "Status Aktif"
    }

    PRODUCTS {
        string id PK "prod-1, prod-2, ..."
        string sku_master UK "SKU Produk"
        string name "Nama Produk"
        string category_id FK "Relasi ke Categories"
        numeric base_price "Harga Pokok / Jual (Rp)"
        int stock_quantity "Jumlah Stok Tersedia"
        int weight_grams "Berat dalam Gram (Ongkir Otomatis)"
        boolean is_active "Status Tayang di Toko"
    }

    ORDERS {
        string id PK "ord-timestamp-hash"
        string order_number UK "Nomor Pesanan (#USKI-...)"
        uuid customer_id FK "Relasi ke Profiles (opsional/guest)"
        string customer_name "Nama Pemesan"
        string customer_phone "Nomor WhatsApp Pemesan"
        jsonb items "Daftar Item & Jumlah"
        numeric subtotal "Subtotal Produk"
        numeric shipping_fee "Ongkos Kirim Toko"
        numeric total_amount "Total Tagihan Bersih"
        string status "Status (awaiting_payment, processing, shipped, delivered, cancelled)"
        string payment_status "pending / verified"
        string shipping_method "Kurir Toko USKI / Ambil di Toko"
        jsonb shipping_address "Alamat Pengiriman"
    }

    INVENTORY_MOVEMENTS {
        string id PK "mov-timestamp"
        string product_id FK "Relasi ke Products"
        string type "purchase_in, sale_out, adjustment"
        int quantity_delta "Perubahan Jumlah (+ / -)"
        int stock_after "Sisa Stok Setelah Transaksi"
        string operator_name "Admin / Pelanggan"
    }

    VOUCHERS {
        string id PK "Kupon Promo"
        string code UK "USKIDISKON10"
        string discount_type "percentage / fixed"
        numeric discount_value "Nilai Diskon"
        numeric min_spend "Minimal Belanja"
        numeric max_discount "Maksimal Potongan"
        boolean is_active "Status Aktif"
    }
```

---

## 2. Jaminan Keamanan & Integritas Data

1. **Row Level Security (RLS)**:
   - Setiap tabel dilindungi oleh aturan RLS PostgreSQL sehingga transaksi dari pelanggan hanya dapat membaca data yang sah dan membuat pesanan baru secara aman.
   - Hak istimewa pengubahan data penting (stok, status pesanan, verifikasi pembayaran) hanya dapat dilakukan oleh Admin yang terautentikasi.

2. **Perhitungan Otomatis Berat & Ongkos Kirim**:
   - Setiap produk memiliki kolom `weight_grams` yang tervalidasi (> 0).
   - Di checkout, sistem menjumlahkan `totalWeight = sum(weight_grams * qty)`.
   - Logika ongkos kirim: `Math.ceil(totalWeight / 1000) * 10.000` (Rp 10.000 per 1 kg) untuk Kurir Toko USKI, dan Rp 0 untuk Ambil Sendiri di Toko.

3. **Sinkronisasi Stok Otomatis (Audit Trail)**:
   - Setiap kali terjadi pesanan baru (checkout), sistem otomatis mengurangi `products.stock_quantity` dan mencatatnya ke tabel `inventory_movements` dengan tipe `sale_out` secara atomik.

4. **Pembersihan Data Otomatis**:
   - Skrip pemeliharaan database (`scripts/tidy_database.mjs`) disediakan untuk membersihkan data uji (*test fixtures*) dan menjaga konsistensi relasi foreign key secara berkala.
