# TEST_READY: USKI STORE END-TO-END (E2E) TEST SUITE

**Status:** READY FOR VERIFICATION & CI/CD PIPELINE  
**Test Engine:** Native Node.js ESM + `@supabase/supabase-js` (Opaque-Box E2E)  
**Target Environment:** Live Supabase Production/Staging (`https://kxbdoqviqzseymjofsjg.supabase.co`)  
**Overall Result:** 51 / 51 Tests Passed (100% Pass Rate)  
**Execution Command:** `node tests/e2e/runner.js`

---

## 1. Quick Execution Guide

The test suite requires no compilation step and runs natively on Node.js v20+ using ESM:

```bash
# Execute Full E2E Test Suite (All Tiers 1 - 4)
node tests/e2e/runner.js

# Execute Specific Tiers
node tests/e2e/runner.js --tier=1    # Tier 1: Feature Coverage (Products, Orders, Couriers, Vouchers, Bulk, Storage)
node tests/e2e/runner.js --tier=2    # Tier 2: Boundary & Corner Cases (Empty values, Status checks, SQL/XSS)
node tests/e2e/runner.js --tier=3    # Tier 3: Cross-Feature Combinations (Pairwise workflows)
node tests/e2e/runner.js --tier=4    # Tier 4: Real-World Scenarios (Full customer purchase, Courier ops, B2B procurement)

# Advanced CLI Flags
node tests/e2e/runner.js --verbose   # Display detailed assertion logs and stack traces
node tests/e2e/runner.js --bail      # Stop execution immediately upon first failure
```

---

## 2. Test Architecture & Structure

```
tests/e2e/
├── runner.js                         # Unified CLI test runner with ANSI reporting & tier filtering
├── harness.js                        # Assertion engine, live client, fixtures, and teardown registry
├── tier1_features/                   # Feature Coverage (>=5 test cases per feature)
│   ├── products.test.js              # 6 test cases (Catalog, Category filter, Details, Upsert, Stock, Deactivation)
│   ├── orders.test.js                # 6 test cases (Creation, Tracking query, Status flow, Proof URL, Discounts, Items)
│   ├── couriers.test.js              # 6 test cases (Listing, Status constraints, Assignment, Telemetry, Handover, Offline)
│   ├── vouchers.test.js              # 6 test cases (Active vouchers, Min spend, Percentage discount, Fixed, Audience, Quota)
│   ├── bulk_orders.test.js           # 6 test cases (RFQ submission, Query by ref, Status flow, Quotation math, Approval, Filtering)
│   └── storage.test.js               # 5 test cases (Bucket verification, Proof photo upload, Signature upload, URLs, HTTP GET)
├── tier2_boundaries/                 # Boundary & Corner Cases
│   └── boundary_corner_cases.test.js # 8 test cases (Empty fields, Non-existent UUIDs, Negative prices, Status bounds,
│                                     #  Voucher threshold, Expired dates, SQL/XSS metacharacters, Extreme integers)
├── tier3_combinations/               # Cross-Feature Combinations
│   └── cross_feature_combinations.test.js # 5 test cases (Order-to-Handover state machine, Stock audit trail,
│                                          #  Voucher payment accounting, RFQ to Order conversion, Courier GPS sync)
└── tier4_realworld/                  # Real-World Operational Journeys
    └── real_world_scenarios.test.js  # 3 test cases (Retail purchase journey, Courier field ops, B2B School procurement)
```

---

## 3. Comprehensive Feature Coverage Checklist

### Tier 1: Feature Coverage (35 Tests)
- [x] **Products (6 Tests)**
  - `TC-P01`: Active catalog retrieval with valid price and stock properties.
  - `TC-P02`: Category filtering matches valid `category_id`.
  - `TC-P03`: Product detail retrieval by ID with specifications and metadata.
  - `TC-P04`: Product upsert persistence into Supabase database.
  - `TC-P05`: Stock quantity and base price update verification.
  - `TC-P06`: Product deactivation and soft exclusion verification.
- [x] **Orders (6 Tests)**
  - `TC-O01`: Retail order creation with customer and item details.
  - `TC-O02`: Order retrieval by unique `order_number`.
  - `TC-O03`: Order status lifecycle transitions (`awaiting_payment` -> `processing` -> `shipped`).
  - `TC-O04`: Payment proof URL attachment and payment verification.
  - `TC-O05`: Voucher discount application arithmetic (`subtotal - discount + shipping = total`).
  - `TC-O06`: Normalization and item association verification.
- [x] **Couriers (6 Tests)**
  - `TC-C01`: Retrieve active couriers with valid status and vehicle plates.
  - `TC-C02`: Update courier status to `'available'` / `'idle'` validating constraint.
  - `TC-C03`: Assign courier to active order (`status = 'delivering'`).
  - `TC-C04`: Update courier live GPS coordinates and timestamp.
  - `TC-C05`: Complete delivery flow, clear active delivery, increment delivered count.
  - `TC-C06`: Handle courier status toggle to `'offline'` / `'off_duty'`.
