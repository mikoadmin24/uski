# Project: USKI STORE Audit & Overhaul

## Architecture
USKI STORE is a full-stack e-commerce web application with a public retail storefront, courier delivery portal, and an administrative back-office.
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, Zustand (8 stores), React Router.
- Backend & Database: Supabase (PostgreSQL 15), Supabase Storage, PostgREST APIs, Supabase Auth.
- Public Storefront: Home, Catalog, Product Detail, Cart, Checkout, Order Tracking, Payment Confirmation, Custom Bulk Orders.
- Courier Portal: `/courier` (mobile-first UI for store couriers with live delivery task, Geolocation, camera proof upload, and digital signature canvas).
- Admin Back-Office: Dashboard, Orders (`/admin/orders`), Products, Categories, Couriers (`/admin/couriers`), Promo Vouchers, Bulk Orders, Reports & Financials (`/admin/reports`), Settings.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Supabase Master Schema & Constraint Alignment | Update PostgreSQL schema with missing tables (`order_items`, `bulk_orders`, `payment_confirmations`, `delivery_proofs`), add missing columns (`orders.courier_id`, `orders.delivery_proof_url`, `orders.delivery_signature_url`, `orders.voucher_code`, `vouchers.target_audience`, `products.specifications`), relax courier status constraint to accept `'available'`, set permissive RLS policies. | M1 | Spec Miner |
| F2 | Storage Bucket 'delivery-proofs' Setup | Ensure bucket `delivery-proofs` exists on Supabase Storage with public read and authenticated/anon upload policies. | M1 | Spec Miner & Explorer 2 |
| F3 | Active Database Live Ping Diagnostics | Replace static env string check in `isSupabaseConfigured` with active `dbService.ping()` returning live connection state to UI badges. | M1 | Explorer 1 |
| F4 | Zustand Order Store Live Integration | Connect `orderStore` directly to `orders` and `order_items`, remove `mockOrders` fallback and `missingMocks` re-injection loop. | M2 | Explorer 1 |
| F5 | Zustand Product & Category Store Live Integration | Connect `productStore` and `categoryStore` directly to Supabase, remove `mockProducts` fallback and mock movements. | M2 | Explorer 1 |
| F6 | Zustand Promo Store Live Integration | Connect `promoStore` directly to `vouchers`, remove `mockVouchers` fallback and `missingMocks` loop. | M2 | Explorer 1 |
| F7 | Zustand Custom Bulk Order Store Live Integration | Connect `customOrderStore` directly to Supabase table `bulk_orders`, remove `mockCustomRequests` local fallback. | M2 | Explorer 1 |
| F8 | Zero Dummy Data Store-level Cleanup | Remove static dummy imports and fallbacks in `src/data/mockData.ts` across operational stores. | M2 | Explorer 1 |
| F9 | Real-Time Courier Assignment Sync | Update `assignDelivery` and `reassignDelivery` in `courierStore` to persist changes to `couriers` and `orders` in Supabase; update `AdminOrders` and `AdminCouriers` to read and write live data. | M3 | Explorer 2 |
| F10 | Eliminate Fake GPS & Telemetry Code | Remove `advanceSimulation`, hardcoded depot coordinates, simulated battery/breadcrumbs, and satellite telemetry wording from `courierStore`, `OrderTrackingPage`, `AdminOrders`, and `CourierPortalPage`. | M3 | Explorer 2 |
| F11 | Proof Photos & Signatures Storage & Persistence | Convert digital signature canvas DataURL to file, upload proof photo and signature to Supabase Storage bucket `delivery-proofs`, save URLs to `orders` and `delivery_proofs` table in `completeDelivery`. | M3 | Explorer 2 |
| F12 | Live Delivery Audit History | Replace hardcoded `allDeliveryRecords` in `AdminCouriers.tsx` with dynamic delivery records queried from Supabase. | M3 | Explorer 2 |
| F13 | Admin Reports & Analytics Live Aggregation | Replace hardcoded `chartDatasets` in `AdminReports.tsx` with live aggregations from Supabase `orders`. | M4 | Explorer 1 |
| F14 | Single Modal Popups Responsiveness | Audit and verify all modal dialogs (Order Details, Payment Verification, Courier Assignment, Courier Proof, Voucher Form) for smooth single-modal behavior on desktop and mobile. | M4 | ORIGINAL_REQUEST R3 |
| F15 | Mobile Storefront & Admin Responsiveness | Ensure full responsiveness on mobile screens (including `http://192.168.18.11:3000/`) with no layout overflow or broken controls. | M4 | ORIGINAL_REQUEST R3 |
| F16 | Production Build Integrity | Ensure `npm run build` completes with exit code 0 and zero TypeScript or linting errors. | M4 | ORIGINAL_REQUEST R3 |
| F17 | End-to-End Verification (Tiers 1-4) | Validate complete system against opaque-box test suite across all user and operational flows. | M5 | E2E Testing Track |
| F18 | Adversarial Coverage Hardening (Tier 5) | Stress-test edge cases, broken foreign keys, concurrent assignments, and offline fallback integrity. | M5 | Challenger Track |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema Alignment & Supabase Client Validation | Apply master SQL migration (tables `order_items`, `bulk_orders`, `payment_confirmations`, `delivery_proofs`, missing columns, constraint fix, storage bucket `delivery-proofs`, active ping diagnostics). | none | DONE |
| M2 | Zustand Stores Real Supabase Integration & Zero Dummy Removal | Eliminate mock data in `orderStore`, `productStore`, `categoryStore`, `promoStore`, `customOrderStore`; bind to Supabase live tables. | M1 | DONE |
| M3 | Courier Flow, Storage Bucket & Fake Telemetry Cleanup | Real-time courier assignment sync, remove `advanceSimulation` & fake coordinates, upload proof photos & signatures to `delivery-proofs`, live delivery audit history. | M1, M2 | DONE |
| M5 | Final E2E Test Suite Pass & Adversarial Hardening | Pass 100% of Tiers 1-4 E2E test cases, run Tier 5 adversarial stress testing. | M1, M2, M3, M4, TEST_READY | DONE |

