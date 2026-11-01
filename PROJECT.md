# Project: USKI STORE Online Store Perfection & Error-Free Production Readiness

## Architecture
- **Framework & Bundler**: React 18.3.1 with Vite 6.4.5 and TypeScript 5.6.3
- **Styling**: Tailwind CSS 3.4.14 with PostCSS and Autoprefixer
- **Routing**: React Router DOM 6.27.0 with layout routing (`StorefrontLayout` and `AdminLayout`)
- **State Management**: Zustand 5.0.0 stores with localStorage persistence:
  - `useProductStore`: products, categories, inventoryMovements
  - `useCartStore`: shopping cart items, voucher, subtotal, discount, shipping fee, total
  - `useOrderStore`: orders history, order creation, Supabase sync
  - `useAuthStore`: current user session, role-based access control
- **Backend & Database**: Supabase PostgreSQL 15 (`https://kxbdoqviqzseymjofsjg.supabase.co`) with PostgREST client, Realtime channel (`public:live_sync`), and Supabase Storage (`product-images`).
- **Data Flow**:
  1. Client loads cached data from `localStorage` on boot.
  2. `useSupabaseSync` connects to Supabase Cloud, revalidates cache, and subscribes to realtime updates.
  3. Store owner manages products and stock via `/admin/products`.
  4. Customer browses catalog, adds to cart, and checks out.
  5. Checkout decrements inventory, creates order in Supabase and localStorage, and formats WhatsApp direct order dispatch.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Production Build & Typecheck Zero-Error | Ensure `npm run build` and `npm run typecheck` pass cleanly with exit code 0 | M1 | survey (R1) |
| 2 | Runtime Crash Hazard Protection | Guard nullable ratings (`toFixed(1)`) and nullable images (`images[0]`, `.length`) against null-pointer exceptions | M1 | survey (R1) |
| 3 | Safe User Header & Navbar Display | Guard `user.full_name` against undefined split errors in navbar | M1 | survey (R1) |
| 4 | Complete Policy Pages & Link Integrity | Add `privacy` and `terms` handling to `StaticPolicyPage.tsx` and eliminate broken links | M1 | survey (R1) |
| 5 | Clean Dead Code & Unused Imports | Remove ~94 unused imports and variables across UI pages and components | M1 | survey (R1) |
| 6 | Code Splitting & Vendor Chunk Optimization | Configure `manualChunks` in `vite.config.ts` to eliminate >500kB monolithic chunk warning | M1 | survey (R1) |
| 7 | Account & Courier Route Fix | Resolve courier redirect loop in `AccountPage.tsx` and dead links in bulk order views | M1 | survey (R1) |
| 8 | Case-Insensitive Product Slug Lookup | Normalize product slug lookup with `.toLowerCase()` in `productStore.ts` | M1 | survey (R1) |
| 9 | Store LocalStorage Hydration Fix | Eliminate artificial `mockIds` filter in `productStore.ts` and `categoryStore.ts` to prevent flash of empty state | M2 | survey (R2) |
| 10 | Homepage Badges & Admin Integration | Add `is_featured`, `is_best_seller`, and `is_new_arrival` toggles to `AdminProducts.tsx` and connect to `HomePage.tsx` carousels | M2 | survey (R2) |
| 11 | Dynamic Brand Filtering in Catalog | Replace static `mockBrands` in `CatalogPage.tsx` with dynamic brands extracted from active real products | M2 | survey (R2) |
| 12 | Complete Dummy Data Removal | Remove unreferenced mock data arrays (`mockPublishers`, `mockBrands`) and ensure only real products display | M2 | survey (R2) |
| 13 | Store Owner Real Product CRUD Interface | Verify and harden the existing `/admin/products` interface for real product creation, editing, WebP image upload, and stock tracking | M2 | survey (R2) |
| 14 | Cart Voucher Persistence & Threshold Invalidation | Persist `appliedVoucher` in localStorage and automatically invalidate voucher if cart subtotal drops below `min_spend` | M3 | survey (R3) |
| 15 | Checkout Guest Email Fallback | Provide safe fallback for `customer_email` in checkout payload to prevent Supabase NOT NULL constraint errors | M3 | survey (R3) |
| 16 | Direct Order Flow & Transaction Readiness | Ensure end-to-end purchasing journey (cart -> shipping calculation -> payment selection -> WhatsApp dispatch -> Supabase order record) is robust and ready for live sales | M3 | survey (R3) |
| 17 | Comprehensive E2E Test Suite Validation | Run and pass 100% of all 51 automated E2E tests across Tiers 1-4 | M3 | survey (R1, R3) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Technical Audit, Error Hardening & Build Optimization | Fix runtime crash vectors (.toFixed(1), images array lookups, user.full_name), add missing policy page handlers (privacy, terms), fix courier redirect loop, clean unused imports, optimize Vite chunks | none | DONE |
| M2 | Real Product Management & Dummy Data Elimination | Fix mockIds cache purge bug in productStore/categoryStore, add badge controls (featured, best seller, new arrival) to AdminProducts, connect carousels on HomePage, replace mockBrands with dynamic product brands, remove remaining dummy arrays | M1 | IN_PROGRESS |
| M3 | Direct Sales Checkout Flow & End-to-End Validation | Persist applied voucher in cartStore with min_spend revalidation, safe customer_email fallback on checkout, verify full transaction and order lifecycle, execute full E2E test suite (51/51 tests) | M2 | PLANNED |

