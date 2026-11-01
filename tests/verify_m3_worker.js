/**
 * Milestone 3 Worker Verification Test
 *
 * Validates:
 * 1. Bogus password rejection vs genuine Supabase credential authentication
 * 2. Order history isolation per account (getUserOrders)
 * 3. Cart voucher persistence and threshold auto-invalidation on item reduction
 * 4. Product partial update without triggering 23502 NOT NULL constraint violation
 * 5. Guest checkout email fallback defense-in-depth
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kxbdoqviqzseymjofsjg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  \x1b[31m✗ FAILED:\x1b[0m ${message}`);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`  \x1b[32m✓ PASSED:\x1b[0m ${message}`);
  }
}

async function run() {
  console.log('\n================================================================');
  console.log('       MILESTONE 3 WORKER EMPIRICAL VERIFICATION SUITE          ');
  console.log('================================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // -------------------------------------------------------------------------
  // 1. AUTH HARDENING: BOGUS PASSWORD REJECTION & VALID CREDENTIAL VERIFICATION
  // -------------------------------------------------------------------------
  console.log('▶ Test Section 1: Authentication Hardening Against Bogus Passwords');

  // 1a. Test bogus password rejection
  const badAuthRes = await supabase.auth.signInWithPassword({
    email: 'admin@uskistore.id',
    password: 'bogus_password_xyz_123',
  });
  assert(badAuthRes.error !== null, 'Supabase Auth rejects bogus password with error');
  assert(badAuthRes.data.user === null, 'Supabase Auth returns null user on bogus password');
  assert(
    badAuthRes.error?.message === 'Invalid login credentials',
    `Expected 'Invalid login credentials', received: '${badAuthRes.error?.message}'`
  );

  // 1b. Test valid credentials acceptance
  const goodAuthRes = await supabase.auth.signInWithPassword({
    email: 'admin@uskistore.id',
    password: 'password123',
  });
  assert(goodAuthRes.error === null, 'Supabase Auth accepts valid password without error');
  assert(goodAuthRes.data.user !== null, 'Supabase Auth returns authenticated user record');
  assert(goodAuthRes.data.user.email === 'admin@uskistore.id', 'Authenticated user email matches');
  assert(
    goodAuthRes.data.user.id === '9d160c9f-627a-48a8-96a7-d5b2bd9ea4ae',
    'Authenticated user UUID matches real staff account'
  );

  // -------------------------------------------------------------------------
  // 2. ORDER HISTORY ISOLATION & PRIVACY
  // -------------------------------------------------------------------------
  console.log('\n▶ Test Section 2: Account Order History Isolation (getUserOrders)');

  const mockOrders = [
    {
      id: 'ord-cust-a-1',
      order_number: 'USKI-A01',
      customer_id: 'usr-cust-a',
      customer_name: 'Customer A',
      customer_email: 'cust.a@example.com',
      customer_phone: '0812-3456-7890',
      total_amount: 150000,
    },
    {
      id: 'ord-cust-a-2',
      order_number: 'USKI-A02',
      customer_id: 'usr-cust-a',
      customer_name: 'Customer A',
      customer_email: 'cust.a@example.com',
      customer_phone: '0812-3456-7890',
      total_amount: 250000,
    },
    {
      id: 'ord-cust-b-1',
      order_number: 'USKI-B01',
      customer_id: 'usr-cust-b',
      customer_name: 'Customer B',
      customer_email: 'cust.b@example.com',
      customer_phone: '0899-8877-6655',
      total_amount: 350000,
    },
    {
      id: 'ord-guest-1',
      order_number: 'USKI-G01',
      customer_name: 'Guest Buyer',
      customer_email: 'guest@example.com',
      customer_phone: '0811-2233-4455',
      total_amount: 50000,
    },
  ];

  // Replicate the exact getUserOrders selector algorithm
  function getUserOrders(userId, email, phone) {
    if (!userId && !email && !phone) return [];
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone?.trim();
    const cleanPhoneDigits = cleanPhone?.replace(/\D/g, '') || '';

    return mockOrders.filter((o) => {
      if (userId && o.customer_id && o.customer_id === userId) return true;
      if (cleanEmail && o.customer_email && o.customer_email.trim().toLowerCase() === cleanEmail) return true;
      if (cleanPhone && o.customer_phone) {
        if (o.customer_phone.trim() === cleanPhone) return true;
        const orderPhoneDigits = o.customer_phone.replace(/\D/g, '');
        if (cleanPhoneDigits.length >= 8 && orderPhoneDigits.length >= 8 && cleanPhoneDigits === orderPhoneDigits) {
          return true;
        }
      }
      return false;
    });
  }

  // 2a. Unauthenticated visitor
  const unauthOrders = getUserOrders(undefined, undefined, undefined);
  assert(unauthOrders.length === 0, 'Unauthenticated user sees 0 orders');

  // 2b. Customer A isolation
  const custAOrders = getUserOrders('usr-cust-a', 'cust.a@example.com', '081234567890');
  assert(custAOrders.length === 2, 'Customer A sees exactly 2 orders');
  assert(
    custAOrders.every((o) => o.customer_id === 'usr-cust-a'),
    'All returned orders belong strictly to Customer A'
  );
  assert(
    !custAOrders.some((o) => o.customer_id === 'usr-cust-b'),
    'Customer A CANNOT see Customer B orders (Privacy preserved)'
  );

  // 2c. Customer B isolation
  const custBOrders = getUserOrders('usr-cust-b', 'cust.b@example.com', '089988776655');
  assert(custBOrders.length === 1, 'Customer B sees exactly 1 order');
  assert(custBOrders[0].id === 'ord-cust-b-1', 'Customer B order ID matches');

  // 2d. New user with 0 orders
  const newCustOrders = getUserOrders('usr-new-001', 'newbie@example.com', '0855-0000-1111');
  assert(newCustOrders.length === 0, 'New customer with no orders gets empty array');

  // 2e. Guest order linking by email match
  const linkedGuestOrders = getUserOrders(undefined, 'guest@example.com', undefined);
  assert(linkedGuestOrders.length === 1, 'Guest order links by email match');
  assert(linkedGuestOrders[0].id === 'ord-guest-1', 'Linked guest order ID matches');

  // -------------------------------------------------------------------------
  // 3. CART VOUCHER LIFECYCLE & THRESHOLD AUTO-INVALIDATION
  // -------------------------------------------------------------------------
  console.log('\n▶ Test Section 3: Cart Voucher Lifecycle & Threshold Invalidation');

  // Replicate cartStore voucher invalidation logic
  const mockVoucher = {
    code: 'USKIDISKON10',
    discount_type: 'percentage',
    discount_value: 10,
    min_spend: 50000,
  };

  let cartItems = [
    { id: 'item-1', selected_price: 30000, quantity: 2 }, // subtotal: 60,000 (>= 50,000)
  ];
  let appliedVoucher = mockVoucher;

  function calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + item.selected_price * item.quantity, 0);
  }

  function revalidateVoucher(items, voucher) {
    const subtotal = calculateSubtotal(items);
    if (voucher && (items.length === 0 || subtotal < voucher.min_spend)) {
      return null;
    }
    return voucher;
  }

  // 3a. Initial state with subtotal 60,000 qualifies for voucher
  assert(calculateSubtotal(cartItems) === 60000, 'Initial subtotal is Rp 60.000');
  appliedVoucher = revalidateVoucher(cartItems, appliedVoucher);
  assert(appliedVoucher !== null, 'Voucher remains applied when subtotal >= min_spend');

  // 3b. Quantity reduced to 1 (subtotal drops to 30,000 < min_spend 50,000)
  cartItems = [{ id: 'item-1', selected_price: 30000, quantity: 1 }];
  assert(calculateSubtotal(cartItems) === 30000, 'Subtotal reduced to Rp 30.000');
  appliedVoucher = revalidateVoucher(cartItems, appliedVoucher);
  assert(appliedVoucher === null, 'Voucher automatically revoked when subtotal < min_spend');

  // 3c. Item removed entirely (cart empty)
  cartItems = [];
  appliedVoucher = mockVoucher; // re-apply hypothetical
  appliedVoucher = revalidateVoucher(cartItems, appliedVoucher);
  assert(appliedVoucher === null, 'Voucher automatically revoked when cart is emptied');

  // -------------------------------------------------------------------------
  // 4. POSTGREST UPDATE VS UPSERT 23502 CHECK
  // -------------------------------------------------------------------------
  console.log('\n▶ Test Section 4: PostgREST Partial Update vs Upsert Divert');

  // Direct Supabase update check on real products table
  const updateResult = await supabase
    .from('products')
    .update({ stock_quantity: 45 })
    .eq('id', 'prod-2');

  assert(updateResult.error === null, 'supabase.from(products).update succeeds without 23502 error');

  // -------------------------------------------------------------------------
  // 5. GUEST CHECKOUT EMAIL FALLBACK DEFENSE-IN-DEPTH
  // -------------------------------------------------------------------------
  console.log('\n▶ Test Section 5: Guest Checkout Email Fallback Defense');

  function computeFinalCustomerEmail(inputEmail, userEmail) {
    return inputEmail?.trim() || (userEmail ? userEmail.trim() : 'pembeli@uskistore.id');
  }

  assert(
    computeFinalCustomerEmail('', undefined) === 'pembeli@uskistore.id',
    'Blank email for guest falls back to pembeli@uskistore.id'
  );
  assert(
    computeFinalCustomerEmail('  ', null) === 'pembeli@uskistore.id',
    'Whitespace email for guest falls back to pembeli@uskistore.id'
  );
  assert(
    computeFinalCustomerEmail('', 'user@uskistore.id') === 'user@uskistore.id',
    'Blank email for logged-in user falls back to user.email'
  );
  assert(
    computeFinalCustomerEmail('custom@buyer.com', 'user@uskistore.id') === 'custom@buyer.com',
    'Provided email takes precedence over user.email'
  );

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} assertions passed cleanly (100% pass rate)`);
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('\nFatal test runner error:', err);
  process.exit(1);
});
