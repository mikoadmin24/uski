/**
 * Tier 1 Feature Tests: Orders & Checkout Lifecycle
 * Covers: Order creation, Order query by number, Status transitions, Payment proof attachment,
 * Voucher discount arithmetic, and Relational items association.
 */

import {
  describe,
  it,
  beforeAll,
  afterAll,
  assert,
  assertEqual,
  supabase,
  createTestOrderFixture,
  registerTeardown,
  ensureAuthSession,
} from '../harness.js';

describe('Tier 1: Orders Feature Coverage', () => {
  const testOrder = createTestOrderFixture();

  beforeAll(async () => {
    await ensureAuthSession();
    if (supabase) {
      try {
        await supabase.from('order_items').delete().eq('order_id', testOrder.id);
      } catch {
        // ignore
      }
      await supabase.from('orders').delete().eq('id', testOrder.id);
    }
    registerTeardown(async () => {
      if (supabase) {
        try {
          await supabase.from('order_items').delete().eq('order_id', testOrder.id);
        } catch {
          // ignore
        }
        await supabase.from('orders').delete().eq('id', testOrder.id);
      }
    });
  });

  afterAll(async () => {
    if (supabase) {
      try {
        await supabase.from('order_items').delete().eq('order_id', testOrder.id);
      } catch {
        // ignore
      }
      await supabase.from('orders').delete().eq('id', testOrder.id);
    }
  });

  it('TC-O01: Should create a new retail order in Supabase with customer and item details', async () => {
    assert(supabase, 'Supabase client must be configured');

    const orderPayload = {
      id: testOrder.id,
      order_number: testOrder.order_number,
      customer_name: testOrder.customer_name,
      customer_email: testOrder.customer_email,
      customer_phone: testOrder.customer_phone,
      shipping_address: testOrder.shipping_address,
      items: testOrder.items,
      subtotal: testOrder.subtotal,
      discount_amount: testOrder.discount_amount,
      shipping_fee: testOrder.shipping_fee,
      total_amount: testOrder.total_amount,
      payment_method: testOrder.payment_method,
      payment_status: testOrder.payment_status,
      shipping_method: testOrder.shipping_method,
      status: testOrder.status,
      notes: testOrder.notes,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    assertEqual(error, null, `Inserting order failed: ${error?.message}`);
    assertEqual(data.id, testOrder.id, 'Inserted order id must match');
    assertEqual(data.order_number, testOrder.order_number, 'Inserted order_number must match');
    assertEqual(Number(data.total_amount), testOrder.total_amount, 'total_amount must match');
  });

  it('TC-O02: Should retrieve order by unique order_number', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', testOrder.order_number)
      .single();

    assertEqual(error, null, `Fetching order by order_number failed: ${error?.message}`);
    assert(data !== null, 'Order should be found');
    assertEqual(data.id, testOrder.id, 'Retrieved order id must match created order');
    assertEqual(data.customer_name, testOrder.customer_name, 'Customer name must match');
  });

  it('TC-O03: Should transition order status through lifecycle (awaiting_payment -> processing -> shipped)', async () => {
    const statuses = ['processing', 'shipped'];

    for (const st of statuses) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: st, updated_at: new Date().toISOString() })
        .eq('id', testOrder.id);

      assertEqual(updateError, null, `Updating order status to ${st} failed: ${updateError?.message}`);

      const { data: checkData, error: checkError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', testOrder.id)
        .single();

      assertEqual(checkError, null, `Checking order status failed: ${checkError?.message}`);
      assertEqual(checkData.status, st, `Order status should now be ${st}`);
    }
  });

  it('TC-O04: Should attach payment proof URL and update payment status to pending/verified', async () => {
    const testProofUrl = 'https://example.com/receipts/test-proof-e2e.jpg';

    const { error: proofError } = await supabase
      .from('orders')
      .update({
        proof_of_payment_url: testProofUrl,
        payment_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', testOrder.id);

    assertEqual(proofError, null, `Updating proof of payment failed: ${proofError?.message}`);

    const { data, error } = await supabase
      .from('orders')
      .select('proof_of_payment_url, payment_status')
      .eq('id', testOrder.id)
      .single();

    assertEqual(error, null, `Fetching order after payment proof failed: ${error?.message}`);
    assertEqual(data.proof_of_payment_url, testProofUrl, 'Proof URL must be stored');
    assertEqual(data.payment_status, 'verified', 'Payment status must be verified');
  });

  it('TC-O05: Should verify discount voucher application arithmetic (subtotal - discount + shipping = total)', async () => {
    const subtotal = 250000;
    const discount = 25000;
    const shipping = 20000;
    const expectedTotal = subtotal - discount + shipping;

    const discountOrder = createTestOrderFixture({
      subtotal,
      discount_amount: discount,
      shipping_fee: shipping,
      total_amount: expectedTotal,
      voucher_code: 'DISKON10PERSEN',
    });

    const payload = {
      id: discountOrder.id,
      order_number: discountOrder.order_number,
      customer_name: discountOrder.customer_name,
      customer_email: discountOrder.customer_email,
      customer_phone: discountOrder.customer_phone,
      shipping_address: discountOrder.shipping_address,
      items: discountOrder.items,
      subtotal: discountOrder.subtotal,
      discount_amount: discountOrder.discount_amount,
      shipping_fee: discountOrder.shipping_fee,
      total_amount: discountOrder.total_amount,
      payment_method: discountOrder.payment_method,
      payment_status: discountOrder.payment_status,
      shipping_method: discountOrder.shipping_method,
      status: discountOrder.status,
    };

    // If voucher_code column exists, verify it attaches
    const { data, error } = await supabase.from('orders').insert(payload).select().single();
    assertEqual(error, null, `Creating order with discount failed: ${error?.message}`);

    const calculatedTotal = Number(data.subtotal) - Number(data.discount_amount) + Number(data.shipping_fee);
    assertEqual(calculatedTotal, Number(data.total_amount), 'Calculated total must strictly match total_amount');
    assertEqual(Number(data.total_amount), 245000, 'Total amount must equal Rp 245.000');

    // Cleanup discountOrder
    await supabase.from('orders').delete().eq('id', discountOrder.id);
  });

  it('TC-O06: Should persist and associate items in order JSON structure', async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('items')
      .eq('id', testOrder.id)
      .single();

    assertEqual(error, null, `Fetching items failed: ${error?.message}`);
    assert(Array.isArray(data.items), 'Order items must be an array');
    assertEqual(data.items.length, testOrder.items.length, 'Items count must match');
    assertEqual(data.items[0].product_name, testOrder.items[0].product_name, 'Item product name must match');
    assertEqual(Number(data.items[0].price), testOrder.items[0].price, 'Item unit price must match');
  });
}, { tier: 1 });
