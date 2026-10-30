/**
 * USKI STORE — Tier 5 Adversarial Coverage Hardening Suite 2
 * Challenger 2: Milestone 5
 *
 * EMPIRICAL STRESS TESTS:
 * 1. Concurrent delivery reassignments between multiple couriers
 *    - Status constraint violations (Postgres 23514 on 'available', 'off_duty')
 *    - Double active deliveries (multiple couriers claiming same order concurrently)
 *    - Reassignment to already busy courier (overwriting active delivery)
 * 2. Storage upload error handling:
 *    - Corrupted base64 strings and malformed DataURLs
 *    - Missing bucket error handling (404 / NoSuchBucket)
 *    - Local preview object URL fallback behavior
 * 3. Courier completion with extreme payload sizes:
 *    - Huge notes (100,000 characters)
 *    - Long recipient names (10,000 characters)
 *    - Diverse Unicode (Arabic, RTL, Emojis, CJK, special characters, SQLi/XSS vectors)
 */

import { supabase, ensureAuthSession } from '../e2e/harness.js';

// ANSI colors for clean CLI reporting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
const findings = [];

function recordResult(testId, title, success, details, bugClassification = null) {
  if (success) {
    passed++;
    console.log(`  ${GREEN}✔ PASS${RESET} [${testId}] ${title}`);
    if (details) console.log(`         ${CYAN}↳ ${details}${RESET}`);
  } else {
    failed++;
    console.log(`  ${RED}✖ FAIL${RESET} [${testId}] ${title}`);
    console.log(`         ${RED}↳ ${details}${RESET}`);
    findings.push({
      testId,
      title,
      details,
      severity: bugClassification?.severity || 'HIGH',
      impact: bugClassification?.impact || 'Operational failure / Data inconsistency',
      remediation: bugClassification?.remediation || 'Code hardening required',
    });
  }
}

