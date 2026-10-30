# TEST INFRASTRUCTURE SPECIFICATION: USKI STORE E2E TEST SUITE

## 1. Overview & Testing Philosophy

USKI STORE's end-to-end (E2E) test suite is designed as an **opaque-box, requirement-driven verification engine**. In accordance with `ORIGINAL_REQUEST.md` and `PROJECT.md`, the system must operate 100% against the live backend database (Supabase PostgreSQL and Supabase Storage) without relying on synthetic in-memory dummy fallbacks.

### Core Testing Tenets:
1. **Opaque-Box Verification**: Tests interact with the system strictly through public interfaces, API endpoints, and contract schemas, verifying behavior, state transitions, and observable outcomes.
2. **Authoritative Output Derivation**: Expected results are derived directly from the specifications in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and PostgreSQL relational schemas.
3. **Progressive Testability & Graceful Diagnostics**: Tests clearly distinguish between database migration gaps and logic assertions, reporting actionable feedback for any pending migrations.
4. **Zero Test Pollution & Idempotence**: All test artifacts, orders, couriers, and vouchers use identifiable prefixes (`E2E_TEST_`) and undergo automated teardown upon suite completion.
5. **Zero-Dependency Native Execution**: Implemented using modern Node.js native ESM (`node:test`, `node:assert`, native `fetch`, `@supabase/supabase-js`) ensuring fast, deterministic execution without heavy testing bloat.

---

## 2. Environment & Credential Management