## Interface Contracts
### Courier Store ↔ Supabase
- `assignDelivery(courierId: string, orderId: string)`:
  - Updates `couriers` table: `status = 'delivering'`, `active_delivery = orderId`.
  - Updates `orders` table: `courier_id = courierId`, `order_status = 'shipped'`.
- `completeDelivery(courierId: string, orderId: string, proofPhotoUrl: string, proofSignatureUrl: string, recipientName: string, notes: string)`:
  - Updates `couriers` table: `status = 'available'`, `active_delivery = null`.
  - Updates `orders` table: `order_status = 'delivered'`, `delivery_proof_url = proofPhotoUrl`, `delivery_signature_url = proofSignatureUrl`, `delivery_recipient_name = recipientName`, `delivered_at = NOW()`.
  - Inserts row into `delivery_proofs` table.

### Public Storefront ↔ Supabase
- Checkout submits order directly to `orders` (with `order_items`).
- Public order tracking queries `orders` by `id` or `order_number` and reads assigned `courier_id` without dummy fallback.

### Storage Bucket: `delivery-proofs`
- Path convention: `proofs/${orderId}_photo_${Date.now()}.${ext}`
- Path convention: `signatures/${orderId}_sig_${Date.now()}.png`

## Code Layout
- `src/lib/supabase.ts`: Supabase client initialization, configuration checks, active ping.
- `src/services/dbService.ts`: Centralized PostgREST API wrapper functions for all entities.
- `src/store/`: Zustand stores (`orderStore.ts`, `productStore.ts`, `courierStore.ts`, `promoStore.ts`, `categoryStore.ts`, `customOrderStore.ts`).
- `src/pages/admin/`: Admin views (`AdminOrders.tsx`, `AdminCouriers.tsx`, `AdminReports.tsx`, `AdminProducts.tsx`, etc.).
- `src/pages/`: Public pages (`CourierPortalPage.tsx`, `OrderTrackingPage.tsx`, `OrderConfirmationPage.tsx`, etc.).
- `supabase/`: SQL migration files (`supabase_master_migration.sql`).
- `tests/e2e/`: Opaque-box E2E test suites (Tiers 1-4).
