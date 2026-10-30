/**
 * USKI STORE E2E Test Suite - Core Test Harness
 * Provides suite registration, assertions, live Supabase client, fixtures, and teardown registry.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// 1. Load Environment Variables from .env if not present in process.env
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

export const supabaseUrl =
  process.env.VITE_SUPABASE_URL || 'https://kxbdoqviqzseymjofsjg.supabase.co';
export const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Ensure active Supabase Auth session as store admin
 * so Row-Level Security (RLS) permits backoffice and management operations.
 */
export async function ensureAuthSession() {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session) return true;
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: 'admin@uskistore.id',
      password: 'password123',
    });
    return Boolean(!error && loginData?.session);
  } catch (err) {
    console.warn('ensureAuthSession error:', err.message);
    return false;
  }
}

// 2. Global Test Registry
export const testSuites = [];
let currentSuite = null;
const globalTeardowns = [];

export function describe(name, fn, options = {}) {
  const suite = {
    name,
    tier: options.tier || 1,
    beforeAllHooks: [],
    afterAllHooks: [],
    tests: [],
  };
  const prevSuite = currentSuite;
  currentSuite = suite;
  testSuites.push(suite);

  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

export function it(name, fn) {
  if (!currentSuite) {
    throw new Error(`Test "${name}" must be defined inside a describe block.`);
  }
  currentSuite.tests.push({ name, fn });
}

export function beforeAll(fn) {
  if (currentSuite) {
    currentSuite.beforeAllHooks.push(fn);
  }
}

export function afterAll(fn) {
  if (currentSuite) {
    currentSuite.afterAllHooks.push(fn);
  }
}

export function registerTeardown(fn) {
  globalTeardowns.push(fn);
}

export async function runGlobalTeardowns() {
  for (const fn of globalTeardowns) {
    try {
      await fn();
    } catch (err) {
      console.warn('Teardown warning:', err.message);
    }
  }
  globalTeardowns.length = 0;
}

// 3. Assertion Library
export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected strict equality. Actual: [${actual}] (${typeof actual}), Expected: [${expected}] (${typeof expected})`
    );
  }
}

export function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new Error(message || `Expected values to differ. Both are [${actual}]`);
  }
}

export function assertTrue(val, message = 'Expected true') {
  assertEqual(val, true, message);
}

export function assertFalse(val, message = 'Expected false') {
  assertEqual(val, false, message);
}

export function assertGreaterThanOrEqual(actual, min, message) {
  if (typeof actual !== 'number' || actual < min) {
    throw new Error(message || `Expected ${actual} >= ${min}`);
  }
}

export function assertLessThanOrEqual(actual, max, message) {
  if (typeof actual !== 'number' || actual > max) {
    throw new Error(message || `Expected ${actual} <= ${max}`);
  }
}

export function assertMatch(str, regex, message) {
  if (typeof str !== 'string' || !regex.test(str)) {
    throw new Error(message || `Expected "${str}" to match pattern ${regex}`);
  }
}

export function assertIn(item, list, message) {
  if (!Array.isArray(list) || !list.includes(item)) {
    throw new Error(
      message || `Expected item [${item}] to be present in [${list?.join(', ')}]`
    );
  }
}

export function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Deep equality mismatch:\nActual:   ${actualStr}\nExpected: ${expectedStr}`
    );
  }
}

export async function assertRejects(asyncFn, message) {
  let threw = false;
  try {
    await asyncFn();
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(message || 'Expected asynchronous function to reject/throw.');
  }
}

// 4. Test Fixtures & Unique ID Helpers
export function uniqueId(prefix = 'E2E') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function createTestProductFixture(overrides = {}) {
  const id = uniqueId('E2E_PROD');
  return {
    id,
    name: `E2E Test Kitab Fiqih & Pena ${id}`,
    slug: `e2e-test-product-${id.toLowerCase()}`,
    sku_master: `E2E-SKU-${id}`,
    base_price: 75000,
    stock_quantity: 50,
    min_stock_alert: 5,
    weight_grams: 350,
    images: ['https://example.com/test-img.jpg'],
    description: 'Buku Fiqih Ibadah Edisi Santri untuk Pengujian E2E',
    specifications: { penerbit: 'USKI Press', halaman: '240', sampul: 'Hard Cover' },
    dimensions: { length_cm: 21, width_cm: 14, height_cm: 2 },
    is_active: true,
    is_featured: false,
    rating: 5.0,
    reviews_count: 0,
    sales_count: 0,
    category_id: 'cat-1',
    ...overrides,
  };
}

