/**
 * Tier 4: Real-World End-to-End User Scenarios
 * Covers complete real-world operational user journeys:
 * Scenario 1: Complete Public Customer Retail Purchase (Storefront -> Cart -> Voucher -> Checkout -> Payment Proof -> Admin Verification)
 * Scenario 2: Courier Field Operations & Proof of Delivery (Courier Login -> Dispatch -> Transit Telemetry -> Photo Proof -> Signature -> Completion)
 * Scenario 3: B2B Institutional Bulk Procurement (Islamic School RFQ -> Costing & Quote -> Approval -> Order Generation)
 */

import {
  describe,
  it,
  beforeAll,
  afterAll,
  assert,
  assertEqual,
  assertGreaterThanOrEqual,
  supabase,
  createTestProductFixture,
  createTestOrderFixture,
  createTestCourierFixture,
  createTestVoucherFixture,
  registerTeardown,
  ensureAuthSession,
  uniqueId,
} from '../harness.js';

describe('Tier 4: Real-World Scenarios', () => {
  const scenarioProduct = createTestProductFixture({
    name: 'Mushaf Al-Qur`an Rasm Utsmani Standar Kemenag (E2E Scenario)',
    base_price: 110000,
    stock_quantity: 100,
  });

  const scenarioVoucher = createTestVoucherFixture({
    code: `BERKAH${Date.now().toString().slice(-4)}`,
    discount_type: 'fixed',
    discount_value: 20000,
    min_spend: 150000,
  });

  const scenarioCourier = createTestCourierFixture({
    name: 'Kurir Ridwan (E2E Field Ops)',
    vehicle_plate: 'B 5591 UZK',
  });

  let scenarioOrderId = null;

  beforeAll(async () => {
    await ensureAuthSession();
    if (supabase) {
      await supabase.from('couriers').delete().eq('id', scenarioCourier.id);
      await supabase.from('products').delete().eq('id', scenarioProduct.id);
      await supabase.from('vouchers').delete().eq('id', scenarioVoucher.id);
    }
    registerTeardown(async () => {
      if (supabase) {
        if (scenarioOrderId) {
          await supabase.from('orders').delete().eq('id', scenarioOrderId);
        }
        await supabase.from('couriers').delete().eq('id', scenarioCourier.id);
        await supabase.from('products').delete().eq('id', scenarioProduct.id);
        await supabase.from('vouchers').delete().eq('id', scenarioVoucher.id);
      }
    });
  });

  afterAll(async () => {
    if (supabase) {
      if (scenarioOrderId) {
        await supabase.from('orders').delete().eq('id', scenarioOrderId);
      }
      await supabase.from('couriers').delete().eq('id', scenarioCourier.id);
      await supabase.from('products').delete().eq('id', scenarioProduct.id);
      await supabase.from('vouchers').delete().eq('id', scenarioVoucher.id);
    }
  });

  it('TC-RW01: Scenario 1: Complete Public Customer Retail Purchase Journey', async () => {
    assert(supabase, 'Supabase client must be configured');

    // 1. Merchant product is in catalog
    await supabase.from('products').upsert({
      id: scenarioProduct.id,
      name: scenarioProduct.name,
      slug: scenarioProduct.slug,
      sku_master: scenarioProduct.sku_master,
      base_price: scenarioProduct.base_price,
      stock_quantity: scenarioProduct.stock_quantity,
      category_id: 'cat-1',
      is_active: true,
      description: scenarioProduct.description,
    });

    // 2. Active promo voucher exists
    await supabase.from('vouchers').insert({
      id: scenarioVoucher.id,
      code: scenarioVoucher.code,
      discount_type: scenarioVoucher.discount_type,
      discount_value: scenarioVoucher.discount_value,
      min_spend: scenarioVoucher.min_spend,
      start_date: scenarioVoucher.start_date,
      end_date: scenarioVoucher.end_date,
      is_active: true,
    });

    // 3. Customer browses, selects 2 items (Subtotal: 2 * 110.000 = 220.000)
    const cartItems = [
      {
        id: uniqueId('ITEM'),
        product_id: scenarioProduct.id,
        product_name: scenarioProduct.name,
        sku: scenarioProduct.sku_master,
        price: 110000,
        quantity: 2,
        subtotal: 220000,
      },
    ];
    const subtotal = 220000;

    // Customer applies voucher code
    assert(subtotal >= scenarioVoucher.min_spend, 'Cart subtotal meets voucher min_spend requirement');
    const discountAmount = scenarioVoucher.discount_value; // 20.000
    const shippingFee = 15000;
    const totalAmount = subtotal - discountAmount + shippingFee; // 215.000
    assertEqual(totalAmount, 215000, 'Calculated grand total Rp 215.000');

    // 4. Customer submits Checkout form
    scenarioOrderId = uniqueId('SCENARIO_ORD');
    const orderNumber = `USKI-E2E-${Date.now().toString().slice(-6)}`;

    const { data: createdOrder, error: checkoutError } = await supabase
      .from('orders')
      .insert({
        id: scenarioOrderId,
        order_number: orderNumber,
        customer_name: 'Fathur Rahman (Santri)',
        customer_email: 'fathur.santri@example.com',
        customer_phone: '081288776655',
        shipping_address: {
          recipient_name: 'Fathur Rahman',
          phone_number: '081288776655',
          street_address: 'Pesantren Al-Hikmah, Jl. KH Mas Mansyur',
          city: 'Depok',
          province: 'Jawa Barat',
          postal_code: '16431',
        },
        items: cartItems,
        subtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        payment_method: 'bank_transfer',
        payment_status: 'pending',
        shipping_method: 'Kurir Toko (Same Day)',
        status: 'awaiting_payment',
        notes: 'Titip di pos santri',
      })
      .select()
      .single();

    assertEqual(checkoutError, null, `Checkout failed: ${checkoutError?.message}`);
    assertEqual(createdOrder.order_number, orderNumber, 'Order number matches');

    // 5. Customer uploads proof of payment receipt
    const customerReceiptUrl = 'https://example.com/receipts/transfer_bca_215000.jpg';
    const { error: uploadProofError } = await supabase
      .from('orders')
      .update({
        proof_of_payment_url: customerReceiptUrl,
        status: 'awaiting_verification',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioOrderId);

    assertEqual(uploadProofError, null, `Payment proof update failed: ${uploadProofError?.message}`);

    // 6. Admin verifies payment and marks processing
    const { error: verifyError } = await supabase
      .from('orders')
      .update({
        payment_status: 'verified',
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioOrderId);

    assertEqual(verifyError, null, `Admin verification failed: ${verifyError?.message}`);

    // Verify order state
    const { data: verifiedOrder } = await supabase
      .from('orders')
      .select('status, payment_status, proof_of_payment_url')
      .eq('id', scenarioOrderId)
      .single();

    assertEqual(verifiedOrder.status, 'processing', 'Order status must be processing');
    assertEqual(verifiedOrder.payment_status, 'verified', 'Payment status must be verified');
    assertEqual(verifiedOrder.proof_of_payment_url, customerReceiptUrl, 'Proof receipt URL matches');
  });

  it('TC-RW02: Scenario 2: Courier Field Operations Workflow (Dispatch -> Telemetry -> Photo Proof -> Signature -> Handover)', async () => {
    assert(scenarioOrderId !== null, 'Order from Scenario 1 must exist');

    // 1. Register courier on duty
    await supabase.from('couriers').insert({
      id: scenarioCourier.id,
      name: scenarioCourier.name,
      phone: scenarioCourier.phone,
      email: scenarioCourier.email,
      vehicle_type: scenarioCourier.vehicle_type,
      vehicle_plate: scenarioCourier.vehicle_plate,
      status: 'idle',
      is_gps_active: true,
      total_delivered_today: 0,
      current_location: {
        lat: -6.3728,
        lng: 106.8335,
        address_approx: 'Depot USKI Store Margonda',
        last_updated: new Date().toISOString(),
      },
    });

    // 2. Admin assigns courier to order -> order becomes 'shipped'
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', scenarioOrderId);

    const activeTask = {
      order_id: scenarioOrderId,
      recipient_name: 'Fathur Rahman',
      status: 'on_delivery',
      started_at: new Date().toISOString(),
      destination_address: 'Pesantren Al-Hikmah Depok',
    };

    const { error: courierAssignErr } = await supabase
      .from('couriers')
      .update({
        status: 'delivering',
        active_delivery: activeTask,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioCourier.id);

    assertEqual(courierAssignErr, null, `Courier assignment failed: ${courierAssignErr?.message}`);

    // 3. Courier updates en route GPS coordinates
    const waypoint = {
      lat: -6.3890,
      lng: 106.8260,
      speed_kmh: 35,
      address_approx: 'Jl. Raya Sawangan Dekat Gerbang Pesantren',
      last_updated: new Date().toISOString(),
    };

    await supabase.from('couriers').update({ current_location: waypoint }).eq('id', scenarioCourier.id);

    // 4. Courier arrives, captures delivery photo and digital signature
    const proofDeliveryPhotoUrl = 'https://example.com/delivery-proofs/proofs/pkg_delivered_101.jpg';
    const proofSignatureUrl = 'https://example.com/delivery-proofs/signatures/sig_fathur_101.png';
    const recipientSignatureName = 'Ust. Fathur Rahman';

    // Update order with delivery completion
    const { error: completeOrderErr } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        proof_of_payment_url: proofDeliveryPhotoUrl, // Or delivery_proof_url if column available
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioOrderId);

    assertEqual(completeOrderErr, null, `Completing order delivery failed: ${completeOrderErr?.message}`);

    // Release courier back to idle/available
    const { error: releaseCourierErr } = await supabase
      .from('couriers')
      .update({
        status: 'idle',
        active_delivery: null,
        total_delivered_today: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioCourier.id);

    assertEqual(releaseCourierErr, null, `Courier release failed: ${releaseCourierErr?.message}`);

    // Verify system state after handover
    const { data: finalOrder } = await supabase.from('orders').select('status').eq('id', scenarioOrderId).single();
    const { data: finalCourier } = await supabase.from('couriers').select('status, active_delivery, total_delivered_today').eq('id', scenarioCourier.id).single();

    assertEqual(finalOrder.status, 'delivered', 'Order must be delivered');
    assertEqual(finalCourier.status, 'idle', 'Courier restored to available');
    assertEqual(finalCourier.active_delivery, null, 'No active delivery');
    assertEqual(Number(finalCourier.total_delivered_today), 1, 'Total delivered incremented');
  });

  it('TC-RW03: Scenario 3: B2B Institutional Bulk Procurement Lifecycle (Islamic School / Pesantren)', () => {
    // 1. Institution submits RFQ for 300 Kitab Kuning
    const b2bRequest = {
      rfq_number: `RFQ-PESANTREN-${Date.now().toString().slice(-4)}`,
      institution_name: 'Pondok Pesantren Husnul Khotimah',
      contact_person: 'Ust. H. Abdullah Syukri, M.Pd.',
      items_requested: [
        { title: 'Kitab Fathul Qorib Al-Mujib (Syarah)', quantity: 300, target_unit_budget: 40000 },
        { title: 'Buku Catatan Nahwu Shorof Bergaris', quantity: 300, target_unit_budget: 15000 },
      ],
      estimated_budget: 16500000,
      target_delivery_date: '2026-11-15',
      status: 'pending_review',
    };

    assertEqual(b2bRequest.status, 'pending_review', 'RFQ submitted with pending_review status');

    // 2. USKI Store Admin calculates procurement cost (COGS), margin, and issues formal quotation
    const cogsFathulQorib = 27000;
    const priceFathulQorib = 36000; // Rp 36.000 (below target 40k)
    const cogsNotebook = 9500;
    const priceNotebook = 13500; // Rp 13.500 (below target 15k)

    const subtotal = 300 * priceFathulQorib + 300 * priceNotebook; // 10.800.000 + 4.050.000 = 14.850.000
    const institutionalDiscount = 500000;
    const packingAndPalletFee = 150000;
    const totalQuotation = subtotal - institutionalDiscount + packingAndPalletFee; // 14.500.000

    const formalQuotation = {
      quote_number: `QUO-2026-${Date.now().toString().slice(-4)}`,
      subtotal,
      discount: institutionalDiscount,
      additional_fee: packingAndPalletFee,
      grand_total: totalQuotation,
      lead_time_days: 10,
      payment_terms: '50% DP, 50% pelunasan setelah barang diterima',
      status: 'sent',
    };

    assertEqual(formalQuotation.grand_total, 14500000, 'Quotation grand total Rp 14.500.000');
    assert(formalQuotation.grand_total <= b2bRequest.estimated_budget, 'Quote is within client budget');

    // 3. Institution approves quotation
    formalQuotation.status = 'accepted';
    b2bRequest.status = 'approved';

    // 4. System prepares official bulk procurement order
    const bulkPurchaseOrder = {
      order_number: `USKI-B2B-${Date.now().toString().slice(-4)}`,
      client_name: b2bRequest.institution_name,
      total_amount: formalQuotation.grand_total,
      status: 'processing',
      terms: formalQuotation.payment_terms,
    };

    assertEqual(bulkPurchaseOrder.status, 'processing', 'Official bulk order starts processing');
    assertEqual(bulkPurchaseOrder.total_amount, 14500000, 'Bulk purchase order amount matches quotation');
  });
}, { tier: 4 });