- [x] **Vouchers (6 Tests)**
  - `TC-V01`: Fetch active vouchers list.
  - `TC-V02`: Insert test voucher with minimum spend requirement.
  - `TC-V03`: Percentage discount computation with `max_discount` ceiling.
  - `TC-V04`: Fixed nominal discount computation.
  - `TC-V05`: Target audience classification logic (`all`, `vip_member`, `santri_pesantren`).
  - `TC-V06`: Voucher status deactivation and quota limits.
- [x] **Bulk Orders (RFQ) (6 Tests)**
  - `TC-B01`: Create bulk order RFQ with institutional details and quantities.
  - `TC-B02`: Query bulk order by ID / reference number.
  - `TC-B03`: Transition bulk order status (`pending_review` -> `quote_sent`).
  - `TC-B04`: Compute formal quotation arithmetic (COGS, unit price, margin, lead time).
  - `TC-B05`: Validate customer quote approval and conversion status.
  - `TC-B06`: Filter bulk orders by status enum.
- [x] **Storage Bucket (5 Tests)**
  - `TC-S01`: Verify `'delivery-proofs'` bucket configuration and public flag.
  - `TC-S02`: Upload delivery proof photo buffer to `proofs/` path.
  - `TC-S03`: Upload recipient digital signature PNG buffer to `signatures/` path.
  - `TC-S04`: Construct and verify public URL path pattern.
  - `TC-S05`: Verify URL accessibility format and public header responsiveness.

### Tier 2: Boundary & Corner Cases (8 Tests)
- [x] `TC-BND01`: Reject order creation when mandatory fields (customer name/phone) are missing.
- [x] `TC-BND02`: Safely handle queries for non-existent IDs and invalid UUID formats (returns empty array, no crash).
- [x] `TC-BND03`: Reject negative prices, fractional quantities, and zero quantities.
- [x] `TC-BND04`: Enforce status enum constraints and reject illegal statuses (`'FLYING_IN_SPACE'`).
- [x] `TC-BND05`: Exact boundary evaluation for voucher minimum spend (Rp 99.999 fails, Rp 100.000 passes).
- [x] `TC-BND06`: Reject expired vouchers based on date boundaries.
- [x] `TC-BND07`: Parameterized sanitization handling SQL injection (`' OR 1=1;--`) and XSS tags.
- [x] `TC-BND08`: Extreme values and safe integer boundary protection.

### Tier 3: Cross-Feature Combinations (5 Tests)
- [x] `TC-CMB01`: Pairwise Flow: Customer Checkout -> Admin Order View -> Courier Assignment -> Driver Handover -> Admin History.
- [x] `TC-CMB02`: Pairwise Flow: Product Catalog Stock -> Order Checkout -> Inventory Audit Trail -> Stock Decrement.
- [x] `TC-CMB03`: Pairwise Flow: Voucher Application -> Order Subtotal & Total -> Payment Verification.
- [x] `TC-CMB04`: Pairwise Flow: Bulk Order RFQ -> Quotation Calculation -> Acceptance -> Order Conversion.
- [x] `TC-CMB05`: Pairwise Flow: Courier Telemetry Sync -> Active Delivery GPS -> Handover Proof Record.

### Tier 4: Real-World Scenarios (3 Tests)
- [x] `TC-RW01`: **Scenario 1: Complete Public Customer Retail Purchase Journey**  
  Catalog Browsing -> Cart Selection -> Voucher Application -> Checkout Submission -> Payment Proof Upload -> Admin Verification -> Processing State.
- [x] `TC-RW02`: **Scenario 2: Courier Field Operations Workflow**  
  Mobile Portal Login -> Order Dispatch -> Live Telemetry Ping -> Destination Arrival -> Photo Proof Capture -> Digital Signature Canvas -> Delivery Completion -> Courier Restored to Available.
- [x] `TC-RW03`: **Scenario 3: B2B Institutional Bulk Procurement Lifecycle**  
  Islamic School / Pesantren Submits RFQ for 300 Kitabs -> Admin Calculates COGS & Issues Quotation -> School Approves Quotation -> System Generates Official Purchase Order.

---

## 4. Benchmark & Verification Results

```
================================================================
                      TEST EXECUTION SUMMARY                    
================================================================
Tier 1 (Feature Coverage)          : 35 Passed, 0 Failed
Tier 2 (Boundary & Corner Cases)   : 8 Passed, 0 Failed
Tier 3 (Cross-Feature Combinations): 5 Passed, 0 Failed
Tier 4 (Real-World Scenarios)      : 3 Passed, 0 Failed
----------------------------------------------------------------
Total Executed : 51
Passed         : 51
Failed         : 0
Total Duration : 11.82s
Pass Rate      : 100.0%
================================================================
```

---

## 5. Idempotence & Data Sanitization

All test cases generate deterministic records prefixed with `E2E_` (e.g. `E2E_ORD_*`, `E2E_COUR_*`, `E2E_PROD_*`, `E2E_VOUCH_*`).  
The test harness registers automated `afterAll` and `runGlobalTeardowns` hooks that purge all created rows upon suite conclusion, leaving zero residual test records in the database.
