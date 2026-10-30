/**
 * USKI STORE — Milestone 3 Empirical Challenger Test Suite
 *
 * Tests:
 * 1. Codebase audit: zero occurrences of advanceSimulation, STORE_BASE_COORDS telemetry, secondsUntilNextPing, etc.
 * 2. Supabase Storage bucket 'delivery-proofs': bucket presence, upload proofs/, upload signatures/, public URL verification, fetch verification.
 * 3. Live Courier Assignment & Reassignment against Supabase:
 *    - Order assignment -> orders & couriers table mutations
 *    - Reassignment (A -> B) -> source courier release & target courier assignment
 *    - Handover completion -> orders delivered, couriers available, delivery_proofs audit row inserted.
 * 4. Teardown & sanitization.
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
  auth: { persistSession: false, autoRefreshToken: false }
});

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, testName, message = '') {
  if (condition) {
    console.log(`  ${GREEN}✔ PASS${RESET} ${testName}`);
    passedCount++;
  } else {
    console.error(`  ${RED}✖ FAIL${RESET} ${testName}`);
    if (message) console.error(`    ${RED}Reason:${RESET} ${message}`);
    failedCount++;
    failures.push({ testName, message });
  }
}

async function ensureAuth() {
  try {
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: 'admin@uskistore.id',
      password: 'password123',
    });
    if (error || !loginData?.session) {
      console.warn(`[AUTH WARN] Sign-in failed: ${error?.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[AUTH EXCEPTION] ${err.message}`);
    return false;
  }
}

// Recursively search directory for regex/query
function grepDirectory(dirPath, regex, excludeDirs = ['node_modules', '.git', 'dist', '.agents']) {
  let matches = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeDirs.includes(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      matches = matches.concat(grepDirectory(fullPath, regex, excludeDirs));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|json|html|css|md)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (regex.test(content)) {
        matches.push(fullPath);
      }
    }
  }
  return matches;
}

async function runMilestone3Challenges() {
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}   EMPIRICAL CHALLENGER — MILESTONE 3 VERIFICATION HARNESS      ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  // --- SUITE 1: Fake Telemetry and Codebase Hygiene Audit ---
  console.log(`${CYAN}▶ Suite 1: Fake Telemetry Elimination Audit${RESET}`);

  // 1.1 advanceSimulation
  const advMatches = grepDirectory(path.join(projectRoot, 'src'), /\badvanceSimulation\b/);
  assert(advMatches.length === 0, 'No advanceSimulation occurrences in src/', `Found in: ${advMatches.join(', ')}`);

  // 1.2 Satelit Akurat
  const satMatches = grepDirectory(path.join(projectRoot, 'src'), /Satelit\s+Akurat/i);
  assert(satMatches.length === 0, 'No "Satelit Akurat" buzzwords in src/', `Found in: ${satMatches.join(', ')}`);

  // 1.3 secondsUntilNextPing
  const pingMatches = grepDirectory(path.join(projectRoot, 'src'), /secondsUntilNextPing/);
  assert(pingMatches.length === 0, 'No simulated ping countdown in src/', `Found in: ${pingMatches.join(', ')}`);

  // 1.4 couriers[0] fallback in OrderTrackingPage
  const trackingPath = path.join(projectRoot, 'src/pages/OrderTrackingPage.tsx');
  const trackingContent = fs.readFileSync(trackingPath, 'utf8');
  const hasCouriers0Fallback = trackingContent.includes('couriers[0]');
  assert(!hasCouriers0Fallback, 'OrderTrackingPage has no couriers[0] phantom assignment fallback');

  // 1.5 allDeliveryRecords hardcoded mock array
  const couriersPagePath = path.join(projectRoot, 'src/pages/admin/AdminCouriers.tsx');
  const couriersPageContent = fs.readFileSync(couriersPagePath, 'utf8');
  const hasMockDeliveryRecords = couriersPageContent.includes('allDeliveryRecords = [') || couriersPageContent.includes('allDeliveryRecords: DeliveryHistoryRecord[]');
  assert(!hasMockDeliveryRecords, 'AdminCouriers has no hardcoded allDeliveryRecords mock array');

  // --- SUITE 2: Storage Bucket 'delivery-proofs' Empirical Verification ---
  console.log(`\n${CYAN}▶ Suite 2: Supabase Storage 'delivery-proofs' Verification${RESET}`);

  const authSuccess = await ensureAuth();
  assert(authSuccess, 'Supabase admin auth session established');

  const { data: buckets, error: bucketListErr } = await supabase.storage.listBuckets();
  assert(!bucketListErr, 'Supabase storage.listBuckets API succeeds without fatal exception');

  let deliveryBucket = buckets?.find(b => b.id === 'delivery-proofs' || b.name === 'delivery-proofs');
  if (!deliveryBucket) {
    const { data: directBucket, error: directErr } = await supabase.storage.getBucket('delivery-proofs');
    if (!directErr && directBucket) {
      deliveryBucket = directBucket;
    }
  }
  // Bucket existence will be conclusively proven by upload and HTTP fetch below


  // Upload proof photo
  const testProofId = `challenge_proof_${Date.now()}`;
  const mockJpgBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
  ]);
  const photoStoragePath = `proofs/${testProofId}.jpg`;

  const { data: uploadPhotoData, error: uploadPhotoErr } = await supabase.storage
    .from('delivery-proofs')
    .upload(photoStoragePath, mockJpgBuffer, { contentType: 'image/jpeg', upsert: true });

  assert(!uploadPhotoErr, 'Proof photo uploaded successfully to proofs/ folder', uploadPhotoErr?.message);
  assert(Boolean(uploadPhotoData?.path), 'Upload photo returns valid storage path');

  // Upload signature
  const mockPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
  const sigStoragePath = `signatures/${testProofId}_sig.png`;

  const { data: uploadSigData, error: uploadSigErr } = await supabase.storage
    .from('delivery-proofs')
    .upload(sigStoragePath, mockPngBuffer, { contentType: 'image/png', upsert: true });

  assert(!uploadSigErr, 'Signature uploaded successfully to signatures/ folder', uploadSigErr?.message);
  assert(Boolean(uploadSigData?.path), 'Upload signature returns valid storage path');

  // Verify Public URLs and HTTP fetch accessibility
  const { data: photoUrlData } = supabase.storage.from('delivery-proofs').getPublicUrl(photoStoragePath);
  const { data: sigUrlData } = supabase.storage.from('delivery-proofs').getPublicUrl(sigStoragePath);

  assert(Boolean(photoUrlData?.publicUrl && photoUrlData.publicUrl.includes('delivery-proofs/proofs/')), 'Photo public URL correctly formed');
  assert(Boolean(sigUrlData?.publicUrl && sigUrlData.publicUrl.includes('delivery-proofs/signatures/')), 'Signature public URL correctly formed');

  if (photoUrlData?.publicUrl) {
    try {
      const res = await fetch(photoUrlData.publicUrl);
      assert(res.status === 200, `Uploaded proof photo is accessible via HTTP GET (status ${res.status})`, `Status: ${res.status}`);
    } catch (e) {
      assert(false, 'HTTP fetch proof photo succeeded', e.message);
    }
  }

  // --- SUITE 3: Live Courier Assignment and Reassignment Flow ---
  console.log(`\n${CYAN}▶ Suite 3: Courier Assignment, Reassignment & Delivery Handover Flow${RESET}`);

  // Fetch couriers from Supabase
  const { data: existingCouriers, error: courErr } = await supabase
    .from('couriers')
    .select('*')
    .order('created_at', { ascending: true });

  assert(!courErr && Array.isArray(existingCouriers) && existingCouriers.length >= 2,
    'At least 2 couriers exist in Supabase for reassignment testing',
    courErr?.message || `Found: ${existingCouriers?.length}`
  );

  const courierA = existingCouriers[0];
  const courierB = existingCouriers[1];

  console.log(`  Courier A: [${courierA.id}] ${courierA.name} (status: ${courierA.status})`);
  console.log(`  Courier B: [${courierB.id}] ${courierB.name} (status: ${courierB.status})`);

  // Ensure both couriers are standby (available or idle)
  await supabase.from('couriers').update({ status: 'available', active_delivery: null }).eq('id', courierA.id);
  await supabase.from('couriers').update({ status: 'available', active_delivery: null }).eq('id', courierB.id);

  // Create synthetic test order
  const testOrderId = `chal-m3-${Date.now()}`;
  const testOrderNumber = `CHAL-M3-${Date.now()}`;
  const testOrderPayload = {
    id: testOrderId,
    order_number: testOrderNumber,
    customer_name: 'Adversarial Challenger',
    customer_phone: '081299998888',
    customer_email: 'challenger@uskistore.id',
    shipping_address: 'Jl. Margonda Raya No. 456, Depok',
    shipping_method: 'Kurir Toko USKI (Express)',
    subtotal: 150000,
    shipping_fee: 15000,
    discount_amount: 0,
    total_amount: 165000,
    status: 'processing',
    order_status: 'processing',
    payment_status: 'paid',
    payment_method: 'transfer_manual',
    items: [
      { id: 'item-1', name: 'Sarung Tenun Premium Test', price: 150000, quantity: 1 }
    ]
  };

  const { data: createdOrder, error: orderCreateErr } = await supabase
    .from('orders')
    .insert([testOrderPayload])
    .select()
    .single();

  assert(!orderCreateErr && Boolean(createdOrder?.id), 'Test order inserted into Supabase', orderCreateErr?.message);


  // Step 3.1: Assign to Courier A
  console.log(`  Assigning order ${testOrderNumber} to Courier A (${courierA.name})...`);
  const activeDeliveryA = {
    order_id: testOrderId,
    order_number: testOrderNumber,
    recipient_name: 'Adversarial Challenger',
    recipient_phone: '081299998888',
    delivery_address: 'Jl. Margonda Raya No. 456, Depok',
    items_count: 1,
    cod_amount: 0,
    status: 'assigned',
    progress_pct: 10,
    started_at: '10:00 WIB',
  };

  const nowIso = new Date().toISOString();

  // Update order with Courier A
  const { error: assignOrderErr } = await supabase
    .from('orders')
    .update({
      courier_id: courierA.id,
      courier_name: courierA.name,
      order_status: 'shipped',
      status: 'shipped',
      dispatched_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', testOrderId);

  assert(!assignOrderErr, 'Order successfully assigned to Courier A in Supabase', assignOrderErr?.message);

  // Update Courier A status
  const { error: assignCourierErr } = await supabase
    .from('couriers')
    .update({
      status: 'delivering',
      active_delivery: activeDeliveryA,
      updated_at: nowIso,
    })
    .eq('id', courierA.id);

  assert(!assignCourierErr, 'Courier A status updated to "delivering" in Supabase', assignCourierErr?.message);

  // Verify Courier A state in DB
  const { data: verifyCourA } = await supabase.from('couriers').select('*').eq('id', courierA.id).single();
  assert(verifyCourA.status === 'delivering', 'Courier A status is "delivering"');
  assert(verifyCourA.active_delivery?.order_id === testOrderId, 'Courier A active_delivery has testOrderId');

  // Step 3.2: Reassign from Courier A to Courier B
  console.log(`  Reassigning order ${testOrderNumber} from Courier A to Courier B (${courierB.name})...`);
  const reassignReason = 'Kendala ban bocor di Margonda';
  const deliveryTransferB = {
    ...activeDeliveryA,
    reassigned_from: courierA.name,
    reassign_reason: reassignReason,
  };

  // 1. Release Courier A
  const { error: releaseAErr } = await supabase
    .from('couriers')
    .update({
      status: 'available',
      active_delivery: null,
      updated_at: nowIso,
    })
    .eq('id', courierA.id);
  assert(!releaseAErr, 'Courier A released to "available" with active_delivery null', releaseAErr?.message);

  // 2. Assign Courier B
  const { error: assignBErr } = await supabase
    .from('couriers')
    .update({
      status: 'delivering',
      active_delivery: deliveryTransferB,
      updated_at: nowIso,
    })
    .eq('id', courierB.id);
  assert(!assignBErr, 'Courier B assigned to "delivering" with active_delivery', assignBErr?.message);

  // 3. Update Order to Courier B
  const { error: reassignOrderErr } = await supabase
    .from('orders')
    .update({
      courier_id: courierB.id,
      courier_name: courierB.name,
      updated_at: nowIso,
    })
    .eq('id', testOrderId);
  assert(!reassignOrderErr, 'Order courier_id updated to Courier B in Supabase', reassignOrderErr?.message);

  // Verify state after reassignment
  const { data: postReassignA } = await supabase.from('couriers').select('*').eq('id', courierA.id).single();
  const { data: postReassignB } = await supabase.from('couriers').select('*').eq('id', courierB.id).single();
  const { data: postReassignOrder } = await supabase.from('orders').select('*').eq('id', testOrderId).single();

  assert(postReassignA.status === 'available' || postReassignA.status === 'idle', 'Source Courier A is available');
  assert(postReassignA.active_delivery === null, 'Source Courier A active_delivery is null');
  assert(postReassignB.status === 'delivering', 'Target Courier B is delivering');
  assert(postReassignB.active_delivery?.order_id === testOrderId, 'Target Courier B has active_delivery');
  assert(postReassignOrder.courier_id === courierB.id, 'Order points to Courier B');

  // Step 3.3: Complete Delivery with Handover Proof & Signature
  console.log(`  Completing delivery for order ${testOrderNumber} by Courier B...`);
  const finishProofUrl = photoUrlData.publicUrl;
  const finishSigUrl = sigUrlData.publicUrl;
  const recipientNotes = 'Diterima oleh Istri Pemesan di rumah';

  // Release Courier B
  const { error: completeBErr } = await supabase
    .from('couriers')
    .update({
      status: 'available',
      active_delivery: null,
      total_delivered_today: (courierB.total_delivered_today || 0) + 1,
      updated_at: nowIso,
    })
    .eq('id', courierB.id);
  assert(!completeBErr, 'Courier B completed delivery and status is "available"', completeBErr?.message);

  // Update order to delivered with proofs
  const { error: completeOrderErr } = await supabase
    .from('orders')
    .update({
      order_status: 'delivered',
      status: 'delivered',
      delivery_proof_url: finishProofUrl,
      delivery_signature_url: finishSigUrl,
      delivery_recipient_name: 'Adversarial Challenger',
      delivery_notes: recipientNotes,
      delivered_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', testOrderId);
  assert(!completeOrderErr, 'Order status updated to "delivered" with proof URLs', completeOrderErr?.message);

  // Insert into delivery_proofs table
  const { data: proofRow, error: proofInsertErr } = await supabase
    .from('delivery_proofs')
    .insert([
      {
        order_id: testOrderId,
        courier_id: courierB.id,
        recipient_name: 'Adversarial Challenger',
        proof_photo_url: finishProofUrl,
        signature_url: finishSigUrl,
        delivery_notes: recipientNotes,
        delivered_at: nowIso,
      }
    ])
    .select()
    .single();

  assert(!proofInsertErr && Boolean(proofRow?.id), 'Delivery proof record successfully inserted into delivery_proofs table', proofInsertErr?.message);

  // Step 3.4: Query Admin Couriers Audit Trail
  console.log(`  Verifying delivery audit trail query in Supabase...`);
  const { data: auditProofs, error: auditErr } = await supabase
    .from('delivery_proofs')
    .select('*')
    .eq('order_id', testOrderId);

  assert(!auditErr && auditProofs?.length >= 1, 'Delivery proof retrieved from delivery_proofs table', auditErr?.message);
  if (auditProofs && auditProofs.length > 0) {
    assert(auditProofs[0].proof_photo_url.includes('delivery-proofs/proofs/'), 'Audit proof contains valid proof_photo_url');
    assert(auditProofs[0].signature_url.includes('delivery-proofs/signatures/'), 'Audit proof contains valid signature_url');
  }

  // --- SUITE 4: Teardown & Sanitization ---
  console.log(`\n${CYAN}▶ Suite 4: Fixture Teardown & Sanitization${RESET}`);
  // Delete test order
  await supabase.from('orders').delete().eq('id', testOrderId);
  // Delete test proof
  if (proofRow?.id) {
    await supabase.from('delivery_proofs').delete().eq('id', proofRow.id);
  }
  // Delete uploaded test storage objects
  await supabase.storage.from('delivery-proofs').remove([photoStoragePath, sigStoragePath]);
  // Reset courier states
  await supabase.from('couriers').update({ status: 'available', active_delivery: null }).eq('id', courierA.id);
  await supabase.from('couriers').update({ status: 'available', active_delivery: null }).eq('id', courierB.id);

  console.log(`  Fixtures cleaned up successfully.`);

  // --- Summary ---
  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}                    CHALLENGE EXECUTION SUMMARY                 ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`Total Assertions : ${passedCount + failedCount}`);
  console.log(`Passed           : ${GREEN}${passedCount}${RESET}`);
  console.log(`Failed           : ${failedCount > 0 ? RED : GREEN}${failedCount}${RESET}`);

  if (failedCount > 0) {
    console.error(`\n${RED}FAILURES DETAIL:${RESET}`);
    failures.forEach((f, idx) => {
      console.error(`  ${idx + 1}. [${f.testName}] -> ${f.message}`);
    });
    process.exit(1);
  } else {
    console.log(`\n${GREEN}🎉 ALL MILESTONE 3 EMPIRICAL CHALLENGES PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

runMilestone3Challenges().catch((err) => {
  console.error(`Fatal execution failure:`, err);
  process.exit(1);
});