## Interface Contracts
### `productStore` ↔ `AdminProducts` & `HomePage`
- `Product` fields:
  ```typescript
  is_featured: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  ```
- `AdminProducts` modal must support toggling these fields and persisting them via `upsertProduct`.
- `HomePage` must filter products by these flags or fall back to recent products if none are tagged.

### `cartStore` ↔ `CheckoutPage`
- `appliedVoucher`: `Voucher | null` (persisted to localStorage).
- `getDiscount()`: calculated based on subtotal and voucher rules.
- `updateQuantity(id, qty)` / `removeItem(id)`: if `subtotal < appliedVoucher.min_spend`, automatically clear `appliedVoucher`.

### `CheckoutPage` ↔ `dbService.orders.create`
- Mandatory fields sent to Supabase `orders` table:
  ```typescript
  customer_name: string;
  customer_phone: string;
  customer_email: string; // must NOT be empty or undefined (defaults to 'pembeli@uskistore.id' if omitted)
  shipping_address: Address;
  items: OrderItem[];
  payment_method: string;
  total_amount: number;
  status: 'pending';
  payment_status: 'unpaid' | 'paid';
  ```

## Code Layout
- `src/components/common/`: Shared UI components (`Navbar.tsx`, `Footer.tsx`, `ProductCard.tsx`, `ProductSection.tsx`)
- `src/pages/`: Public storefront pages (`HomePage.tsx`, `CatalogPage.tsx`, `ProductDetailPage.tsx`, `CartPage.tsx`, `CheckoutPage.tsx`, `OrderConfirmationPage.tsx`, `StaticPolicyPage.tsx`, `AccountPage.tsx`)
- `src/pages/admin/`: Store owner back-office interfaces (`AdminProducts.tsx`, `AdminOrders.tsx`, `AdminCategories.tsx`, `AdminDashboard.tsx`, etc.)
- `src/store/`: Zustand state management stores (`productStore.ts`, `cartStore.ts`, `orderStore.ts`, `categoryStore.ts`, `authStore.ts`)
- `src/services/`: Database and Supabase service clients (`dbService.ts`, `supabase.ts`)
- `tests/e2e/`: Automated test suite (`runner.js`, `tier1-feature-coverage.js`, `tier2-boundaries.js`, `tier3-combinations.js`, `tier4-real-world.js`)