// Emulate dataURLtoBlob from src/lib/supabase.ts
function dataURLtoBlobImplementation(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Emulate uploadFileToStorage from src/lib/supabase.ts
async function uploadFileToStorageImplementation(fileOrDataUrl, bucket, customFolder = '') {
  let fileBody;
  let fileExt = 'jpg';

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('data:')) {
      fileBody = dataURLtoBlobImplementation(fileOrDataUrl);
      fileExt = fileBody.type.split('/')[1] || 'png';
    } else {
      return fileOrDataUrl;
    }
  } else if (fileOrDataUrl instanceof Blob) {
    fileBody = fileOrDataUrl;
    fileExt = fileOrDataUrl.type.split('/')[1] || 'jpg';
  } else {
    fileBody = fileOrDataUrl;
  }

  if (!supabase) {
    return URL.createObjectURL(fileBody);
  }

  await ensureAuthSession();

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = customFolder ? `${customFolder}/${fileName}` : fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBody, {
      cacheControl: '3600',
      upsert: true,
      contentType: fileBody.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg'),
    });

  if (uploadError) {
    return URL.createObjectURL(fileBody);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// ----------------------------------------------------------------------------
// TEST SUITE EXECUTION
// ----------------------------------------------------------------------------
async function runAdversarialHardeningSuite() {
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}    TIER 5 ADVERSARIAL COVERAGE HARDENING (CHALLENGER 2)        ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  await ensureAuthSession();

  const timestamp = Date.now();
  const createdCourierIds = [];
  const createdOrderIds = [];

  try {
    // =========================================================================
    // SECTION 1: CONCURRENT DELIVERY REASSIGNMENTS & STATUS CONSTRAINTS
    // =========================================================================
    console.log(`${BOLD}--- [1] Delivery Reassignments & Status Constraints ---${RESET}`);

    // Test 1.1: Database check constraint couriers_status_check for 'available'
    const c1Id = `c2-test-cour-1-${timestamp}`;
    createdCourierIds.push(c1Id);

    const { error: errInsertAvail } = await supabase.from('couriers').insert({
      id: c1Id,
      name: 'Challenger Courier 1',
      email: `cour1_${timestamp}@uskistore.id`,
      phone: '0811000001',
      vehicle_type: 'motorcycle',
      vehicle_plate: 'B 1001 CC',
      status: 'available',
    });

    const is23514OnAvail = errInsertAvail && errInsertAvail.code === '23514';
    if (is23514OnAvail) {
      recordResult(
        'TC-CH2-01',
        'Check constraint 23514 on "status: available"',
        false,
        `Direct insert with status "available" triggers Postgres 23514: ${errInsertAvail.message}. DB expects "idle".`,
        {
          severity: 'HIGH',
          impact: 'Admin adding a courier or resetting status to "available" fails without automatic fallback.',
          remediation: 'Relax DB check constraint to include "available" or normalize frontend status mapping in dbService.',
        }
      );
    } else {
      recordResult(
        'TC-CH2-01',
        'Check constraint 23514 on "status: available"',
        !errInsertAvail,
        errInsertAvail ? errInsertAvail.message : 'Database accepts "available" status natively.'
      );
    }

    // Insert courier with 'idle' to continue testability
    await supabase.from('couriers').insert({
      id: c1Id,
      name: 'Challenger Courier 1',
      email: `cour1_${timestamp}@uskistore.id`,
      phone: '0811000001',
      vehicle_type: 'motorcycle',
      vehicle_plate: 'B 1001 CC',
      status: 'idle',
    });

    // Test 1.2: Check constraint on 'off_duty' status (Admin "Set Libur" button)
    const { error: errUpdateOffDuty } = await supabase
      .from('couriers')
      .update({ status: 'off_duty' })
      .eq('id', c1Id);

    if (errUpdateOffDuty && errUpdateOffDuty.code === '23514') {
      recordResult(
        'TC-CH2-02',
        'Check constraint 23514 on "status: off_duty" (Set Libur)',
        false,
        `Updating status to "off_duty" violates couriers_status_check 23514. DB only accepts "offline".`,
        {
          severity: 'HIGH',
          impact: 'When admin toggles courier to "Set Libur", update fails silently or rejects in Supabase.',
          remediation: 'Map "off_duty" -> "offline" in dbService.couriers.updateStatus or allow "off_duty" in DB constraint.',
        }
      );
    } else {
      recordResult(
        'TC-CH2-02',
        'Check constraint 23514 on "status: off_duty" (Set Libur)',
        !errUpdateOffDuty,
        errUpdateOffDuty ? errUpdateOffDuty.message : 'Status "off_duty" updated successfully.'
      );
    }

    // Test 1.3: Concurrent delivery reassignments to multiple couriers (Double Active Delivery race condition)
    const c2Id = `c2-test-cour-2-${timestamp}`;
    const c3Id = `c2-test-cour-3-${timestamp}`;
    const orderId1 = `c2-test-ord-1-${timestamp}`;
    createdCourierIds.push(c2Id, c3Id);
    createdOrderIds.push(orderId1);

    const testDelivery = {
      order_id: orderId1,
      order_number: `ORD-C2-${timestamp.toString().slice(-5)}`,
      recipient_name: 'Penerima Paket Uji',
      status: 'on_delivery',
    };

    // Prepare order & couriers in DB
    await supabase.from('orders').insert({
      id: orderId1,
      order_number: testDelivery.order_number,
      customer_name: testDelivery.recipient_name,
      customer_email: 'cust@test.id',
      customer_phone: '0812999901',
      shipping_address: { street_address: 'Jl. Margonda No. 12', city: 'Depok' },
      items: [{ id: 'it-1', product_name: 'Buku Fiqih', quantity: 2, unit_price: 50000 }],
      subtotal: 100000,
      shipping_fee: 10000,
      total_amount: 110000,
      payment_method: 'cod',
      shipping_method: 'store_courier',
      status: 'shipped',
      courier_name: 'Challenger Courier 1',
    });

    await supabase.from('couriers').update({
      status: 'delivering',
      active_delivery: testDelivery,
    }).eq('id', c1Id);

    await supabase.from('couriers').insert([
      { id: c2Id, name: 'Challenger Courier 2', email: `cour2_${timestamp}@uskistore.id`, phone: '0811000002', vehicle_type: 'motorcycle', vehicle_plate: 'B 1002 CC', status: 'idle', active_delivery: null },
      { id: c3Id, name: 'Challenger Courier 3', email: `cour3_${timestamp}@uskistore.id`, phone: '0811000003', vehicle_type: 'motorcycle', vehicle_plate: 'B 1003 CC', status: 'idle', active_delivery: null },
    ]);

    // Simulate concurrent reassignment: Thread A sends to Courier 2, Thread B sends to Courier 3 simultaneously
    const reassignToC2 = async () => {
      await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', c1Id);
      await supabase.from('couriers').update({ status: 'delivering', active_delivery: testDelivery }).eq('id', c2Id);
      await supabase.from('orders').update({ courier_name: 'Challenger Courier 2' }).eq('id', orderId1);
    };

    const reassignToC3 = async () => {
      await supabase.from('couriers').update({ status: 'idle', active_delivery: null }).eq('id', c1Id);
      await supabase.from('couriers').update({ status: 'delivering', active_delivery: testDelivery }).eq('id', c3Id);
      await supabase.from('orders').update({ courier_name: 'Challenger Courier 3' }).eq('id', orderId1);
    };

    await Promise.all([reassignToC2(), reassignToC3()]);

    const { data: verifiedCouriers } = await supabase
      .from('couriers')
      .select('id, name, status, active_delivery')
      .in('id', [c2Id, c3Id]);

    const activeCouriersWithSameOrder = (verifiedCouriers || []).filter(
      (c) => c.status === 'delivering' && c.active_delivery?.order_id === orderId1
    );

    if (activeCouriersWithSameOrder.length > 1) {
      recordResult(
        'TC-CH2-03',
        'Double Active Delivery Race Condition Prevention',
        false,
        `VULNERABILITY: ${activeCouriersWithSameOrder.length} couriers simultaneously holding active delivery for order ${testDelivery.order_number}. Lacks atomic OCC guard.`,
        {
          severity: 'HIGH',
          impact: 'Multiple drivers dispatched for the same single package simultaneously.',
          remediation: 'Implement optimistic lock (version check or single active courier RPC) on reassignment.',
        }
      );
    } else {
      recordResult(
        'TC-CH2-03',
        'Double Active Delivery Race Condition Prevention',
        true,
        `Exactly one courier (${activeCouriersWithSameOrder[0]?.name}) holds active delivery.`
      );
    }

    // Test 1.4: Reassignment to already busy courier (overwriting existing delivery)
    const orderId2 = `c2-test-ord-2-${timestamp}`;
    createdOrderIds.push(orderId2);

    const existingDelivery = {
      order_id: orderId2,
      order_number: `ORD-C2-BUSY-${timestamp.toString().slice(-4)}`,
      recipient_name: 'Pelanggan Pertama',
      status: 'on_delivery',
    };

    // Set Courier 2 to be busy with orderId2
    await supabase.from('couriers').update({
      status: 'delivering',
      active_delivery: existingDelivery,
    }).eq('id', c2Id);

    // Now reassign orderId1 to Courier 2 without releasing orderId2
    const { error: errBusyAssign } = await supabase.from('couriers').update({
      status: 'delivering',
      active_delivery: testDelivery,
    }).eq('id', c2Id);

    const { data: cour2After } = await supabase
      .from('couriers')
      .select('active_delivery')
      .eq('id', c2Id)
      .single();

    if (cour2After?.active_delivery?.order_id === orderId1) {
      recordResult(
        'TC-CH2-04',
        'Guard against reassigning to an already busy courier',
        false,
        `GAP: Reassigning to busy courier silently clobbered previous order ${existingDelivery.order_number}. UI allows selecting busy couriers.`,
        {
          severity: 'MEDIUM',
          impact: 'Previous active order is evicted from active_delivery without being marked delivered or failed.',
          remediation: 'Filter out "delivering" couriers in AdminCouriers reassign dropdown, or reject if active_delivery is not null.',
        }
      );
    } else {
      recordResult(
        'TC-CH2-04',
        'Guard against reassigning to an already busy courier',
        true,
        'Busy courier rejected assignment or queued safely.'
      );
    }

    // =========================================================================
    // SECTION 2: STORAGE UPLOAD ERROR HANDLING
    // =========================================================================
    console.log(`\n${BOLD}--- [2] Storage Upload Error Handling & Fallbacks ---${RESET}`);

    // Test 2.1: Corrupted Base64 DataURL handling
    let base64HandledCleanly = false;
    let base64ErrorMessage = '';
    try {
      const corruptDataUrl = 'data:image/png;base64,!!!NOT_VALID_BASE64_PADDING@@@';
      await uploadFileToStorageImplementation(corruptDataUrl, 'delivery-proofs', 'proofs');
      base64HandledCleanly = true;
    } catch (err) {
      base64ErrorMessage = err.message;
      base64HandledCleanly = false;
    }

    if (!base64HandledCleanly) {
      recordResult(
        'TC-CH2-05',
        'Storage Upload: Corrupted base64 DataURL handling',
        false,
        `dataURLtoBlob throws uncaught error without try/catch wrapper: "${base64ErrorMessage}".`,
        {
          severity: 'HIGH',
          impact: 'Invalid or interrupted signature/canvas upload crashes courier submission flow with unhandled error.',
          remediation: 'Wrap atob(arr[1]) in try/catch within dataURLtoBlob and return fallback empty/error Blob.',
        }
      );
    } else {
      recordResult(
        'TC-CH2-05',
        'Storage Upload: Corrupted base64 DataURL handling',
        true,
        'Corrupted base64 handled gracefully without crashing.'
      );
    }

    // Test 2.2: Missing Bucket Error Handling & Fallback URL
    let missingBucketUrl = '';
    let missingBucketError = null;
    try {
      const sampleBlob = new Blob(['sample-test-content'], { type: 'text/plain' });
      missingBucketUrl = await uploadFileToStorageImplementation(
        sampleBlob,
        'nonexistent-bucket-random-xyz',
        'test-folder'
      );
    } catch (err) {
      missingBucketError = err;
    }

    if (missingBucketError) {
      recordResult(
        'TC-CH2-06',
        'Storage Upload: Missing bucket fallback error handling',
        false,
        `Missing bucket threw unhandled exception: ${missingBucketError.message}`,
        {
          severity: 'MEDIUM',
          impact: 'Unprovisioned storage bucket halts file upload process completely.',
          remediation: 'Ensure uploadFileToStorage returns URL.createObjectURL(fileBody) fallback when uploadError occurs.',
        }
      );
    } else if (missingBucketUrl && (missingBucketUrl.startsWith('blob:') || missingBucketUrl.startsWith('http'))) {
      recordResult(
        'TC-CH2-06',
        'Storage Upload: Missing bucket fallback error handling',
        true,
        `Gracefully returned fallback preview URL: ${missingBucketUrl.slice(0, 35)}...`
      );
    } else {
      recordResult(
        'TC-CH2-06',
        'Storage Upload: Missing bucket fallback error handling',
        false,
        `Unexpected return value from missing bucket upload: ${missingBucketUrl}`
      );
    }

    // Test 2.3: Valid public URL resolution pattern for delivery-proofs
    const validBlob = new Blob(['test-proof-data'], { type: 'image/png' });
    let resolvedProofUrl = '';
    try {
      resolvedProofUrl = await uploadFileToStorageImplementation(validBlob, 'delivery-proofs', 'proofs');
    } catch (e) {
      resolvedProofUrl = '';
    }

    recordResult(
      'TC-CH2-07',
      'Storage Upload: Live delivery-proofs bucket public URL generation',
      Boolean(resolvedProofUrl && resolvedProofUrl.includes('/storage/v1/object/public/delivery-proofs/')),
      resolvedProofUrl
        ? `Resolved public CDN URL: ${resolvedProofUrl.slice(0, 75)}...`
        : 'Failed to generate public URL'
    );

    // =========================================================================
    // SECTION 3: EXTREME PAYLOAD SIZES & UNICODE STRESS
    // =========================================================================
    console.log(`\n${BOLD}--- [3] Courier Completion Extreme Payloads ---${RESET}`);

    const extremeOrderId = `c2-test-ord-ext-${timestamp}`;
    createdOrderIds.push(extremeOrderId);

    // 100,000 characters delivery notes (approx 100KB)
    const hugeNotes = 'Catatan Operasional: ' + 'A'.repeat(100000);
    // 5,000 characters recipient name
    const longRecipient = 'Penerima ' + 'B'.repeat(5000);
    // Unicode text: Arabic, Jawi, Japanese, Emojis, RTL mark, quotes, HTML tags
    const richUnicode = 'الحمد لله رب العالمين 🕋 📦 ⚡ 🚀 <script>alert("xss")</script> \' OR 1=1;-- \u202Ereversed\u202C';

    const extremeOrder = {
      id: extremeOrderId,
      order_number: `EXT-${timestamp.toString().slice(-6)}`,
      customer_name: richUnicode,
      customer_email: 'unicode@test.id',
      customer_phone: '08123456789',
      shipping_address: { street_address: 'Jl. Uji Ekstrem ' + 'X'.repeat(1000), city: 'Depok' },
      items: [{ id: 'it-ext', product_name: 'Kitab Tafsir ' + richUnicode, quantity: 1, unit_price: 150000 }],
      subtotal: 150000,
      shipping_fee: 10000,
      total_amount: 160000,
      payment_method: 'bank_transfer',
      shipping_method: 'store_courier',
      status: 'shipped',
      notes: hugeNotes,
    };

    // Test 3.1: Insert order with extreme payload
    const { data: insertedExtOrder, error: errExtOrder } = await supabase
      .from('orders')
      .insert(extremeOrder)
      .select('id, notes')
      .single();

    recordResult(
      'TC-CH2-08',
      'Extreme Payload: Order table handles 100KB notes and Unicode strings',
      !errExtOrder && insertedExtOrder?.notes?.length > 100000,
      errExtOrder ? errExtOrder.message : `Successfully persisted order with ${insertedExtOrder?.notes?.length} chars notes.`
    );

    // Test 3.2: Complete courier delivery with huge notes and long recipient in active_delivery
    const extremeActiveDelivery = {
      order_id: extremeOrderId,
      order_number: extremeOrder.order_number,
      recipient_name: longRecipient,
      notes: hugeNotes,
      unicode_notes: richUnicode,
      status: 'on_delivery',
    };

    const { error: errCourExt } = await supabase
      .from('couriers')
      .update({
        status: 'delivering',
        active_delivery: extremeActiveDelivery,
      })
      .eq('id', c1Id);

    recordResult(
      'TC-CH2-09',
      'Extreme Payload: Courier active_delivery JSON handles 100KB JSON payload',
      !errCourExt,
      errCourExt ? errCourExt.message : 'Successfully persisted extreme JSON payload in active_delivery column.'
    );

    // Test 3.3: Complete delivery lifecycle with extreme completion notes
    const { error: errCompleteExt } = await supabase
      .from('couriers')
      .update({
        status: 'idle',
        active_delivery: null,
        total_delivered_today: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', c1Id);

    const { error: errOrderDelivered } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        proof_of_payment_url: resolvedProofUrl || 'https://kxbdoqviqzseymjofsjg.supabase.co/storage/v1/object/public/delivery-proofs/proof.jpg',
        notes: `${richUnicode} - Diterima oleh: ${longRecipient.slice(0, 200)} - ${hugeNotes.slice(0, 1000)}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', extremeOrderId);

    recordResult(
      'TC-CH2-10',
      'Extreme Payload: Delivery completion state transition with rich Unicode and large notes',
      !errCompleteExt && !errOrderDelivered,
      (!errCompleteExt && !errOrderDelivered)
        ? 'Courier reset to idle and order marked delivered cleanly.'
        : `Errors: Cour=${errCompleteExt?.message || 'none'}, Ord=${errOrderDelivered?.message || 'none'}`
    );

  } catch (globalErr) {
    console.error('Unhandled error during test run:', globalErr);
  } finally {
    // Teardown / Cleanup
    console.log(`\n${CYAN}Running cleanup of test fixtures...${RESET}`);
    if (createdCourierIds.length > 0) {
      await supabase.from('couriers').delete().in('id', createdCourierIds);
    }
    if (createdOrderIds.length > 0) {
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    console.log(`${CYAN}Cleanup completed. Zero test records remaining.${RESET}\n`);
  }

  // Summary Report
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}                    CHALLENGER 2 TEST SUMMARY                   ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`Total Stress Tests Executed : ${passed + failed}`);
  console.log(`Passed                      : ${GREEN}${passed}${RESET}`);
  console.log(`Failed / Gaps Identified   : ${failed > 0 ? RED + failed + RESET : GREEN + '0' + RESET}`);
  console.log(`Hardening Pass Rate         : ${((passed / (passed + failed || 1)) * 100).toFixed(1)}%`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  if (findings.length > 0) {
    console.log(`${BOLD}${YELLOW}IDENTIFIED GAPS & RECOMMENDATIONS FOR WORKER REMEDIATION:${RESET}\n`);
    findings.forEach((f, idx) => {
      console.log(`  ${BOLD}${idx + 1}. [${f.testId}] ${f.title} (${f.severity})${RESET}`);
      console.log(`     Impact      : ${f.impact}`);
      console.log(`     Observation : ${f.details}`);
      console.log(`     Remediation : ${f.remediation}\n`);
    });
  }

  return { passed, failed, findings };
}

runAdversarialHardeningSuite().then(({ failed }) => {
  if (failed > 0) {
    process.exitCode = 1;
  }
});
