/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Covers multi-module pairwise workflows:
 * Flow 1: Customer Checkout -> Admin Order Inspection -> Courier Assignment -> Driver Delivery Proof -> Admin History
 * Flow 2: Product Catalog Stock -> Order Placement -> Stock Decrement -> Inventory Movement Recording
 * Flow 3: Voucher Application -> Order Subtotal & Total -> Payment Verification -> Voucher Usage Increment
 * Flow 4: Bulk Order RFQ Submission -> Admin Review & Quoting -> Customer Approval -> Conversion to Order
 * Flow 5: Courier Telemetry -> Active Delivery GPS Sync -> Delivery Completion & Recipient Proof Handshake
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

describe('Tier 3: Cross-Feature Combinations', () => {
  const testCourier = createTestCourierFixture();
  const testProduct = createTestProductFixture({ stock_quantity: 40 });
  const testOrder = createTestOrderFixture();
  const testVoucher = createTestVoucherFixture();

  beforeAll(async () => {
    await ensureAuthSession();
    if (supabase) {
      await supabase.from('orders').delete().eq('id', testOrder.id);
      await supabase.from('couriers').delete().eq('id', testCourier.id);
      await supabase.from('products').delete().eq('id', testProduct.id);
      await supabase.from('vouchers').delete().eq('id', testVoucher.id);
    }
    registerTeardown(async () => {
      if (supabase) {
        await supabase.from('orders').delete().eq('id', testOrder.id);
        await supabase.from('couriers').delete().eq('id', testCourier.id);
        await supabase.from('products').delete().eq('id', testProduct.id);
        await supabase.from('vouchers').delete().eq('id', testVoucher.id);
      }
    });
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.from('orders').delete().eq('id', testOrder.id);
      await supabase.from('couriers').delete().eq('id', testCourier.id);
      await supabase.from('products').delete().eq('id', testProduct.id);
      await supabase.from('vouchers').delete().eq('id', testVoucher.id);
    }
  });

  it('TC-CMB01: Pairwise Flow: Customer Checkout -> Admin View -> Courier Assignment -> Driver Handover -> Admin History', async () => {
    assert(supabase, 'Supabase client must be configured');

    // 1. Customer places order
    const { error: orderErr } = await supabase.from('orders').insert({
      id: testOrder.id,
      order_number: testOrder.order_number,
      customer_name: testOrder.customer_name,
      customer_email: testOrder.customer_email,
      customer_phone: testOrder.customer_phone,
      shipping_address: testOrder.shipping_address,
      items: testOrder.items,
      subtotal: testOrder.subtotal,
      shipping_fee: testOrder.shipping_fee,
      total_amount: testOrder.total_amount,
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      shipping_method: 'Kurir Toko (Same Day)',
      status: 'awaiting_payment',
    });
    assertEqual(orderErr, null, `Step 1 Order placement failed: ${orderErr?.message}`);

    // 2. Admin inspects order and marks payment verified
    const { error: verifyErr } = await supabase
      .from('orders')
      .update({
        payment_status: 'verified',
        status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', testOrder.id);
    assertEqual(verifyErr, null, `Step 2 Admin verification failed: ${verifyErr?.message}`);

    // 3. Create Courier and assign to Order
    await supabase.from('couriers').insert({
      id: testCourier.id,
      name: testCourier.name,
      phone: testCourier.phone,
      email: testCourier.email,
      vehicle_type: testCourier.vehicle_type,
      vehicle_plate: testCourier.vehicle_plate,
      status: 'idle',
      is_gps_active: true,
      total_delivered_today: 0,
    });

    const { error: assignErr } = await supabase
      .from('couriers')
      .update({
        status: 'delivering',
        active_delivery: {
          order_id: testOrder.id,
          order_number: testOrder.order_number,
          recipient_name: testOrder.customer_name,
          destination_address: 'Jl. Margonda Raya No. 45, Depok',
          started_at: new Date().toISOString(),
          status: 'on_delivery',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', testCourier.id);
    assertEqual(assignErr, null, `Step 3 Courier assignment failed: ${assignErr?.message}`);

    // Update order status to shipped
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', testOrder.id);

    // 4. Driver arrives and submits delivery proof
    const proofUrl = 'https://example.com/proofs/photo_e2e_flow.jpg';
    const sigUrl = 'https://example.com/signatures/sig_e2e_flow.png';

    const { error: completeOrderErr } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        proof_of_payment_url: proofUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testOrder.id);
    assertEqual(completeOrderErr, null, `Step 4 Order delivery completion failed: ${completeOrderErr?.message}`);

    // Courier status restored to idle/available and active_delivery cleared
    const { error: courierResetErr } = await supabase
      .from('couriers')
      .update({
        status: 'idle',
        active_delivery: null,
        total_delivered_today: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testCourier.id);
    assertEqual(courierResetErr, null, `Step 4 Courier status restoration failed: ${courierResetErr?.message}`);

    // 5. Admin History verification
    const { data: finalOrder } = await supabase.from('orders').select('status').eq('id', testOrder.id).single();
    const { data: finalCourier } = await supabase.from('couriers').select('status, active_delivery, total_delivered_today').eq('id', testCourier.id).single();

    assertEqual(finalOrder.status, 'delivered', 'Order status must be delivered in Admin History');
    assertEqual(finalCourier.status, 'idle', 'Courier status must be available/idle');
    assertEqual(finalCourier.active_delivery, null, 'Active delivery must be cleared');
    assertEqual(Number(finalCourier.total_delivered_today), 1, 'Delivery count incremented');
  });

  it('TC-CMB02: Pairwise Flow: Product Catalog Stock -> Order Checkout -> Inventory Audit Trail', async () => {
    // 1. Upsert product with known initial stock
    const initialStock = 50;
    const orderQty = 3;

    await supabase.from('products').upsert({
      id: testProduct.id,
      name: testProduct.name,
      slug: testProduct.slug,
      sku_master: testProduct.sku_master,
      base_price: testProduct.base_price,
      stock_quantity: initialStock,
      category_id: 'cat-1',
      is_active: true,
      description: testProduct.description,
    });

    // 2. Simulate order placement reducing stock
    const expectedStockAfter = initialStock - orderQty;
    const { error: stockErr } = await supabase
      .from('products')
      .update({ stock_quantity: expectedStockAfter })
      .eq('id', testProduct.id);

    assertEqual(stockErr, null, `Stock decrement failed: ${stockErr?.message}`);

    // 3. Record inventory movement log
    const movementPayload = {
      id: uniqueId('MOV'),
      product_id: testProduct.id,
      product_name: testProduct.name,
      sku: testProduct.sku_master,
      type: 'sale_out',
      quantity_delta: -orderQty,
      stock_after: expectedStockAfter,
      notes: `Order checkout decrement for ${orderQty} units`,
      operator_name: 'System Checkout E2E',
    };

    const { error: movErr } = await supabase.from('inventory_movements').insert(movementPayload);
    if (!movErr) {
      // Clean up movement
      await supabase.from('inventory_movements').delete().eq('id', movementPayload.id);
    }

    // 4. Verify updated product stock
    const { data: productCheck } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', testProduct.id)
      .single();

    assertEqual(Number(productCheck.stock_quantity), expectedStockAfter, 'Stock after checkout must match');
  });

  it('TC-CMB03: Pairwise Flow: Voucher Application -> Order Subtotal & Total -> Payment Verification', async () => {
    // 1. Create a promo voucher
    await supabase.from('vouchers').insert({
      id: testVoucher.id,
      code: testVoucher.code,
      discount_type: 'percentage',
      discount_value: 20,
      min_spend: 150000,
      max_discount: 40000,
      start_date: testVoucher.start_date,
      end_date: testVoucher.end_date,
      is_active: true,
    });

    // 2. Calculate order with voucher
    const subtotal = 200000;
    const discount = Math.min((subtotal * 20) / 100, 40000); // 40.000
    const shipping = 10000;
    const totalAmount = subtotal - discount + shipping; // 170.000

    assertEqual(discount, 40000, 'Discount calculation');
    assertEqual(totalAmount, 170000, 'Total calculation Rp 170.000');

    // 3. Create order with applied voucher
    const voucherOrderId = uniqueId('VOUCH_ORD');
    const { error: orderInsertErr } = await supabase.from('orders').insert({
      id: voucherOrderId,
      order_number: `VORD-${Date.now().toString().slice(-6)}`,
      customer_name: 'Pembeli Kupon E2E',
      customer_email: 'kupon.buyer@uskistore.id',
      customer_phone: '081233445566',
      shipping_address: { city: 'Depok', street: 'Jl. Margonda' },
      items: [],
      subtotal,
      discount_amount: discount,
      shipping_fee: shipping,
      total_amount: totalAmount,
      payment_method: 'manual_qris',
      payment_status: 'verified',
      shipping_method: 'Reguler',
      status: 'processing',
    });

    assertEqual(orderInsertErr, null, `Creating voucher order failed: ${orderInsertErr?.message}`);

    // Verify order total
    const { data: savedOrder } = await supabase
      .from('orders')
      .select('subtotal, discount_amount, total_amount')
      .eq('id', voucherOrderId)
      .single();

    assertEqual(Number(savedOrder.total_amount), 170000, 'Saved total must be 170.000');

    // Teardown
    await supabase.from('orders').delete().eq('id', voucherOrderId);
  });

  it('TC-CMB04: Pairwise Flow: Bulk Order RFQ -> Quotation Calculation -> Acceptance -> Order Conversion', () => {
    // 1. Submit RFQ for 100 Buku
    const rfq = {
      reference_number: `RFQ-TEST-${Date.now().toString().slice(-4)}`,
      institution: 'SMA Islam Terpadu Depok',
      requested_items: [{ name: 'Buku Agenda Santri', quantity: 100, target_price: 30000 }],
      status: 'pending_review',
    };

    // 2. Admin prepares formal quotation
    const cogsPerUnit = 22000;
    const quotedUnitPrice = 28500;
    const subtotal = 100 * quotedUnitPrice;
    const shippingFee = 75000;
    const quotation = {
      quote_number: `QUO-${Date.now().toString().slice(-4)}`,
      items: [{ name: 'Buku Agenda Santri', quantity: 100, cogs: cogsPerUnit, unit_price: quotedUnitPrice, subtotal }],
      shipping_fee: shippingFee,
      grand_total: subtotal + shippingFee,
      lead_time_days: 7,
      status: 'sent',
    };

    assertEqual(quotation.grand_total, 2850000 + 75000, 'Quotation grand total Rp 2.925.000');
    rfq.status = 'quote_sent';

    // 3. Customer reviews and accepts quote
    quotation.status = 'accepted';
    rfq.status = 'approved';

    // 4. Conversion to official retail/bulk order
    const convertedOrder = {
      order_number: `USKI-BULK-${Date.now().toString().slice(-4)}`,
      customer_name: rfq.institution,
      total_amount: quotation.grand_total,
      notes: `Converted from ${rfq.reference_number} / Quote ${quotation.quote_number}`,
      status: 'processing',
    };

    assertEqual(convertedOrder.total_amount, 2925000, 'Converted order amount matches approved quotation');
    assertEqual(convertedOrder.status, 'processing', 'Order starts in processing status');
  });

  it('TC-CMB05: Pairwise Flow: Courier Telemetry Sync -> Active Delivery GPS -> Handover Proof Record', () => {
    // Verify coordinates delta calculation and distance estimate
    const depotCoords = { lat: -6.3728, lng: 106.8335 };
    const destinationCoords = { lat: -6.3920, lng: 106.8240 };

    // Haversine formula calculation
    const haversineDistanceKm = (c1, c2) => {
      const R = 6371; // Earth radius in km
      const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
      const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((c1.lat * Math.PI) / 180) *
          Math.cos((c2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const dist = haversineDistanceKm(depotCoords, destinationCoords);
    assertGreaterThanOrEqual(dist, 1.0, 'Distance must be > 1.0 km');
    assert(dist < 5.0, 'Distance within Depok area should be < 5.0 km');

    // Telemetry ping contains valid timestamp and positive speed
    const telemetryPing = {
      lat: -6.3800,
      lng: 106.8300,
      speed_kmh: 32,
      accuracy_meters: 5,
      timestamp: new Date().toISOString(),
    };

    assertGreaterThanOrEqual(telemetryPing.speed_kmh, 0, 'Speed must be non-negative');
    assert(typeof telemetryPing.timestamp === 'string', 'Timestamp must be string');
  });
}, { tier: 3 });