The test runner automatically loads configuration from `.env` in the project root:
- `VITE_SUPABASE_URL`: Target Supabase project endpoint (e.g., `https://kxbdoqviqzseymjofsjg.supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: Publishable client key.

The test harness initializes a live Supabase client using `@supabase/supabase-js` and tests connectivity prior to executing the test suites.

---

## 3. Test Hierarchy & Tier Mapping

The E2E suite spans four comprehensive tiers:

```
tests/e2e/
├── runner.js                         # Unified CLI test runner and reporter
├── harness.js                        # Assertions, live client, fixtures, teardown
├── tier1_features/                   # Feature Coverage (>=5 test cases each)
│   ├── products.test.js              # Products (Catalog, CRUD, Stock, Categories)
│   ├── orders.test.js                # Orders (Creation, Status, Proof, Items)
│   ├── couriers.test.js              # Couriers (Assignment, Telemetry, Handover)
│   ├── vouchers.test.js              # Vouchers (Validation, Quota, Audience)
│   ├── bulk_orders.test.js           # Bulk Orders (RFQ, Quotation, Conversion)
│   └── storage.test.js               # Storage Bucket ('delivery-proofs' upload/read)
├── tier2_boundaries/                 # Boundary & Corner Cases
│   └── boundary_corner_cases.test.js # Empty fields, negative prices, enum bounds, SQL/XSS
├── tier3_combinations/               # Cross-Feature Combinations
│   └── cross_feature_combinations.test.js # Pairwise flows (Checkout->Courier->Proof->Audit)
└── tier4_realworld/                  # Real-World End-to-End Scenarios
    └── real_world_scenarios.test.js  # Full retail journey, courier field ops, B2B procurement
```

### Tier 1: Feature Coverage (>=5 test cases per feature)
- **Products**:
  - `TC-P01`: Retrieve active product catalog with valid types, price > 0, and non-negative stock.
  - `TC-P02`: Category filtering matches valid `category_id` and catalog taxonomy.
  - `TC-P03`: Single product retrieval by ID / slug with full specifications and dimensions.
  - `TC-P04`: Upsert / create new product and verify database persistence.
  - `TC-P05`: Update product pricing and stock decrement simulation.
  - `TC-P06`: Product deactivation and soft exclusion from active catalog.
- **Orders**:
  - `TC-O01`: Create retail order with customer details, shipping address, and item list.
  - `TC-O02`: Retrieve order by unique order ID and human-readable `order_number`.
  - `TC-O03`: Transition order status (`awaiting_payment` -> `processing` -> `shipped` -> `delivered`).
  - `TC-O04`: Upload payment proof URL and update payment status to `pending` / `verified`.
  - `TC-O05`: Apply promo voucher discount and verify arithmetic accuracy (`subtotal - discount + shipping = total`).
  - `TC-O06`: Relational order items persistence and integrity.
- **Couriers**:
  - `TC-C01`: Retrieve couriers list with valid statuses and vehicle information.
  - `TC-C02`: Update courier status to `'available'` (validates relaxed status check constraint).
  - `TC-C03`: Assign courier to active order (`courier.status = 'delivering'`, `orders.courier_id` set).
  - `TC-C04`: Update courier live GPS coordinates and timestamp.
  - `TC-C05`: Complete delivery flow with recipient name and proof URLs (`courier.status = 'available'`).
  - `TC-C06`: Reassign delivery between couriers with transfer reason.
- **Vouchers**:
  - `TC-V01`: Fetch active promotional vouchers list.
  - `TC-V02`: Validate voucher code eligibility against minimum spend threshold.
  - `TC-V03`: Calculate percentage discount capped by `max_discount`.
  - `TC-V04`: Calculate fixed nominal discount value.
  - `TC-V05`: Validate target audience rules (`all`, `new_customer`, `vip_member`).
  - `TC-V06`: Track usage quota and reject voucher once limit is reached.
- **Bulk Orders (RFQ / Custom Requests)**:
  - `TC-B01`: Submit custom RFQ with institution name, specifications, quantity, and budget.
  - `TC-B02`: Retrieve bulk order by unique `reference_number`.
  - `TC-B03`: Update bulk order status progression (`pending_review` -> `quote_sent`).
  - `TC-B04`: Create and attach formal quotation with COGS, unit prices, and lead time.
  - `TC-B05`: Customer approval of quotation and conversion readiness.
  - `TC-B06`: Filter bulk procurement requests by status.
- **Storage Bucket (`delivery-proofs`)**:
  - `TC-S01`: Verify bucket existence and public access configuration.
  - `TC-S02`: Upload delivery proof photo blob to `proofs/` path.
  - `TC-S03`: Upload recipient digital signature image blob to `signatures/` path.
  - `TC-S04`: Generate and retrieve public URLs for stored assets.
  - `TC-S05`: Verify public HTTP GET accessibility of stored proofs.

### Tier 2: Boundary & Corner Cases
- `TC-BND01`: Mandatory field validation (reject orders with missing customer name/phone).
- `TC-BND02`: Non-existent entity queries (invalid UUIDs return null or empty dataset, not crashes).
- `TC-BND03`: Zero and negative pricing / quantities handling.
- `TC-BND04`: Courier status boundary validation (reject illegal statuses outside permitted check constraint).
- `TC-BND05`: Exact boundary evaluation for voucher minimum spend (exact spend passes, spend - 1 fails).
- `TC-BND06`: Expired voucher date rejection.
- `TC-BND07`: Special characters, SQL metacharacters, and XSS injection handling in text fields.
- `TC-BND08`: Extreme quantities and arithmetic overflow handling.

### Tier 3: Cross-Feature Combinations (Pairwise State Machines)
- `TC-CMB01`: **Pairwise Flow 1: Complete Order Lifecycle**:
  `Customer Checkout` -> `Admin Order Inspection` -> `Courier Assignment` -> `Driver Delivery Proof` -> `Admin Audit History`.
- `TC-CMB02`: **Pairwise Flow 2: Inventory & Stock Decrement**:
  `Product Catalog Stock` -> `Order Placement` -> `Stock Decrement` -> `Inventory Movement Recording`.
- `TC-CMB03`: **Pairwise Flow 3: Voucher & Payment Accounting**:
  `Voucher Code Application` -> `Order Subtotal & Discount Calculation` -> `Payment Verification` -> `Voucher Quota Decrement`.
- `TC-CMB04`: **Pairwise Flow 4: Institutional RFQ to Order Conversion**:
  `Bulk Order RFQ Submission` -> `Admin Review & Quoting` -> `Customer Approval` -> `Conversion to Order`.
- `TC-CMB05`: **Pairwise Flow 5: Courier Telemetry & Handover Handshake**:
  `Courier Location Update` -> `Active Delivery GPS Sync` -> `Delivery Completion & Recipient Proof Handover`.

### Tier 4: Real-World Scenarios (End-to-End User Journeys)
- `TC-RW01`: **Scenario 1: Complete Public Customer Retail Purchase Journey**:
  Customer visits storefront -> browses books & stationery -> adds items to cart -> applies valid voucher -> checks out -> receives order confirmation number -> uploads manual bank transfer receipt -> admin verifies receipt -> order status updates to processing.
- `TC-RW02`: **Scenario 2: Courier Field Operations Workflow**:
  Courier accesses mobile delivery portal (`/courier`) -> accepts assigned delivery package -> updates live location coordinates along route -> arrives at recipient address -> captures package delivery photo -> collects recipient signature on digital canvas -> submits delivery proof -> order marked delivered -> courier status restored to available.
- `TC-RW03`: **Scenario 3: B2B Institutional Procurement Workflow**:
  Islamic School / Pesantren administrator submits bulk procurement RFQ for 200 Kitabs and 150 Stationery Sets -> Admin reviews specs and issues quotation with COGS, margin, and lead time -> School approves quote -> Order is generated with formal reference number.

---

## 4. Test Harness & Runner Specifications

### Test Harness API (`tests/e2e/harness.js`)
- `describe(title, fn)`: Defines a test suite group.
- `it(title, fn)`: Defines a single test case.
- `beforeAll(fn)`, `afterAll(fn)`: Suite setup and teardown lifecycle hooks.
- `assert(condition, message)`: Truthy assertion.
- `assertEqual(actual, expected, message)`: Strict equality assertion (`===`).
- `assertDeepEqual(actual, expected, message)`: Deep recursive equality assertion.
- `assertMatch(actual, regex, message)`: Regular expression pattern assertion.
- `assertGreaterThanOrEqual(actual, min, message)`: Numeric boundary assertion.
- `assertIn(item, list, message)`: Membership assertion.
- `getSupabaseClient()`: Returns authenticated/anon Supabase client instance.
- `registerTeardown(fn)`: Registers cleanup callback executed at suite termination.
- `fixtures`: Helper methods for generating timestamped test data (`createTestOrder`, `createTestCourier`, `createTestProduct`, `createTestVoucher`, `createTestBulkOrder`).

### Test Runner CLI (`tests/e2e/runner.js`)
Commands:
```bash
# Run the entire E2E test suite (Tiers 1 to 4)
node tests/e2e/runner.js

# Run a specific tier
node tests/e2e/runner.js --tier=1
node tests/e2e/runner.js --tier=2
node tests/e2e/runner.js --tier=3
node tests/e2e/runner.js --tier=4

# Run with verbose assertion logs
node tests/e2e/runner.js --verbose

# Run with fail-fast (bail on first error)
node tests/e2e/runner.js --bail
```

Exit Codes:
- `0`: All tests passed successfully.
- `1`: One or more tests failed.

---

## 5. Test Teardown & Data Sanitization

All created test entities use a deterministic prefix:
- Product SKU: `E2E-SKU-*`
- Order Number: `E2E-ORD-*`
- Courier Plate / ID: `E2E-COUR-*`
- Voucher Code: `E2EVOUCH*`
- Bulk Order Ref: `E2E-RFQ-*`

The test harness maintains an in-memory teardown registry. When a test suite completes (or encounters an error), the `afterAll` hook removes all transient records from the live Supabase tables, ensuring zero residual test data in production databases.
