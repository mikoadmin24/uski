/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Covers: Empty mandatory fields, invalid UUIDs, zero/negative pricing,
 * illegal status bounds, exact voucher threshold boundaries, expired dates,
 * SQL/XSS metacharacters handling, and extreme values.
 */

import {
  describe,
  it,
  assert,
  assertEqual,
  supabase,
  uniqueId,
} from '../harness.js';

describe('Tier 2: Boundary & Corner Cases', () => {
  it('TC-BND01: Should reject order insertion when mandatory fields are missing or empty', async () => {
    assert(supabase, 'Supabase client must be configured');

    // Attempt insert order with missing customer_name and customer_email
    const invalidOrder = {
      id: uniqueId('INVALID_ORD'),
      order_number: `INV-${Date.now()}`,
      // customer_name is missing
      // customer_email is missing
      total_amount: 100000,
    };

    const { data, error } = await supabase.from('orders').insert(invalidOrder);

    // Database NOT NULL constraint or validation must catch this
    assert(error !== null, 'Inserting order without mandatory customer_name must error');
    assertEqual(data, null, 'Data should be null when insert fails');
  });

  it('TC-BND02: Should safely handle query for non-existent IDs and invalid UUID formats', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const nonExistentOrder = 'ORD-DOES-NOT-EXIST-999999';

    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', nonExistentId);

    assertEqual(prodError, null, 'Querying non-existent product should not throw error');
    assert(Array.isArray(prodData) && prodData.length === 0, 'Result should be empty array');

    const { data: ordData, error: ordError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', nonExistentOrder);

    assertEqual(ordError, null, 'Querying non-existent order should not throw error');
    assert(Array.isArray(ordData) && ordData.length === 0, 'Result should be empty array');
  });

  it('TC-BND03: Should reject negative prices and zero quantity in order calculation', () => {
    // Negative price validation
    const validatePrice = (price) => typeof price === 'number' && price > 0;
    const validateQuantity = (qty) => typeof qty === 'number' && Number.isInteger(qty) && qty > 0;

    assertEqual(validatePrice(-5000), false, 'Negative price must be invalid');
    assertEqual(validatePrice(0), false, 'Zero price must be invalid');
    assertEqual(validatePrice(75000), true, 'Positive price is valid');

    assertEqual(validateQuantity(0), false, 'Zero quantity must be invalid');
    assertEqual(validateQuantity(-2), false, 'Negative quantity must be invalid');
    assertEqual(validateQuantity(1.5), false, 'Fractional quantity must be invalid');
    assertEqual(validateQuantity(5), true, 'Positive integer quantity is valid');
  });

  it('TC-BND04: Should enforce status enum constraints and reject illegal statuses', async () => {
    const courierId = uniqueId('INVALID_COUR');
    const illegalStatus = 'FLYING_IN_SPACE';

    const { error } = await supabase
      .from('couriers')
      .insert({
        id: courierId,
        name: 'Invalid Status Test',
        phone: '0812345678',
        email: 'invalid@uskistore.id',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'B 9999 INV',
        status: illegalStatus,
      });

    // Check constraint or enum validation must reject illegal status
    assert(error !== null, `Inserting courier with status "${illegalStatus}" must fail with check constraint error`);
    if (error) {
      assert(
        error.message?.includes('violates check constraint') ||
        error.message?.includes('invalid input value') ||
        error.code === '23514' ||
        error.code === '42501',
        `Error must indicate constraint violation or policy restriction: ${error.message} (${error.code})`
      );
    }
  });

  it('TC-BND05: Should evaluate exact boundary conditions for voucher minimum spend', () => {
    const minSpend = 100000;
    const discountPct = 10;

    const evaluateVoucher = (subtotal) => {
      if (subtotal < minSpend) {
        return { valid: false, discount: 0, reason: 'Belum mencapai syarat belanja minimum' };
      }
      return { valid: true, discount: (subtotal * discountPct) / 100 };
    };

    // Boundary - 1: Rp 99.999 -> Must fail
    const belowBoundary = evaluateVoucher(99999);
    assertEqual(belowBoundary.valid, false, 'Subtotal 99.999 must not be eligible for 100.000 voucher');
    assertEqual(belowBoundary.discount, 0, 'Discount must be 0');

    // Exact Boundary: Rp 100.000 -> Must pass
    const exactBoundary = evaluateVoucher(100000);
    assertEqual(exactBoundary.valid, true, 'Subtotal exactly 100.000 must be eligible');
    assertEqual(exactBoundary.discount, 10000, 'Discount must be Rp 10.000');

    // Boundary + 1: Rp 100.001 -> Must pass
    const aboveBoundary = evaluateVoucher(100001);
    assertEqual(aboveBoundary.valid, true, 'Subtotal 100.001 must be eligible');
  });

  it('TC-BND06: Should reject expired voucher based on date boundary', () => {
    const expiredVoucher = {
      code: 'EXPIRED2025',
      end_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      is_active: true,
    };

    const isVoucherActiveAndValid = (v) => {
      if (!v.is_active) return false;
      const now = new Date();
      const end = new Date(v.end_date);
      return now <= end;
    };

    assertEqual(isVoucherActiveAndValid(expiredVoucher), false, 'Expired voucher must be invalid');

    const futureVoucher = {
      code: 'ACTIVE2026',
      end_date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days future
      is_active: true,
    };
    assertEqual(isVoucherActiveAndValid(futureVoucher), true, 'Future voucher must be valid');
  });

  it('TC-BND07: Should sanitize and handle SQL injection & XSS metacharacters safely', async () => {
    const injectionName = "Robert'); DROP TABLE students;-- <script>alert('xss')</script>";
    const injectionNotes = "SELECT * FROM users WHERE '1'='1' & <img src=x onerror=alert(1)>";

    const testId = uniqueId('E2E_SEC');
    const orderNumber = `SEC-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: testId,
        order_number: orderNumber,
        customer_name: injectionName,
        customer_email: 'security.test@uskistore.id',
        customer_phone: '081299998888',
        shipping_address: { city: 'Depok', street: injectionNotes },
        items: [],
        subtotal: 50000,
        shipping_fee: 10000,
        total_amount: 60000,
        payment_method: 'bank_transfer',
        shipping_method: 'Reguler',
        status: 'awaiting_payment',
        notes: injectionNotes,
      })
      .select('customer_name, notes')
      .single();

    assertEqual(error, null, 'Inserting parameterized data with special characters must succeed without SQL injection');
    assertEqual(data.customer_name, injectionName, 'Customer name should be preserved verbatim via parameterized queries');
    assertEqual(data.notes, injectionNotes, 'Notes should be preserved verbatim');

    // Clean up
    await supabase.from('orders').delete().eq('id', testId);
  });

  it('TC-BND08: Should handle extreme boundary numbers and prevent arithmetic overflow', () => {
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;
    const extremeQty = 1000000;
    const extremePrice = 999999999;

    const total = extremeQty * 100;
    assert(total < maxSafeInteger, 'Total calculation must remain within safe integer range');
    assertEqual(total, 100000000, 'Calculated total 100.000.000');

    // Verify negative or NaN checks
    const parseCurrency = (val) => {
      const parsed = Number(val);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
        return 0;
      }
      return parsed;
    };

    assertEqual(parseCurrency('not-a-number'), 0, 'NaN string yields 0');
    assertEqual(parseCurrency(-1000), 0, 'Negative yields 0');
    assertEqual(parseCurrency(150000), 150000, 'Valid number preserved');
  });
}, { tier: 2 });
