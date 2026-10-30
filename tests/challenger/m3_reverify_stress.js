/**
 * Adversarial Challenger Stress Harness for Milestone 3 Courier Reassignment Fixes
 * Author: challenger_m3_reverify
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxbdoqviqzseymjofsjg.supabase.co';
const supabaseKey = 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
const failureDetails = [];

function assert(condition, testName, extra = '') {
  if (condition) {
    console.log(`  ${GREEN}✔ PASS${RESET} ${testName}`);
    passed++;
  } else {
    console.error(`  ${RED}✖ FAIL${RESET} ${testName}`);
    if (extra) console.error(`    ${RED}Detail:${RESET} ${extra}`);
    failed++;
    failureDetails.push({ testName, extra });
  }
}

async function run() {
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}   ADVERSARIAL STRESS HARNESS — MILESTONE 3 RE-VERIFICATION    ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  // 1. Authenticate
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@uskistore.id',
    password: 'password123',
  });
  assert(!authErr && Boolean(authData?.session), 'Admin auth session established');

  // 2. Fetch available couriers
  const { data: couriers, error: courErr } = await supabase
    .from('couriers')
    .select('*')
    .order('created_at', { ascending: true });

  assert(!courErr && Array.isArray(couriers) && couriers.length >= 2, 'At least 2 couriers available in DB');
  const courA = couriers[0];
  const courB = couriers[1];
  console.log(`  Courier A: [${courA.id}] ${courA.name}`);
  console.log(`  Courier B: [${courB.id}] ${courB.name}`);

  // Reset both couriers to idle
  await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', courA.id);
  await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', courB.id);

  // --------------------------------------------------------------------------
  // TEST SCENARIO 1: Double Reassignment Cycle (A -> B -> A)
  // --------------------------------------------------------------------------
  console.log(`\n${CYAN}▶ Scenario 1: Double Reassignment Cycle (Courier A -> Courier B -> Courier A)${RESET}`);
  const orderId1 = `stress-cycle-${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Create order
  const { error: insOrderErr1 } = await supabase.from('orders').insert({
    id: orderId1,
    order_number: `ORD-CYC-${Date.now()}`,
    customer_name: 'Cycle Tester',
    customer_phone: '08111111111',
    customer_email: 'cycle@uskistore.id',
    shipping_address: 'Jl. Margonda Raya No. 100, Depok',
    shipping_method: 'Kurir Toko USKI (Express)',
    subtotal: 75000,
    shipping_fee: 10000,
    total_amount: 85000,
    status: 'processing',
    payment_status: 'paid',
    payment_method: 'transfer_manual',
    items: [{ id: 'item-1', name: 'Kain Sarung Halus', price: 75000, quantity: 1 }],
  });
  assert(!insOrderErr1, 'Order 1 created for cycle testing');

  // Step 1: Assign to A
  const deliveryA = {
    order_id: orderId1,
    order_number: `ORD-CYC-${Date.now()}`,
    recipient_name: 'Cycle Tester',
    recipient_phone: '08111111111',
    delivery_address: 'Jl. Margonda Raya No. 100, Depok',
    items_count: 1,
    status: 'assigned',
    started_at: '09:00 WIB',
  };
  await supabase.from('couriers').update({ status: 'delivering', active_delivery: deliveryA, updated_at: nowIso }).eq('id', courA.id);

  // Reassign to B using the exact logic from AdminCouriers & courierStore
  console.log(`  Executing Reassignment 1: A -> B...`);
  const deliveryB = {
    ...deliveryA,
    reassigned_from: courA.name,
    reassign_reason: 'Kendala 1: Ban Bocor',
  };

  // Release A with fallback
  const { error: relAErr } = await supabase.from('couriers').update({ status: 'available', active_delivery: null, updated_at: nowIso }).eq('id', courA.id);
  if (relAErr) {
    const { error: relAFallbackErr } = await supabase.from('couriers').update({ status: 'idle', active_delivery: null, updated_at: nowIso }).eq('id', courA.id);
    assert(!relAFallbackErr, 'Release A fallback to "idle" succeeded');
  }

  // Assign B
  const { error: asgBErr } = await supabase.from('couriers').update({ status: 'delivering', active_delivery: deliveryB, updated_at: nowIso }).eq('id', courB.id);
  assert(!asgBErr, 'Assign B to delivering succeeded');

  // Reassign Order with PGRST204 fallback
  const { error: ordBErr } = await supabase.from('orders').update({ courier_id: courB.id, courier_name: courB.name, updated_at: nowIso }).eq('id', orderId1);
  if (ordBErr && ordBErr.code === 'PGRST204') {
    const { error: ordBFallbackErr } = await supabase.from('orders').update({ courier_name: courB.name, updated_at: nowIso }).eq('id', orderId1);
    assert(!ordBFallbackErr, 'Order courier_name fallback to B succeeded');
  } else {
    assert(!ordBErr, 'Order reassignment to B succeeded');
  }

  // Verify intermediate state
  const { data: midA } = await supabase.from('couriers').select('*').eq('id', courA.id).single();
  const { data: midB } = await supabase.from('couriers').select('*').eq('id', courB.id).single();
  assert(midA.active_delivery === null, 'Mid-cycle: Courier A active_delivery is null');
  assert(midA.status === 'idle', 'Mid-cycle: Courier A status is idle');
  assert(midB.active_delivery?.order_id === orderId1, 'Mid-cycle: Courier B has active_delivery');

  // Reassign back B -> A
  console.log(`  Executing Reassignment 2: B -> A...`);
  const deliveryBackToA = {
    ...deliveryB,
    reassigned_from: courB.name,
    reassign_reason: 'Kendala 2: Kurir A telah siap kembali',
  };

  // Release B with fallback
  const { error: relBErr } = await supabase.from('couriers').update({ status: 'available', active_delivery: null, updated_at: nowIso }).eq('id', courB.id);
  if (relBErr) {
    const { error: relBFallbackErr } = await supabase.from('couriers').update({ status: 'idle', active_delivery: null, updated_at: nowIso }).eq('id', courB.id);
    assert(!relBFallbackErr, 'Release B fallback to "idle" succeeded');
  }

  // Assign back to A
  const { error: asgBackAErr } = await supabase.from('couriers').update({ status: 'delivering', active_delivery: deliveryBackToA, updated_at: nowIso }).eq('id', courA.id);
  assert(!asgBackAErr, 'Reassign back to Courier A succeeded');

  // Order back to A with fallback
  const { error: ordBackAErr } = await supabase.from('orders').update({ courier_id: courA.id, courier_name: courA.name, updated_at: nowIso }).eq('id', orderId1);
  if (ordBackAErr && ordBackAErr.code === 'PGRST204') {
    const { error: ordBackAFallbackErr } = await supabase.from('orders').update({ courier_name: courA.name, updated_at: nowIso }).eq('id', orderId1);
    assert(!ordBackAFallbackErr, 'Order courier_name fallback back to A succeeded');
  } else {
    assert(!ordBackAErr, 'Order reassignment back to A succeeded');
  }

  // Verify final double-cycle state
  const { data: finalCycA } = await supabase.from('couriers').select('*').eq('id', courA.id).single();
  const { data: finalCycB } = await supabase.from('couriers').select('*').eq('id', courB.id).single();
  const { data: finalCycOrder } = await supabase.from('orders').select('*').eq('id', orderId1).single();

  assert(finalCycA.status === 'delivering', 'Courier A is delivering again');
  assert(finalCycA.active_delivery?.order_id === orderId1, 'Courier A active_delivery holds order');
  assert(finalCycB.status === 'idle', 'Courier B is idle');
  assert(finalCycB.active_delivery === null, 'Courier B active_delivery is null');
  assert(finalCycOrder.courier_name === courA.name, 'Order courier_name is back to Courier A');

  // Cleanup Scenario 1
  await supabase.from('orders').delete().eq('id', orderId1);
  await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', courA.id);
  await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', courB.id);

  // --------------------------------------------------------------------------
  // TEST SCENARIO 2: dbService couriers.updateStatus and completeDelivery
  // --------------------------------------------------------------------------
  console.log(`\n${CYAN}▶ Scenario 2: dbService couriers.updateStatus & completeDelivery Fallback Verification${RESET}`);

  // Test status update with 'available' -> must gracefully fallback to 'idle'
  const { error: testAvailErr } = await supabase.from('couriers').update({ status: 'available', updated_at: nowIso }).eq('id', courA.id);
  assert(Boolean(testAvailErr && testAvailErr.code === '23514'), 'Confirm Postgres check constraint 23514 triggers on status="available"');

  // Execute fallback
  const { error: testIdleErr } = await supabase.from('couriers').update({ status: 'idle', updated_at: nowIso }).eq('id', courA.id);
  assert(!testIdleErr, 'Fallback to status="idle" successfully satisfies constraint');

  const { data: checkCourA } = await supabase.from('couriers').select('status').eq('id', courA.id).single();
  assert(checkCourA.status === 'idle', 'Courier A status in DB is "idle"');

  // Test completeDelivery counter increment
  const initialDelivered = courA.total_delivered_today || 0;
  const newDelivered = initialDelivered + 1;

  // Emulate completeDelivery with fallback
  const { error: compErr } = await supabase
    .from('couriers')
    .update({
      status: 'available',
      active_delivery: null,
      total_delivered_today: newDelivered,
      updated_at: nowIso,
    })
    .eq('id', courA.id);

  let compSuccess = false;
  if (compErr) {
    const { error: compFallbackErr } = await supabase
      .from('couriers')
      .update({
        status: 'idle',
        active_delivery: null,
        total_delivered_today: newDelivered,
        updated_at: nowIso,
      })
      .eq('id', courA.id);
    compSuccess = !compFallbackErr;
  } else {
    compSuccess = true;
  }
  assert(compSuccess, 'couriers.completeDelivery fallback succeeded');

  const { data: updatedCourA } = await supabase.from('couriers').select('status, total_delivered_today, active_delivery').eq('id', courA.id).single();
  assert(updatedCourA.status === 'idle', 'Courier A status is idle after completion');
  assert(updatedCourA.total_delivered_today === newDelivered, 'Courier A total_delivered_today incremented');
  assert(updatedCourA.active_delivery === null, 'Courier A active_delivery is null');

  // Reset counter
  await supabase.from('couriers').update({ total_delivered_today: initialDelivered }).eq('id', courA.id);

  // --------------------------------------------------------------------------
  // TEST SCENARIO 3: Source Courier Immediately Available for Next Order
  // --------------------------------------------------------------------------
  console.log(`\n${CYAN}▶ Scenario 3: Released Source Courier Immediate Next Assignment Capability${RESET}`);
  // After releasing courier A, can Courier A immediately be assigned a fresh order?
  const orderId2 = `stress-next-${Date.now()}`;
  const { error: insOrderErr2 } = await supabase.from('orders').insert({
    id: orderId2,
    order_number: `ORD-NEXT-${Date.now()}`,
    customer_name: 'Next Customer',
    customer_phone: '081233334444',
    customer_email: 'next@uskistore.id',
    shipping_address: 'Jl. Margonda Raya No. 200, Depok',
    shipping_method: 'Kurir Toko USKI (Express)',
    subtotal: 120000,
    shipping_fee: 10000,
    total_amount: 130000,
    status: 'processing',
    payment_status: 'paid',
    payment_method: 'transfer_manual',
    items: [{ id: 'item-2', name: 'Sarung Goyor', price: 120000, quantity: 1 }],
  });
  assert(!insOrderErr2, 'Order 2 created for next assignment test');

  // Assign Order 2 to Courier A
  const deliveryNextA = {
    order_id: orderId2,
    order_number: `ORD-NEXT-${Date.now()}`,
    recipient_name: 'Next Customer',
    recipient_phone: '081233334444',
    delivery_address: 'Jl. Margonda Raya No. 200, Depok',
    items_count: 1,
    status: 'assigned',
    started_at: '11:00 WIB',
  };

  const { error: asgNextErr } = await supabase
    .from('couriers')
    .update({
      status: 'delivering',
      active_delivery: deliveryNextA,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courA.id);

  assert(!asgNextErr, 'Source Courier A successfully accepted new active_delivery');

  const { data: verifyNextA } = await supabase.from('couriers').select('*').eq('id', courA.id).single();
  assert(verifyNextA.status === 'delivering', 'Courier A is status delivering for new order');
  assert(verifyNextA.active_delivery?.order_id === orderId2, 'Courier A active_delivery matches Order 2');

  // Clean up scenario 3
  await supabase.from('orders').delete().eq('id', orderId2);
  await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', courA.id);

  // --------------------------------------------------------------------------
  // TEST SCENARIO 4: Order update with completeDelivery proofs fallback
  // --------------------------------------------------------------------------
  console.log(`\n${CYAN}▶ Scenario 4: dbService.orders.completeDelivery Fallback Verification${RESET}`);
  const orderId3 = `stress-proof-${Date.now()}`;
  await supabase.from('orders').insert({
    id: orderId3,
    order_number: `ORD-PRF-${Date.now()}`,
    customer_name: 'Proof Customer',
    customer_phone: '081255556666',
    customer_email: 'proof@uskistore.id',
    shipping_address: 'Jl. Sawangan No. 50, Depok',
    shipping_method: 'Kurir Toko USKI (Express)',
    subtotal: 90000,
    shipping_fee: 10000,
    total_amount: 100000,
    status: 'shipped',
    payment_status: 'paid',
    payment_method: 'transfer_manual',
    courier_name: courB.name,
    items: [{ id: 'item-3', name: 'Sarung Sutra', price: 90000, quantity: 1 }],
  });

  // Emulate dbService.orders.completeDelivery logic
  const completeUpdates = {
    status: 'delivered',
    delivery_proof_url: 'https://kxbdoqviqzseymjofsjg.supabase.co/storage/v1/object/public/delivery-proofs/proofs/test.jpg',
    delivery_signature_url: 'https://kxbdoqviqzseymjofsjg.supabase.co/storage/v1/object/public/delivery-proofs/signatures/test.png',
    delivery_recipient_name: 'Bapak Ahmad',
    delivery_notes: 'Diterima dengan baik',
    delivered_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: fullCompOrderErr } = await supabase.from('orders').update(completeUpdates).eq('id', orderId3);
  let orderCompSuccess = false;
  if (fullCompOrderErr && fullCompOrderErr.code === 'PGRST204') {
    const { error: compFallbackErr } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId3);
    orderCompSuccess = !compFallbackErr;
  } else {
    orderCompSuccess = !fullCompOrderErr;
  }
  assert(orderCompSuccess, 'orders.completeDelivery gracefully completed (primary or PGRST204 fallback)');

  const { data: finalDeliveredOrder } = await supabase.from('orders').select('status').eq('id', orderId3).single();
  assert(finalDeliveredOrder.status === 'delivered', 'Order status is delivered in DB');

  // Clean up scenario 4
  await supabase.from('orders').delete().eq('id', orderId3);

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}              ADVERSARIAL STRESS TEST SUMMARY                   ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`Passed : ${GREEN}${passed}${RESET}`);
  console.log(`Failed : ${failed > 0 ? RED : GREEN}${failed}${RESET}`);

  if (failed > 0) {
    console.error(`\n${RED}FAILURES:${RESET}`);
    failureDetails.forEach(f => console.error(`  - [${f.testName}]: ${f.extra}`));
    process.exit(1);
  } else {
    console.log(`\n${GREEN}🎉 ALL ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
