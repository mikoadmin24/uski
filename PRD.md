# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# USKI STORE — BOOKSTORE & STATIONERY E-COMMERCE

| Metadata | Detail |
| :--- | :--- |
| **Product Name** | USKI STORE |
| **Product Type** | E-commerce website / Progressive Web App (PWA) |
| **Reference Design** | [Gramedia Design System on DesignMD](https://designmd.me/s/gramedia-r9li6) / [www.gramedia.com-DESIGN.md](file:///d:/uski%20store/www.gramedia.com-DESIGN.md) |
| **Primary Language** | Bahasa Indonesia |
| **Currency** | Indonesian Rupiah (IDR) |
| **Primary Market** | Indonesia |
| **Development Environment** | Antigravity |
| **Backend Target** | Supabase (PostgreSQL, Auth, Storage, Edge Functions / Triggers) |
| **Frontend Target** | React + TypeScript + Vite + Tailwind CSS |
| **Status** | Approved Master Specification |
| **Last Updated** | 2026-10-30 |

---

# 1. PRODUCT OVERVIEW

## 1.1 Product Vision
Build USKI STORE, a professional online retail platform for books, stationery (ATK), educational supplies, Islamic books, office supplies, and other related products.

The website provides a shopping experience comparable in functionality to established bookstore e-commerce platforms (such as Gramedia) while maintaining its own brand identity and visual design.

USKI STORE is more than a product catalog. It supports the actual retail workflow, from product discovery and inventory management to checkout, payment confirmation, shipping, customer service, reporting, and administrative operations.

## 1.2 Business Objectives
1. Sell books and stationery products online.
2. Make products easy to discover through search, categories, filters, and promotions.
3. Support retail and bulk purchases.
4. Centralize product, inventory, customer, order, and payment management.
5. Provide reliable sales and inventory reports.
6. Support mobile-first shopping.
7. Allow store staff to operate the system without editing source code.
8. Provide a secure foundation for future business growth.

## 1.3 Target Customers
- Students and university students.
- School students and parents.
- Teachers and educational institutions.
- Santri, educators, and Islamic book readers.
- Office workers and administrative teams.
- Individual readers.
- Schools, offices, and institutions purchasing products in bulk.

## 1.4 Product Categories
The catalog supports configurable categories, including:
- Books and novels (Buku umum & fiksi/non-fiksi).
- Educational and academic books (Buku pelajaran & pegangan guru).
- Children's books.
- Self-development, history, and general-interest books.
- Qur'an, tafsir, hadith, and Islamic literature.
- Classical Islamic texts and kitab kuning.
- Notebooks and writing supplies (Buku tulis & kertas).
- Pens, pencils, markers, erasers, and rulers (ATK esensial).
- Paper, folders, envelopes, and office supplies.
- School bags and pencil cases.
- Art and craft supplies.
- Islamic learning and worship supplies.
- Other products created by administrators.

Categories are manageable from the admin dashboard without modifying source code.

---

# 2. DESIGN REQUIREMENTS

## 2.1 Source of Truth
Read the design specification at:
* Local Document: [www.gramedia.com-DESIGN.md](file:///d:/uski%20store/www.gramedia.com-DESIGN.md)
* Online Reference: https://designmd.me/s/gramedia-r9li6

Use it as the primary visual reference, together with any local DESIGN.md or Markdown files already present in the project. Inspect the actual project before changing its styling. Do not create an unrelated design system or replace existing approved layouts.

## 2.2 Visual Direction
The design communicates:
- Professional retail bookstore aesthetics.
- Trust and product availability.
- Easy product discovery.
- Clear pricing and purchase actions.
- A modern, organized bookstore experience.
- Consistency across desktop and mobile.

### Measured Design Tokens
- **Primary Brand Blue:** `#0060AE` (Conversion CTAs, active highlights, badges)
- **Dark Canvas:** `#000000` (Hero contrast bands, deep backgrounds)
- **Alternative Surface:** `#2D3033` (Navigation bar, dark section surface)
- **Surface / Pure White:** `#FFFFFF` (Card surfaces, forms, content container)
- **Hairline Border:** `#E3E4E5` (1px clean borders for cards and dividers)
- **Body Copy:** `#5A6166` (High readability text on white surfaces)
- **Accent Yellow:** `#FFCE3B` (Highlights & rating accents)
- **Badge Diskon:** Background `rgb(248, 231, 233)` with text `rgb(185, 17, 38)`
- **Typography:** `Urbanist` (Weights: 400, 500, 600, 800)

## 2.3 Design Rules
- Preserve the existing Markdown design specifications.
- Keep the interface product-focused.
- Use consistent product image ratios.
- Ensure prices, discounts, and stock status are easy to scan.
- Use consistent spacing (base 4px scale) and typography.
- Avoid excessive gradients, unnecessary animations, and repetitive decorative cards.
- Avoid generic AI-generated layouts.
- Maintain appropriate contrast and accessible text sizes.
- Optimize the layout for mobile devices.
- Use clear loading, error, empty, and success states.

## 2.4 Responsive Requirements
The application works seamlessly on:
- Mobile phones (375px+).
- Tablets (768px+).
- Laptops (1024px+).
- Desktop monitors (1280px - 1440px max content width 1376px).

Mobile has a dedicated layout strategy, including a sticky bottom navigation bar for primary flows and thumb-friendly touch targets (min 44px).

---

# 3. USER ROLES AND PERMISSIONS

## 3.1 Guest
**Can:**
- Browse the homepage, categories, promotions, and product catalog.
- Search and filter products by category, price, brand, availability.
- View product details, specifications, and availability.
- Add products to a temporary cart (localStorage).
- Checkout as a guest if enabled.
- Contact the store through WhatsApp.
- Track an order using a secure tracking method when provided.

**Cannot:**
- Access another customer's private data.
- Manage products or inventory.
- Access administrative reports or backoffice routes.

## 3.2 Registered Customer
**Can:**
- Do everything a guest can do.
- Maintain a profile and multiple shipping addresses.
- View their own orders, invoices, and payment receipts.
- Save and manage a wishlist.
- View eligible payment and shipping information.
- Submit eligible product reviews (verified purchase only).
- Receive order notifications.
- Maintain a shopping cart across sessions and devices.

Customers must only access their own private account and order information.

## 3.3 Administrator
Has full authorized access to:
- Dashboard and business summaries.
- Products, categories, brands, publishers, and variants.
- Inventory movements, stock opname, and barcode operations.
- Orders and payment records (approval/rejection).
- Customer management.
- Promotions, banners, and vouchers.
- Bulk order quotations and custom requests.
- Shipping configuration and local radius.
- Reports and exports (Sales, COGS/Margins, Inventory, Tax).
- Store settings.
- Staff permissions and audit logs.

## 3.4 Store Staff
Staff access is configurable by role or permission:
- Product management.
- Inventory management.
- Order processing & packaging.
- Customer service.
- Cashier and payment verification.
- Report viewing.

Staff do not automatically receive full administrator privileges.

## 3.5 Courier
If the store operates its own delivery team:
- View assigned deliveries.
- View only the information necessary to complete those deliveries (recipient, address, phone).
- Update delivery status (In Transit, Delivered, Failed).
- Record delivery attempts and notes.
- Record proof of delivery (photo upload).
- Record cash actually received for COD orders.

Couriers do not access the complete customer database, store configuration, or unrelated orders.

---

# 4. PUBLIC STOREFRONT

## 4.1 Homepage
Implements:
- Store header and search bar with autocomplete suggestions.
- Product category quick-navigation.
- Promotional hero carousel banner managed by administrators.
- Featured categories grid.
- New arrivals (Buku & ATK terbaru).
- Best-selling products.
- Discounted products (Promo kilat / Diskon spesial).
- Recommended products.
- Relevant product collections (e.g., Back to School, Kitab Kuning Pilihan, ATK Kantor Hemat).
- Value proposition badges (Produk Original, Pengiriman Cepat, Layanan Custom & Grosir).
- Footer with store policies, contact details, payment & courier partners.

Every product section uses real product data. Promotional banners are manageable from the admin dashboard.

## 4.2 Navigation
Provides access to:
- Home (`/`)
- All products (`/products`)
- Product categories (`/categories/:slug`)
- Promotions (`/promotions`)
- Bulk purchasing & custom order (`/bulk-order`)
- Customer account (`/account`)
- Shopping cart (`/cart`)
- Order tracking (`/track-order`)
- Customer support / Contact (`/contact`)

On mobile, uses a compact and accessible bottom navigation bar (`Home`, `Kategori`, `Custom/Grosir`, `Keranjang`, `Akun`).

## 4.3 Product Catalog
Required capabilities:
- Grid display based on Gramedia design reference.
- Pagination or controlled load-more behavior.
- Indexed search supporting product name, SKU, ISBN, author, publisher, and brand.
- Facet filtering: Category, Brand, Price Range, Availability.
- Sorting: Newest, Price (low-to-high, high-to-low), Popularity.
- Active filter pills with clear-all functionality.
- Total result count.
- Empty search state with actionable suggestions.

## 4.4 Product Details
Displays:
- Product name and brand/publisher.
- High-resolution product images with zoom and thumbnail switcher.
- Price and discounted price with percentage badge.
- Stock availability indicator.
- Full description and technical specifications.
- Available variants selector (Color, Size, Pack).
- Quantity counter with stock limits.
- Primary CTA: "Tambah ke Keranjang" & "Beli Sekarang".
- Wishlist toggle.
- Related and cross-selling products.
- Verified customer reviews and ratings.

## 4.5 Product Variants
Supports products with variants:
- Pen color (Hitam, Biru, Merah).
- Paper & notebook size (A4, B5, A5, F4).
- Pack size (Pcs, Lusin, Box).
- Cover type (Hardcover, Softcover).

Each variant has its own SKU, price override (if applicable), and dedicated stock balance.

## 4.6 Wishlist
Registered customers can:
- Add products to a wishlist.
- Remove products.
- View saved products.
- Move items directly to the cart.
- Clearly flags discontinued or out-of-stock items.

---

# 5. SHOPPING CART AND CHECKOUT

## 5.1 Cart
Features:
- Add, update quantity, and remove items.
- Real-time variant switching.
- Price, subtotal, discount, and estimated total calculation.
- Detection of unavailable or out-of-stock items.
- Empty-cart state with a "Mulai Belanja" call to action.
- Guest carts persist in `localStorage`; authenticated carts synchronize with Supabase.
- Deterministic cart merge upon login preventing duplicate entries.

## 5.2 Checkout Modes
1. Guest checkout (with contact and address input).
2. Registered customer checkout (with saved addresses).
Both modes enforce strict server-side validation.

## 5.3 Checkout Information
Collects:
- Customer name, valid WhatsApp/phone number, email.
- Shipping address (Province, City, District, Postal Code).
- Shipping method (Regular, Cargo, Local Store Courier, Store Pickup).
- Payment method (Bank Transfer, QRIS, Midtrans, COD).
- Order notes.
- Voucher promo code.

## 5.4 Order Creation (Zero-Trust Security)
The backend/service layer must:
1. Validate cart items and selected variants.
2. Read current prices from trusted product records in the database.
3. Validate available stock.
4. Validate applicable vouchers.
5. Calculate discounts and shipping fees.
6. Calculate the authoritative grand total.
7. Create order and line items transactionally.
8. Atomically decrement stock.
9. Record initial payment and order state.
10. Return an authoritative order confirmation.

**Never trust client-supplied totals, prices, or discounts.**

---

# 6. PAYMENTS

## 6.1 Supported Payment Methods
- **Midtrans Payment Integration:** Snap / Core API for Virtual Account, QRIS GoPay/ShopeePay, and Credit Card.
- **Manual Bank Transfer:** BCA, Mandiri, BSI, BRI with clear transfer instructions and unique nominal codes.
- **Manual QRIS:** Store QRIS image display with customer scan & pay.
- **Cash on Delivery (COD):** Restricted to eligible local delivery zones.

## 6.2 Manual Transfer & QRIS Workflow
1. Customer places order (Status: `Menunggu Pembayaran`).
2. System displays bank details / QRIS image and nominal.
3. Customer submits proof of payment (file upload).
4. Status changes to `Menunggu Verifikasi`.
5. Authorized staff verifies payment in admin backoffice.
6. System logs the verifier user ID and timestamp.
7. Status updates to `Pembayaran Diterima` (`Diproses`).

Uploading proof of payment **never** automatically marks an order as paid without staff verification.

## 6.3 Midtrans Integration
- Create payment sessions through a secure backend/edge function.
- Verify payment notifications server-side using signature key verification.
- Process webhooks idempotently (prevent duplicate status updates).
- Handle statuses: `settlement`, `pending`, `expire`, `cancel`, `deny`.
- Never expose server keys in frontend code.

## 6.4 Cash on Delivery (COD)
- Restricted to eligible local shipping zones.
- Records amount due.
- Couriers record cash collected upon delivery.
- Reconciles payment upon courier return.

---

# 7. SHIPPING AND STORE PICKUP

## 7.1 Shipping Configuration
Configurable from admin:
- Origin store address and geographic coordinates.
- Shipping methods: Ekspedisi (JNE/J&T/SiCepat), Kargo, Kurir Toko (Local), Ambil di Toko (Pickup).
- Base rates, per-kg rates, and free shipping thresholds.
- Local delivery radius (km) and road-distance fee rules.
- Store pickup hours and instructions.

## 7.2 Shipping Statuses
- `Awaiting Fulfillment` (Menunggu Diproses)
- `Processing / Packing` (Sedang Dikemas)
- `Ready for Pickup / Handover` (Siap Diambil / Diserahkan ke Kurir)
- `Shipped / In Transit` (Dalam Pengiriman)
- `Delivered` (Pesanan Selesai / Diterima)
- `Delivery Failed` (Pengiriman Gagal / Retur)
- `Cancelled` (Dibatalkan)

No fabricated tracking updates are allowed. If courier API is disconnected, manual tracking number entry is provided.

---

# 8. BULK ORDERING AND SPECIAL QUOTATIONS (CUSTOM ORDERS)

## 8.1 Customer Workflow
1. Customer accesses `/bulk-order`.
2. Customer submits product list, specifications, quantities, or uploads an Excel/PDF/image RFQ.
3. Customer provides contact, deadline, and delivery address.
4. System generates a quotation request ticket (`custom_requests`).
5. Admin reviews request, checks suppliers, and sets internal COGS.
6. Admin issues an official quotation (`custom_quotes`) with validity expiry date.
7. Customer reviews quotation and approves or rejects it.
8. Approved quotation automatically converts to an official order for payment.

## 8.2 Quotation Details
Contains quotation number, items, unit prices, approved bulk discounts, additional custom service fees, shipping fees, total, validity period, and admin notes.

---

# 9. ADMIN DASHBOARD & BACKOFFICE

## 9.1 Dashboard Overview
Displays operational widgets:
- Gross sales vs. Confirmed paid sales.
- Orders requiring processing.
- Pending payment verifications.
- Pending bulk/custom quotation requests.
- Low-stock and out-of-stock alerts.
- Top-selling products and recent order transactions.

## 9.2 Backoffice Modules
1. **Products:** CRUD, rich descriptions, multi-images, variants, ISBN, barcodes, active toggle.
2. **Categories & Brands:** Hierarchical taxonomy, publisher and brand management.
3. **Inventory & Barcodes:** Stock additions, adjustments, audit movement history, low stock threshold, hardware barcode scanner support & manual SKU entry fallback.
4. **Orders:** Full order lifecycle, status update, invoice printing, packaging slips.
5. **Payments:** Payment verification modal, proof preview, approval/rejection logging.
6. **Bulk Orders:** Quotation builder, revision history, RFQ file download.
7. **Shipments:** Courier assignment, tracking number entry, dispatch logs.
8. **Promotions & Vouchers:** Banner campaigns, voucher codes, min-spend, quota.
9. **Customers:** Customer directory, order history, contact info.
10. **Reports & Exports:** Sales by date/category, COGS profit margins, inventory valuation, CSV/Excel & printable PDF invoices.
11. **Store Settings:** Branding, bank accounts, QRIS image upload, shipping zones, store policies.
12. **Staff & Permissions:** Granular role assignment (Admin, Staf Gudang, Kasir, Kurir).
13. **Audit Logs:** Immutable audit log for financial, inventory, and status mutations.

---

# 10. REVIEWS & RATINGS
- 1-5 star ratings with verified-purchase badge.
- Customer reviews with photos.
- Admin moderation to hide or report inappropriate content.

---

# 11. NOTIFICATIONS
- Channels: In-app notification bell, Email, WhatsApp Business API.
- Trigger events: Order placed, payment instructions, payment verified, order shipped with tracking number, quotation ready, low inventory alert.
- Robust queue with retry mechanism for failed deliveries.

---

# 12. TECHNICAL ARCHITECTURE

## 12.1 Frontend
- React 18+ with TypeScript
- Vite build tool
- Tailwind CSS configured with Gramedia design tokens
- React Router v6
- Lucide React icon library
- TanStack Query (React Query) for data fetching & caching
- Zustand for lightweight client state (Cart, Wishlist, UI state)

## 12.2 Backend & Database
- Supabase PostgreSQL with extensions (`pgcrypto`, `uuid-ossp`)
- Supabase Auth (Email/Password, Google OAuth, Guest tokens)
- Supabase Storage:
  * Public: `product-images`, `banners`, `store-assets`
  * Private: `payment-proofs`, `custom-order-files`, `invoices`
- Row Level Security (RLS) enabled on all tables
- Database triggers for inventory movement logging and stock integrity

## 12.3 Core Data Schema (27+ Entities)
* `profiles`, `roles`, `user_roles`, `addresses`
* `categories`, `brands`, `publishers`
* `products`, `product_images`, `product_variants`
* `inventory_movements`
* `carts`, `cart_items`
* `orders`, `order_items`
* `payments`, `payment_events`
* `shipments`, `shipment_status_history`
* `vouchers`, `promotions`, `voucher_redemptions`
* `wishlists`, `wishlist_items`
* `reviews`
* `custom_requests`, `custom_request_files`, `custom_quotes`, `custom_quote_items`, `custom_quote_revisions`
* `store_settings`, `notifications`, `audit_logs`

## 12.4 Security Policies
- Zero Client Trust: All calculations executed or verified server-side.
- RLS ensures customers can only read/write their own records.
- Secret service role keys never shipped to client bundles.
- Signed URLs with expiration for private storage objects.

---

# 13. REQUIRED ROUTES

### Public Storefront
- `/` — Homepage
- `/products` — Product Catalog with Filters
- `/products/:slug` — Product Detail Page
- `/categories/:slug` — Category Page
- `/brands/:slug` — Brand Page
- `/promotions` — Promo Page
- `/search` — Search Results
- `/cart` — Cart Page
- `/checkout` — Checkout Page
- `/bulk-order` — Bulk / Custom Order Request Form
- `/bulk-order/:reference` — Quotation Review & Approval
- `/track-order` — Order Tracking
- `/login` & `/register` & `/forgot-password` — Authentication
- `/contact` & `/about` — Store Information
- `/policies/:type` — Shipping, Returns, Privacy, Terms

### Customer Account
- `/account` — Dashboard Overview
- `/account/profile` — Personal Details
- `/account/addresses` — Address Book
- `/account/orders` — Order History
- `/account/orders/:id` — Order Detail & Invoice
- `/account/wishlist` — Saved Items
- `/account/reviews` — My Reviews

### Admin & Staff Backoffice
- `/admin` — Metrics Overview
- `/admin/products` — Product Management
- `/admin/categories` — Category Management
- `/admin/brands` — Brands & Publishers
- `/admin/inventory` — Stock Movements & Adjustments
- `/admin/inventory/barcode` — Barcode Scanner & Rapid Stock
- `/admin/orders` — Orders & Processing
- `/admin/payments` — Payment Verification
- `/admin/customers` — Customer Directory
- `/admin/promotions` — Promo Banners
- `/admin/vouchers` — Voucher Code Engine
- `/admin/bulk-orders` — Custom Requests & Quotation Builder
- `/admin/shipments` — Courier & Shipping Management
- `/admin/reports` — Sales & Financial Reports
- `/admin/settings` — Store Settings
- `/admin/staff` — Staff Management & Roles
- `/admin/audit-logs` — System Audit Logs

---

# 14. ACCEPTANCE CRITERIA
- **Storefront:** Search, filter, product detail, and responsive Gramedia-styled design fully working.
- **Checkout & Payments:** Validated form, authoritative server calculation, stock check, pending manual payments, verified webhook transitions.
- **Admin:** Product CRUD, inventory tracking, order workflow, quotation builder, reports with CSV export.
- **Security:** RLS tested, private files secured, no leaked secrets.
- **Quality:** Clean build, zero console crashes, functional navigation, accessible touch targets.

---

# 15. ROADMAP
- **Phase 1:** Inspection, Architecture Setup, Design System Integration.
- **Phase 2:** Core Frontend (Storefront, Header, Footer, Hero, Catalog, PDP).
- **Phase 3:** Shopping Flow (Cart, Checkout, Guest & Auth, Order Confirmation).
- **Phase 4:** Admin Backoffice (Dashboard, Products, Inventory, Orders, Payments, Quotations).
- **Phase 5:** Backend & Integrations (Supabase schema, RLS, Storage, Payment & Shipping helpers).
- **Phase 6:** Quality Assurance, Responsive Polish & Build Verification.
