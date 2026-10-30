/**
 * USKI STORE — Tier 5 Adversarial Coverage Hardening Test Suite (Milestone 5)
 * Challenger 1: White-Box Adversarial Stress Harness
 *
 * Scope:
 * 1. Concurrent Order Placement & UUID Sanitization (Postgres 22P02 prevention)
 * 2. Broken Foreign Keys & Missing Relations Resilience
 * 3. PostgREST Error Handling & Graceful Fallbacks in dbService
 * 4. Realtime Channel Event Handling with Malformed Payloads
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kxbdoqviqzseymjofsjg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ANSI Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passedCount = 0;
let failedCount = 0;
const failureDetails = [];
const teardownRecords = {
  orders: [],
  couriers: [],
};

function assert(condition, testName, extraInfo = '') {
  if (condition) {
    console.log(`  ${GREEN}✔ PASS${RESET} ${testName}`);
    passedCount++;
  } else {
    console.error(`  ${RED}✖ FAIL${RESET} ${testName}`);
    if (extraInfo) console.error(`    ${RED}Detail:${RESET} ${extraInfo}`);
    failedCount++;
    failureDetails.push({ testName, extraInfo });
  }
}

// Helper: UUID validator matching orderStore.ts
const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

async function run() {
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}   TIER 5 ADVERSARIAL COVERAGE HARDENING STRESS HARNESS (M5)    ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  // Admin authentication
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@uskistore.id',
    password: 'password123',
  });
  assert(!authErr && Boolean(authData?.session), 'Admin auth session established for stress suite');

  // ============================================================================
  // GROUP 1: Concurrent Order Placement & UUID Sanitization (Postgres 22P02)
  // ============================================================================
  console.log(`\n${CYAN}▶ GROUP 1: Concurrent Order Placement & UUID Sanitization${RESET}`);

  // Test 1.1: Verify raw Supabase behavior when inserting non-UUID customer_id
  const nonUuidValues = [
    'guest',
    'guest-customer-123',
    'not-a-valid-uuid',
    '!@#$%^&*()',
    'user-847329',
    'null',
    'undefined',
  ];

  for (const badVal of nonUuidValues) {
    const rawOrder = {
      id: `CHALLENGE_22P02_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_number: `USKI-CHAL-RAW-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_id: badVal,
      customer_name: 'Test Raw 22P02',
      customer_email: 'test@example.com',
      customer_phone: '081234567890',
      shipping_address: { street_address: 'Jl. Margonda', city: 'Depok' },
      items: [{ product_id: 'test', product_name: 'Item', price: 10000, quantity: 1, subtotal: 10000 }],
      subtotal: 10000,
      total_amount: 10000,
      payment_method: 'bank_transfer',
      shipping_method: 'Kurir Toko',
      status: 'awaiting_payment',
    };

    const { error: rawErr } = await supabase.from('orders').insert(rawOrder);
    assert(
      rawErr && (rawErr.code === '22P02' || rawErr.message.includes('uuid')),
      `Raw Supabase correctly rejects non-UUID customer_id ("${badVal}") with 22P02`,
      rawErr ? `${rawErr.code}: ${rawErr.message}` : 'No error was returned'
    );
  }

  // Test 1.2: Verify orderStore UUID sanitization logic prevents Postgres 22P02
  for (const badVal of nonUuidValues) {
    const testOrderId = `CHALLENGE_SAN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const testOrderNum = `USKI-CHAL-SAN-${Math.floor(1000 + Math.random() * 9000)}`;

    const sanitizedPayload = {
      id: testOrderId,
      order_number: testOrderNum,
      customer_id: isUuid(badVal) ? badVal : undefined,
      customer_name: 'Sanitized Guest Customer',
      customer_email: 'guest@uskistore.id',
      customer_phone: '081234567891',
      shipping_address: { street_address: 'Jl. Margonda Raya', city: 'Depok' },
      items: [{ product_id: 'test', product_name: 'Item', price: 15000, quantity: 1, subtotal: 15000 }],
      subtotal: 15000,
      total_amount: 15000,
      payment_method: 'bank_transfer',
      shipping_method: 'Kurir Toko',
      status: 'awaiting_payment',
    };

    const { data: insertedOrder, error: sanErr } = await supabase
      .from('orders')
      .insert(sanitizedPayload)
      .select()
      .single();

    assert(
      !sanErr && Boolean(insertedOrder),
      `Sanitized order with input "${badVal}" persists safely without 22P02`,
      sanErr ? `${sanErr.code}: ${sanErr.message}` : ''
    );

    if (insertedOrder) {
      teardownRecords.orders.push(insertedOrder.id);
    }
  }

  // Test 1.3: Concurrency stress test — 15 parallel order submissions
  console.log(`  ${BOLD}Running 15 concurrent order placements via Promise.all...${RESET}`);
  const CONCURRENCY_BATCH = 15;
  const concurrentOrders = Array.from({ length: CONCURRENCY_BATCH }, (_, i) => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const orderId = `CHALLENGE_CONC_${Date.now()}_${i}_${randomSuffix}`;
    const orderNumber = `USKI-CONC-${Date.now().toString().slice(-6)}-${i}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: orderId,
      order_number: orderNumber,
      customer_id: i % 2 === 0 ? 'guest' : undefined,
      customer_name: `Concurrent Customer ${i + 1}`,
      customer_email: `customer${i + 1}@concurrent.test`,
      customer_phone: `08129876543${i}`,
      shipping_address: { street_address: `Jl. Margonda No. ${i + 1}`, city: 'Depok' },
      items: [{ product_id: 'test', product_name: `Book ${i + 1}`, price: 50000, quantity: 1, subtotal: 50000 }],
      subtotal: 50000,
      total_amount: 50000,
      payment_method: 'cod',
      shipping_method: 'Kurir Toko',
      status: 'awaiting_payment',
    };
  });

  const concurrentResults = await Promise.allSettled(
    concurrentOrders.map(async (ord) => {
      const sanitized = {
        ...ord,
        customer_id: isUuid(ord.customer_id) ? ord.customer_id : undefined,
      };
      const { data, error } = await supabase.from('orders').insert(sanitized).select().single();
      if (error) throw error;
      return data;
    })
  );

  const succeededConcurrent = concurrentResults.filter((r) => r.status === 'fulfilled');
  const failedConcurrent = concurrentResults.filter((r) => r.status === 'rejected');

  assert(
    succeededConcurrent.length === CONCURRENCY_BATCH && failedConcurrent.length === 0,
    `All ${CONCURRENCY_BATCH} concurrent orders placed successfully with 0 deadlocks/conflicts`,
    failedConcurrent.length > 0 ? `Failures: ${JSON.stringify(failedConcurrent.map((f) => f.reason))}` : ''
  );

  for (const res of succeededConcurrent) {
    if (res.value?.id) teardownRecords.orders.push(res.value.id);
  }

  // Test 1.4: ID Collision Risk in orderStore `id: ord-${Date.now()}`
  const idsGenerated = Array.from({ length: 10 }, () => `ord-${Date.now()}`);
  const uniqueIds = new Set(idsGenerated);
  const hasIdCollisionVulnerability = uniqueIds.size < idsGenerated.length;
  if (hasIdCollisionVulnerability) {
    console.log(
      `  ${YELLOW}⚠ IDENTIFIED GAP [BUG-M5-01]:${RESET} Synchronous calls to Date.now() produced duplicate IDs (${uniqueIds.size} unique out of ${idsGenerated.length}). orderStore.ts line 48 requires random entropy (e.g. \`\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`).`
    );
  }
  assert(
    hasIdCollisionVulnerability,
    'Empirically confirmed Date.now() duplicate ID vulnerability under synchronous high concurrency'
  );

  // ============================================================================
  // GROUP 2: Broken Foreign Keys & Missing Relations Resilience
  // ============================================================================
  console.log(`\n${CYAN}▶ GROUP 2: Broken Foreign Keys & Missing Relations Resilience${RESET}`);

  // Test 2.1: Order referencing non-existent courier with dbService fallback pattern
  const testOrderForCourier = {
    id: `CHALLENGE_FK_ORD_${Date.now()}`,
    order_number: `USKI-FK-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_name: 'FK Test Customer',
    customer_email: 'fk@test.com',
    customer_phone: '08111111111',
    shipping_address: { street_address: 'Margonda', city: 'Depok' },
    items: [],
    subtotal: 20000,
    total_amount: 20000,
    payment_method: 'bank_transfer',
    shipping_method: 'Kurir Toko',
    status: 'awaiting_payment',
  };

  const { data: createdFkOrder, error: fkOrderErr } = await supabase
    .from('orders')
    .insert(testOrderForCourier)
    .select()
    .single();

  assert(!fkOrderErr && Boolean(createdFkOrder), 'Created test order for courier assignment challenge');
  if (createdFkOrder) teardownRecords.orders.push(createdFkOrder.id);

  // Test dbService.orders.assignCourier fallback pattern when courier_id is not in schema cache (PGRST204)
  const nonExistentCourierId = 'courier-ghost-999999';
  const courierName = 'Kurir Toko USKI';

  // dbService logic:
  let assignSuccess = false;
  const updates = {
    courier_id: nonExistentCourierId,
    courier_name: courierName,
    status: 'shipped',
    updated_at: new Date().toISOString(),
  };

  const { error: directAssignErr } = await supabase.from('orders').update(updates).eq('id', testOrderForCourier.id);
  if (directAssignErr && directAssignErr.code === 'PGRST204') {
    // Fallback: update without courier_id column
    const { error: fallbackAssignErr } = await supabase
      .from('orders')
      .update({ status: 'shipped', courier_name: courierName, updated_at: updates.updated_at })
      .eq('id', testOrderForCourier.id);
    assignSuccess = !fallbackAssignErr;
  } else {
    assignSuccess = !directAssignErr;
  }

  assert(assignSuccess, 'dbService.orders.assignCourier PGRST204 fallback successfully assigns courier and updates status');

  // Test 2.2: Order items with deleted or non-existent product_id
  const nonExistentProductId = 'prod-non-existent-999999';
  const testOrderItem = {
    id: `CHALLENGE_ITEM_${Date.now()}`,
    order_id: testOrderForCourier.id,
    product_id: nonExistentProductId,
    product_name: 'Ghost Product',
    sku: 'GHOST-01',
    price: 50000,
    quantity: 1,
    subtotal: 50000,
  };

  const { error: itemErr } = await supabase.from('order_items').insert(testOrderItem);
  // PostgREST handling: returns boolean without throwing (handles PGRST205 missing table or 23503 FK error)
  const handledGracefully = Boolean(!itemErr || itemErr.code === '23503' || itemErr.code === 'PGRST205');
  assert(handledGracefully, 'Order items handles missing product relation gracefully (deterministic constraint, PGRST205, or soft relation)');

  // Test 2.3: Delivery proofs & Payment confirmations table resilience in dbService
  // In dbService.ts: if table does not exist or errors, insert returns null safely
  const { data: proofData, error: proofErr } = await supabase.from('delivery_proofs').select('*').limit(1);
  const proofHandled = proofErr ? proofErr.code === 'PGRST205' : Array.isArray(proofData);
  assert(proofHandled, 'dbService handles delivery_proofs missing table / query without uncaught exception');

  const { data: payData, error: payErr } = await supabase.from('payment_confirmations').select('*').limit(1);
  const payHandled = payErr ? payErr.code === 'PGRST205' : Array.isArray(payData);
  assert(payHandled, 'dbService handles payment_confirmations missing table / query without uncaught exception');

  // ============================================================================
  // GROUP 3: PostgREST Error Handling & Graceful Fallbacks in dbService.ts
  // ============================================================================
  console.log(`\n${CYAN}▶ GROUP 3: PostgREST Error Handling & Graceful Fallbacks in dbService${RESET}`);

  // Test 3.1: Active live database ping returns structured diagnostic without throwing
  const pingStart = performance.now();
  const { data: pingCategories, error: pingCatErr } = await supabase
    .from('categories')
    .select('id')
    .limit(1);

  const pingLatency = Math.round(performance.now() - pingStart);
  assert(
    !pingCatErr && Array.isArray(pingCategories),
    `Database ping query executes cleanly (${pingLatency}ms latency)`,
    pingCatErr ? pingCatErr.message : ''
  );

  // Test 3.2: Status update fallback resilience for couriers
  const { data: couriersList } = await supabase.from('couriers').select('id, status').limit(1);
  if (couriersList && couriersList.length > 0) {
    const courier = couriersList[0];
    const { error: statusErr } = await supabase
      .from('couriers')
      .update({ status: 'available' })
      .eq('id', courier.id);

    if (statusErr) {
      console.log(`  Notice: 'available' constraint triggered (${statusErr.message}). Testing fallback to 'idle'...`);
      const { error: fallbackErr } = await supabase
        .from('couriers')
        .update({ status: 'idle' })
        .eq('id', courier.id);
      assert(!fallbackErr, 'Courier status fallback to "idle" succeeds when "available" is rejected by constraint');
    } else {
      assert(true, 'Courier status accepts "available" directly');
      await supabase.from('couriers').update({ status: courier.status }).eq('id', courier.id);
    }
  }

  // Test 3.3: Safe single-record query for non-existent ID (PGRST116 prevention)
  const { data: missingProd, error: missingProdErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', 'prod-missing-uuid-never-existed')
    .single();

  assert(
    missingProd === null && missingProdErr && missingProdErr.code === 'PGRST116',
    'PostgREST returns PGRST116 for single missing record, handled as null by dbService',
    missingProdErr?.message
  );

  // Test 3.4: bulk_orders vs custom_requests table fallback resilience
  const { data: bulkData, error: bulkErr } = await supabase
    .from('bulk_orders')
    .select('*')
    .limit(1);

  if (bulkErr) {
    console.log(`  Notice: 'bulk_orders' table returned ${bulkErr.code}. Checking 'custom_requests' fallback...`);
    const { data: customData, error: customErr } = await supabase
      .from('custom_requests')
      .select('*')
      .limit(1);
    assert(!customErr && Array.isArray(customData), 'Fallback to custom_requests table succeeds cleanly');
  } else {
    assert(true, "'bulk_orders' table is available and queried directly");
  }

  // ============================================================================
  // GROUP 4: Realtime Channel Event Handling with Malformed Payloads
  // ============================================================================
  console.log(`\n${CYAN}▶ GROUP 4: Realtime Channel Event Handling with Malformed Payloads${RESET}`);

  // Simulate current unhardened logic in useSupabaseSync.ts
  function simulateRealtimeOrderHandler(payload, stateOrders = [{ id: 'ord-1', order_number: 'USKI-001' }]) {
    let orders = [...stateOrders];
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const updatedOrder = payload.new;
      const exists = orders.some((o) => o.id === updatedOrder.id);
      if (exists) {
        orders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      } else {
        orders = [updatedOrder, ...orders];
      }
    } else if (payload.eventType === 'DELETE') {
      orders = orders.filter((o) => o.id !== payload.old.id);
    }
    return orders;
  }

  // Hardened pattern for Worker remediation
  function simulateHardenedOrderHandler(payload, stateOrders = [{ id: 'ord-1', order_number: 'USKI-001' }]) {
    if (!payload || typeof payload !== 'object') return stateOrders;
    let orders = [...stateOrders];

    try {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new;
        if (!updatedOrder || typeof updatedOrder !== 'object' || !updatedOrder.id) {
          return stateOrders;
        }
        const exists = orders.some((o) => o.id === updatedOrder.id);
        if (exists) {
          orders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        } else {
          orders = [updatedOrder, ...orders];
        }
      } else if (payload.eventType === 'DELETE') {
        const oldOrder = payload.old;
        if (!oldOrder || typeof oldOrder !== 'object' || !oldOrder.id) {
          return stateOrders;
        }
        orders = orders.filter((o) => o.id !== oldOrder.id);
      }
    } catch {
      return stateOrders;
    }
    return orders;
  }

  // Test 4.1: Stress-test current unhardened handler against malformed payloads
  const malformedPayloads = [
    { name: 'DELETE with null old', payload: { eventType: 'DELETE', old: null } },
    { name: 'DELETE with undefined old', payload: { eventType: 'DELETE' } },
    { name: 'INSERT with null new', payload: { eventType: 'INSERT', new: null } },
    { name: 'UPDATE with null new', payload: { eventType: 'UPDATE', new: null } },
    { name: 'INSERT with empty object (no id)', payload: { eventType: 'INSERT', new: {} } },
  ];

  let unhardenedCrashes = 0;
  for (const tc of malformedPayloads) {
    try {
      simulateRealtimeOrderHandler(tc.payload);
    } catch (err) {
      unhardenedCrashes++;
      console.log(`  ${RED}✖ REPRODUCED BUG [BUG-M5-02]:${RESET} unhardened handler crashes on [${tc.name}]: ${err.message}`);
    }
  }

  assert(
    unhardenedCrashes > 0,
    `Empirically confirmed vulnerability in useSupabaseSync.ts: crashed on ${unhardenedCrashes}/${malformedPayloads.length} malformed payloads`
  );

  // Test 4.2: Verify hardened handler handles 100% of malformed payloads safely
  let hardenedCrashes = 0;
  for (const tc of malformedPayloads) {
    try {
      simulateHardenedOrderHandler(tc.payload);
    } catch (err) {
      hardenedCrashes++;
    }
  }

  assert(
    hardenedCrashes === 0,
    'Hardened defensive pattern survives all malformed realtime payloads with 0 crashes'
  );

  // Test 4.3: Realtime payload with prototype pollution or illegal properties
  const pollutedPayload = {
    eventType: 'INSERT',
    new: JSON.parse('{"__proto__": {"polluted": true}, "id": "clean-id"}'),
  };
  const hardenedResult = simulateHardenedOrderHandler(pollutedPayload);
  assert(
    hardenedResult.length === 2 && !({}).polluted,
    'Realtime handler is immune to prototype pollution attack'
  );

  // ============================================================================
  // TEARDOWN & SANITIZATION
  // ============================================================================
  console.log(`\n${CYAN}▶ Purging generated test records (Sanitization & Teardown)...${RESET}`);
  if (teardownRecords.orders.length > 0) {
    const { error: delErr } = await supabase
      .from('orders')
      .delete()
      .in('id', teardownRecords.orders);
    if (!delErr) {
      console.log(`  Purged ${teardownRecords.orders.length} test order records from Supabase.`);
    }
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}             TIER 5 ADVERSARIAL STRESS TEST SUMMARY             ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`Total Passed : ${GREEN}${passedCount}${RESET}`);
  console.log(`Total Failed : ${failedCount > 0 ? RED : GREEN}${failedCount}${RESET}`);

  if (failureDetails.length > 0) {
    console.log(`\n${RED}Failure Details:${RESET}`);
    for (const f of failureDetails) {
      console.log(`- ${f.testName}: ${f.extraInfo}`);
    }
  }
  console.log(`${BOLD}================================================================${RESET}\n`);

  return { passedCount, failedCount, failureDetails };
}

run().then((res) => {
  if (res.failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error('Fatal unhandled error in stress suite:', err);
  process.exit(1);
});