export function createTestOrderFixture(overrides = {}) {
  const id = uniqueId('E2E_ORD');
  const orderNumber = `E2E-USKI-${Date.now().toString().slice(-6)}`;
  return {
    id,
    order_number: orderNumber,
    customer_name: 'Ahmad Santoso (E2E Test)',
    customer_email: 'ahmad.test@uskistore.id',
    customer_phone: '081298765432',
    shipping_address: {
      id: uniqueId('ADDR'),
      user_id: 'user-e2e',
      recipient_name: 'Ahmad Santoso',
      phone_number: '081298765432',
      street_address: 'Jl. Margonda Raya No. 45',
      district: 'Beji',
      city: 'Depok',
      province: 'Jawa Barat',
      postal_code: '16424',
      is_primary: true,
    },
    items: [
      {
        id: uniqueId('ITEM'),
        order_id: id,
        product_id: 'prod-1',
        product_name: 'Mushaf Al-Qur`an Al-Karim Edisi Santri',
        sku: 'BK-QUR-001',
        price: 95000,
        quantity: 2,
        subtotal: 190000,
      },
    ],
    subtotal: 190000,
    discount_amount: 0,
    shipping_fee: 15000,
    total_amount: 205000,
    payment_method: 'bank_transfer',
    payment_status: 'pending',
    shipping_method: 'Kurir Toko (Same Day)',
    status: 'awaiting_payment',
    notes: 'Mohon dibungkus bubble wrap rapi',
    ...overrides,
  };
}

export function createTestCourierFixture(overrides = {}) {
  const id = uniqueId('E2E_COUR');
  return {
    id,
    name: `Kurir Hendra (E2E) ${id}`,
    phone: '085811223344',
    email: `hendra.${id.toLowerCase()}@uskistore.id`,
    vehicle_type: 'motorcycle',
    vehicle_plate: 'B 3819 UZK',
    status: 'available',
    is_gps_active: true,
    total_delivered_today: 0,
    current_location: {
      lat: -6.3728,
      lng: 106.8335,
      speed_kmh: 0,
      address_approx: 'Gudang Utama USKI Margonda',
      last_updated: new Date().toISOString(),
    },
    ...overrides,
  };
}

export function createTestVoucherFixture(overrides = {}) {
  const id = uniqueId('E2E_VOUCH');
  const code = `E2EPROMO${Date.now().toString().slice(-4)}`;
  return {
    id,
    code,
    description: 'Diskon Spesial Uji Coba E2E',
    discount_type: 'percentage',
    discount_value: 15,
    min_spend: 100000,
    max_discount: 30000,
    start_date: new Date(Date.now() - 3600000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    is_active: true,
    target_audience: 'all',
    target_audience_label: 'Semua Pelanggan (Publik)',
    usage_limit: 50,
    usage_count: 0,
    ...overrides,
  };
}

export function createTestBulkOrderFixture(overrides = {}) {
  const id = uniqueId('E2E_RFQ');
  const ref = `RFQ-${Date.now().toString().slice(-6)}`;
  return {
    id,
    reference_number: ref,
    customer_name: 'Ust. Zulkifli (Pesantren Darul Ulum)',
    customer_email: 'pengadaan@darululum.sch.id',
    customer_phone: '081377889900',
    institution_name: 'Pondok Pesantren Darul Ulum',
    title: 'Pengadaan Kitab Kuning Fiqih & Nahwu Santri Baru',
    category: 'Kitab & Buku Agama',
    description: 'Permintaan 250 eksemplar Kitab Safinatun Najah dan Jurumiyah',
    specifications: 'Kertas kuning premium, sampul tebal laminasi doff',
    quantity: 250,
    target_date: '2026-11-20',
    estimated_budget: 12500000,
    shipping_address: 'Komp. Pesantren Darul Ulum, Sawangan, Depok',
    attachments: [],
    status: 'pending_review',
    ...overrides,
  };
}
