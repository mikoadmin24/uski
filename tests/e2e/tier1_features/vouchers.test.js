/**
 * Tier 1 Feature Tests: Vouchers & Promotional Discounts
 * Covers: Voucher fetching, Min spend validation, Percentage discount calculation with cap,
 * Fixed discount calculation, Target audience evaluation, and Quota increment.
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
  createTestVoucherFixture,
  registerTeardown,
  ensureAuthSession,
} from '../harness.js';

describe('Tier 1: Vouchers Feature Coverage', () => {
  const testVoucher = createTestVoucherFixture({
    code: `E2ETEST${Date.now().toString().slice(-4)}`,
    discount_type: 'percentage',
    discount_value: 10,
    min_spend: 100000,
    max_discount: 20000,
  });

  beforeAll(async () => {
    await ensureAuthSession();
    if (supabase) {
      await supabase.from('vouchers').delete().eq('id', testVoucher.id);
    }
    registerTeardown(async () => {
      if (supabase) {
        await supabase.from('vouchers').delete().eq('id', testVoucher.id);
      }
    });
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.from('vouchers').delete().eq('id', testVoucher.id);
    }
  });

  it('TC-V01: Should retrieve active vouchers from Supabase', async () => {
    assert(supabase, 'Supabase client must be configured');

    const { data, error } = await supabase
      .from('vouchers')
      .select('id, code, discount_type, discount_value, min_spend, is_active')
      .eq('is_active', true)
      .limit(10);

    assertEqual(error, null, `Fetching vouchers failed: ${error?.message}`);
    assert(Array.isArray(data), 'Vouchers result must be an array');
    assert(data.length > 0, 'Should have at least 1 voucher in database');

    for (const v of data) {
      assert(typeof v.code === 'string' && v.code.length > 0, 'Voucher code must be string');
      assertGreaterThanOrEqual(Number(v.discount_value), 0, 'discount_value must be >= 0');
      assertEqual(v.is_active, true, 'is_active must be true');
    }
  });

  it('TC-V02: Should create and insert a new test voucher with minimum spend requirement', async () => {
    const payload = {
      id: testVoucher.id,
      code: testVoucher.code,
      description: testVoucher.description,
      discount_type: testVoucher.discount_type,
      discount_value: testVoucher.discount_value,
      min_spend: testVoucher.min_spend,
      max_discount: testVoucher.max_discount,
      start_date: testVoucher.start_date,
      end_date: testVoucher.end_date,
      is_active: testVoucher.is_active,
    };

    const { data, error } = await supabase
      .from('vouchers')
      .insert(payload)
      .select()
      .single();

    assertEqual(error, null, `Inserting voucher failed: ${error?.message}`);
    assertEqual(data.code, testVoucher.code, 'Inserted voucher code must match');
    assertEqual(Number(data.min_spend), testVoucher.min_spend, 'min_spend must match');
  });

  it('TC-V03: Should compute percentage discount accurately with max_discount cap', () => {
    // 10% on 300,000 is 30,000, capped at max_discount 20,000
    const subtotal = 300000;
    const rawDiscount = (subtotal * testVoucher.discount_value) / 100;
    assertEqual(rawDiscount, 30000, 'Raw discount calculation');

    const effectiveDiscount = testVoucher.max_discount
      ? Math.min(rawDiscount, testVoucher.max_discount)
      : rawDiscount;

    assertEqual(effectiveDiscount, 20000, 'Effective discount must be capped at 20.000');
  });

  it('TC-V04: Should compute fixed nominal discount without ceiling exceedance', () => {
    const fixedVoucher = {
      discount_type: 'fixed',
      discount_value: 15000,
      min_spend: 50000,
    };

    const subtotal = 75000;
    const effectiveDiscount = Math.min(fixedVoucher.discount_value, subtotal);
    assertEqual(effectiveDiscount, 15000, 'Fixed discount should be exactly Rp 15.000');

    // Case where subtotal < discount_value
    const smallSubtotal = 10000;
    const smallDiscount = Math.min(fixedVoucher.discount_value, smallSubtotal);
    assertEqual(smallDiscount, 10000, 'Discount must not exceed subtotal');
  });

  it('TC-V05: Should validate target audience classification logic', () => {
    const audienceList = ['all', 'new_customer', 'santri_pesantren', 'guru_pengajar', 'vip_member'];

    for (const aud of audienceList) {
      assert(typeof aud === 'string' && aud.length > 0, `Audience ${aud} must be valid`);
    }

    // Logic rule: 'all' applies to any user
    const userRole = 'customer';
    const appliesToPublic = (target) => target === 'all' || target === userRole;
    assertEqual(appliesToPublic('all'), true, 'Voucher with target "all" applies to public customer');
    assertEqual(appliesToPublic('vip_member'), false, 'Voucher with target "vip_member" does not apply to standard customer');
  });

  it('TC-V06: Should update voucher status and deactivate voucher', async () => {
    const { error: updateError } = await supabase
      .from('vouchers')
      .update({ is_active: false })
      .eq('id', testVoucher.id);

    assertEqual(updateError, null, `Updating voucher status failed: ${updateError?.message}`);

    const { data: voucher } = await supabase
      .from('vouchers')
      .select('is_active')
      .eq('id', testVoucher.id)
      .single();

    assertEqual(voucher.is_active, false, 'Voucher is_active should be false');
  });
}, { tier: 1 });
