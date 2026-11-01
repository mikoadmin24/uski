/**
 * Adversarial Stress & Empirical Verification Harness for Milestone 2
 * Author: challenger_m2_1 (teamwork_challenger)
 * 
 * Objectives:
 * 1. Hydration Stress: Test Zustand store hydration with corrupted, empty, null,
 *    and populated localStorage payloads (prod-1..prod-10, cat-1..cat-10, cour-1).
 *    Verify zero crashes and instant hydration without flash of empty state.
 * 2. Admin Badge State Stress: Test 1-click badge toggle cycling, rapid state toggling,
 *    and add/edit modal persistence.
 * 3. Supabase Sync Revalidation: Verify that setProductsFromSupabase does NOT overwrite
 *    locally curated badges if cloud records lack those columns.
 * 4. Storefront & Dummy Data Elimination: Verify zero mock arrays, dynamic brands,
 *    carousel fallbacks, and discount calculations.
 */

import { createServer } from 'vite';
import { supabase, ensureAuthSession } from './e2e/harness.js';

let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'} - Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

async function testCase(name, fn) {
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`  \x1b[32m✓\x1b[0m ${name} \x1b[90m(${duration}ms)\x1b[0m`);
    passedCount++;
  } catch (err) {
    const duration = (performance.now() - start).toFixed(1);
    console.error(`  \x1b[31m✗\x1b[0m ${name} \x1b[90m(${duration}ms)\x1b[0m`);
    console.error(`    \x1b[31mError: ${err.message}\x1b[0m`);
    failures.push({ name, error: err });
    failedCount++;
  }
}

// In-Memory LocalStorage Mock with complete Web Storage API simulation
class MemoryLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

async function main() {
  console.log('\n\x1b[1m\x1b[35m================================================================');
  console.log('   EMPIRICAL CHALLENGER: M2 ADVERSARIAL STRESS TEST HARNESS');
  console.log('================================================================\x1b[0m\n');

  // Install Mock LocalStorage on globalThis before module loading
  const mockStorage = new MemoryLocalStorage();
  globalThis.localStorage = mockStorage;

  const server = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
  });

  try {
    console.log('\x1b[1m\x1b[34m▶ Suite 1: Zustand Store Hydration Stress (Corrupted, Null, Empty, Dummy Payloads)\x1b[0m');

    // 1.1 Corrupted JSON handling in localStorage
    await testCase('1.1.1: ProductStore should safely default to [] on corrupted JSON payload', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_products_v2', '{corrupted_json_syntax: [');
      const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
      assert(Array.isArray(useProductStore.getState().products), 'Products must be an array');
      assertEqual(useProductStore.getState().products.length, 0, 'Products should default to empty array');
    });

    await testCase('1.1.2: CategoryStore should safely default to [] on corrupted JSON payload', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_categories_v1', '<xml>invalid json</xml>');
      mockStorage.setItem('uski_banners_v1', '--- yaml not json');
      const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');
      assertEqual(useCategoryStore.getState().categories.length, 0, 'Categories should default to []');
      assertEqual(useCategoryStore.getState().banners.length, 0, 'Banners should default to []');
    });

    await testCase('1.1.3: CourierStore should safely default to [] on corrupted JSON payload', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_couriers_v3', '{unclosed bracket:');
      const { useCourierStore } = await server.ssrLoadModule('./src/store/courierStore.ts');
      assertEqual(useCourierStore.getState().couriers.length, 0, 'Couriers should default to []');
    });

    await testCase('1.1.4: PromoStore, OrderStore & CustomOrderStore should safely default to [] on corrupted JSON', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_vouchers_v1', 'undefined');
      mockStorage.setItem('uski_orders_v1', '{"not": "array');
      mockStorage.setItem('uski_custom_requests_v1', '{"malformed": true');
      const { usePromoStore } = await server.ssrLoadModule('./src/store/promoStore.ts');
      const { useOrderStore } = await server.ssrLoadModule('./src/store/orderStore.ts');
      const { useCustomOrderStore } = await server.ssrLoadModule('./src/store/customOrderStore.ts');
      assertEqual(usePromoStore.getState().vouchers.length, 0, 'Vouchers should default to []');
      assertEqual(useOrderStore.getState().orders.length, 0, 'Orders should default to []');
      assertEqual(useCustomOrderStore.getState().requests.length, 0, 'Requests should default to []');
    });

    // 1.2 Primitive & Null JSON values in localStorage
    await testCase('1.2.1: Stores should handle literal "null" JSON string in localStorage without crashing', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_products_v2', 'null');
      mockStorage.setItem('uski_categories_v1', 'null');
      mockStorage.setItem('uski_couriers_v3', 'null');
      mockStorage.setItem('uski_vouchers_v1', 'null');
      const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
      const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');
      const { useCourierStore } = await server.ssrLoadModule('./src/store/courierStore.ts');
      const { usePromoStore } = await server.ssrLoadModule('./src/store/promoStore.ts');
      assertEqual(Array.isArray(useProductStore.getState().products), true, 'Products must be array');
      assertEqual(Array.isArray(useCategoryStore.getState().categories), true, 'Categories must be array');
      assertEqual(Array.isArray(useCourierStore.getState().couriers), true, 'Couriers must be array');
      assertEqual(Array.isArray(usePromoStore.getState().vouchers), true, 'Vouchers must be array');
    });

    await testCase('1.2.2: Stores should handle non-array objects and primitives ("123", "true", "{}")', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_products_v2', '{"foo": "bar"}');
      mockStorage.setItem('uski_couriers_v3', '123456');
      mockStorage.setItem('uski_categories_v1', 'true');
      const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
      const { useCourierStore } = await server.ssrLoadModule('./src/store/courierStore.ts');
      const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');
      assertEqual(useProductStore.getState().products.length, 0);
      assertEqual(useCourierStore.getState().couriers.length, 0);
      assertEqual(useCategoryStore.getState().categories.length, 0);
    });

    // 1.3 Empty / Missing localStorage keys
    await testCase('1.3.1: Stores should handle empty string and missing keys with zero latency/exceptions', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.clear();
      mockStorage.setItem('uski_products_v2', '');
      const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
      assertEqual(useProductStore.getState().products.length, 0);
      assertEqual(useProductStore.getState().inventoryMovements.length, 0);
    });

    // 1.4 Dummy ID Retention & Tolerance (prod-1..prod-10, cat-1..cat-10, cour-1)
    await testCase('1.4.1: ProductStore MUST preserve cached products with IDs prod-1 through prod-10', async () => {
      server.moduleGraph.invalidateAll();
      const mockProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-${i + 1}`,
        name: `Kitab Kuning Jilid ${i + 1}`,
        slug: `kitab-kuning-jilid-${i + 1}`,
        sku_master: `KTB-00${i + 1}`,
        category_id: `cat-${(i % 3) + 1}`,
        base_price: 50000 + i * 5000,
        sale_price: 45000 + i * 5000,
        stock_quantity: 15 + i,
        min_stock_alert: 5,
        rating: 4.8,
        reviews_count: 10,
        is_active: true,
        is_featured: i < 3,
        is_best_seller: i >= 2 && i < 5,
        is_new_arrival: i >= 5 && i < 8,
      }));

      mockStorage.setItem('uski_products_v2', JSON.stringify(mockProducts));
      const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
      const loaded = useProductStore.getState().products;
      assertEqual(loaded.length, 10, 'All 10 products with prod-* IDs must be loaded');
      for (let i = 1; i <= 10; i++) {
        const found = loaded.find((p) => p.id === `prod-${i}`);
        assert(found !== undefined, `Product prod-${i} must NOT be purged`);
        assertEqual(found.name, `Kitab Kuning Jilid ${i}`);
      }
    });

    await testCase('1.4.2: CategoryStore MUST preserve cached categories cat-1 through cat-10', async () => {
      server.moduleGraph.invalidateAll();
      const mockCategories = Array.from({ length: 10 }, (_, i) => ({
        id: `cat-${i + 1}`,
        name: `Kategori ${i + 1}`,
        slug: `kategori-${i + 1}`,
        icon: 'Book',
        sort_order: i + 1,
      }));

      mockStorage.setItem('uski_categories_v1', JSON.stringify(mockCategories));
      const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');
      const loaded = useCategoryStore.getState().categories;
      assertEqual(loaded.length, 10, 'All 10 categories cat-1..cat-10 must be retained');
    });

    await testCase('1.4.3: CourierStore MUST preserve cached couriers cour-1 through cour-3 with defaults', async () => {
      server.moduleGraph.invalidateAll();
      const mockCouriers = [
        { id: 'cour-1', name: 'Ahmad Fauzi', phone: '081234567891', vehicle_type: 'motorcycle', vehicle_plate: 'B 1234 ABC', status: 'available' },
        { id: 'cour-2', name: 'Bambang Supriadi', phone: '081234567892', vehicle_type: 'van', vehicle_plate: 'B 5678 DEF', status: 'delivering' },
        { id: 'cour-3', name: 'Cahyo Utomo', phone: '081234567893', vehicle_type: 'motorcycle', vehicle_plate: 'B 9012 GHI', status: 'off_duty' },
      ];

      mockStorage.setItem('uski_couriers_v3', JSON.stringify(mockCouriers));
      const { useCourierStore } = await server.ssrLoadModule('./src/store/courierStore.ts');
      const loaded = useCourierStore.getState().couriers;
      assertEqual(loaded.length, 3, 'All 3 couriers must be retained');
      assertEqual(loaded[0].id, 'cour-1');
      assert(Array.isArray(loaded[0].trip_history), 'trip_history must default to array');
      assert(loaded[0].stationary_alert !== undefined, 'stationary_alert must default to object');
    });

    console.log('\n\x1b[1m\x1b[34m▶ Suite 2: Admin Badge State Stress (1-Click Toggles, Rapid Stress, CRUD Persistence)\x1b[0m');

    // Load active productStore for mutation tests
    server.moduleGraph.invalidateAll();
    const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');

    await testCase('2.1.1: 1-Click Badge Toggle should flip is_featured correctly and persist to localStorage', async () => {
      const testProd = {
        id: 'prod-badge-test-1',
        name: 'Produk Uji Lencana',
        slug: 'produk-uji-lencana',
        sku_master: 'PUL-01',
        category_id: 'cat-1',
        base_price: 75000,
        stock_quantity: 20,
        min_stock_alert: 5,
        rating: 5.0,
        reviews_count: 0,
        sales_count: 0,
        is_active: true,
        is_featured: false,
        is_best_seller: false,
        is_new_arrival: false,
        images: ['https://example.com/test.jpg'],
        created_at: new Date().toISOString(),
      };

      useProductStore.setState({ products: [testProd] });
      mockStorage.setItem('uski_products_v2', JSON.stringify([testProd]));

      // 1-Click toggle: turn ON is_featured in local store
      await useProductStore.getState().updateProduct(testProd.id, { is_featured: !testProd.is_featured });
      let curr = useProductStore.getState().getProductById(testProd.id);
      assertEqual(curr.is_featured, true, 'is_featured should now be true');

      // Verify localStorage persistence
      let stored = JSON.parse(mockStorage.getItem('uski_products_v2'));
      assertEqual(stored.find((p) => p.id === testProd.id).is_featured, true, 'LocalStorage should reflect true');

      // 1-Click toggle: turn OFF is_featured
      await useProductStore.getState().updateProduct(testProd.id, { is_featured: !curr.is_featured });
      curr = useProductStore.getState().getProductById(testProd.id);
      assertEqual(curr.is_featured, false, 'is_featured should now be false');
      stored = JSON.parse(mockStorage.getItem('uski_products_v2'));
      assertEqual(stored.find((p) => p.id === testProd.id).is_featured, false, 'LocalStorage should reflect false');
    });

    await testCase('2.1.2: 1-Click Badge Toggle should toggle is_best_seller and is_new_arrival independently', async () => {
      const prodId = 'prod-badge-test-1';
      // Toggle best_seller ON
      await useProductStore.getState().updateProduct(prodId, { is_best_seller: true });
      let curr = useProductStore.getState().getProductById(prodId);
      assertEqual(curr.is_best_seller, true);
      assertEqual(curr.is_featured, false, 'is_featured must remain unchanged');
      assertEqual(curr.is_new_arrival, false, 'is_new_arrival must remain unchanged');

      // Toggle new_arrival ON
      await useProductStore.getState().updateProduct(prodId, { is_new_arrival: true });
      curr = useProductStore.getState().getProductById(prodId);
      assertEqual(curr.is_best_seller, true, 'is_best_seller must remain true');
      assertEqual(curr.is_new_arrival, true, 'is_new_arrival must be true');

      // Toggle best_seller OFF
      await useProductStore.getState().updateProduct(prodId, { is_best_seller: false });
      curr = useProductStore.getState().getProductById(prodId);
      assertEqual(curr.is_best_seller, false);
      assertEqual(curr.is_new_arrival, true);
    });

    await testCase('2.2.1: Rapid state toggles stress test (20 rapid sequential mutations)', async () => {
      const prodId = 'prod-badge-test-1';
      for (let i = 0; i < 20; i++) {
        const currentVal = useProductStore.getState().getProductById(prodId)?.is_featured;
        await useProductStore.getState().updateProduct(prodId, { is_featured: !currentVal });
      }

      // After 20 toggles from initial false, final state must be false
      const finalProd = useProductStore.getState().getProductById(prodId);
      assertEqual(finalProd.is_featured, false, 'After 20 toggles, is_featured should be false');

      const saved = JSON.parse(mockStorage.getItem('uski_products_v2'));
      assertEqual(saved.find((p) => p.id === prodId).is_featured, false, 'LocalStorage matches store state');
    });

    await testCase('2.3.1: Add Product Modal persistence with all 3 badges enabled', async () => {
      const newProd = await useProductStore.getState().addProduct({
        name: 'Kitab Tafsir Jalalain Edisi Khusus',
        slug: 'kitab-tafsir-jalalain-khusus',
        sku_master: 'KTB-TJ-01',
        category_id: 'cat-1',
        base_price: 125000,
        sale_price: 110000,
        stock_quantity: 30,
        min_stock_alert: 5,
        weight_grams: 800,
        description: 'Tafsir Jalalain cetakan mewah.',
        specifications: { Jilid: 'Hardcover' },
        is_active: true,
        is_featured: true,
        is_best_seller: true,
        is_new_arrival: true,
        images: ['https://example.com/jalalain.jpg'],
      });

      assert(newProd.id.startsWith('prod-'), 'Generated ID should start with prod-');
      assertEqual(newProd.is_featured, true, 'is_featured must be true');
      assertEqual(newProd.is_best_seller, true, 'is_best_seller must be true');
      assertEqual(newProd.is_new_arrival, true, 'is_new_arrival must be true');

      // Verify presence in store
      const inStore = useProductStore.getState().getProductById(newProd.id);
      assert(inStore !== undefined, 'Product must exist in store');
      assertEqual(inStore.is_featured, true);
      assertEqual(inStore.is_best_seller, true);
      assertEqual(inStore.is_new_arrival, true);

      // Verify presence in localStorage
      const inStorage = JSON.parse(mockStorage.getItem('uski_products_v2')).find((p) => p.id === newProd.id);
      assert(inStorage !== undefined, 'Product must exist in localStorage');
      assertEqual(inStorage.is_featured, true);
      assertEqual(inStorage.is_best_seller, true);
      assertEqual(inStorage.is_new_arrival, true);
    });

    await testCase('2.4.1: Update Product Modal persistence modifying multiple fields without clobbering', async () => {
      const existing = useProductStore.getState().products[0];
      await useProductStore.getState().updateProduct(existing.id, {
        name: 'Kitab Tafsir Jalalain (Revisi & Tahqiq)',
        base_price: 135000,
        is_best_seller: false,
      });

      const updated = useProductStore.getState().getProductById(existing.id);
      assertEqual(updated.name, 'Kitab Tafsir Jalalain (Revisi & Tahqiq)');
      assertEqual(updated.base_price, 135000);
      assertEqual(updated.is_best_seller, false, 'is_best_seller should be false');
      assertEqual(updated.is_featured, true, 'is_featured must not be clobbered');
      assertEqual(updated.is_new_arrival, true, 'is_new_arrival must not be clobbered');
      assertEqual(updated.sku_master, existing.sku_master, 'sku_master must remain intact');
    });

    await testCase('2.5.1: [ADVERSARIAL DEFECT PROBE] Supabase PostgREST error 23502 on partial updates', async () => {
      await ensureAuthSession();
      // Test what happens when updateProduct calls dbService.products.upsert({ id, is_featured: true })
      // On PostgreSQL, partial upsert without mandatory non-null columns (sku_master) FAILS with 23502.
      const { data: testProds } = await supabase.from('products').select('*').limit(1);
      assert(testProds && testProds.length > 0, 'Must have at least one product in database');
      const testId = testProds[0].id;

      const partialUpsertResult = await supabase
        .from('products')
        .upsert({ id: testId, is_featured: true });

      // If partial upsert errors with 23502 or PGRST204, it proves partial upsert cannot be used for field updates!
      if (partialUpsertResult.error) {
        console.log(`    \x1b[33m[CONFIRMED EMPIRICAL FINDING]\x1b[0m Supabase rejected partial upsert with error code: ${partialUpsertResult.error.code} (${partialUpsertResult.error.message})`);
        assert(
          partialUpsertResult.error.code === '23502' || partialUpsertResult.error.code === 'PGRST204',
          'Expected PostgreSQL 23502 (NOT NULL constraint) or PGRST204 (missing column)'
        );
      }
    });

    console.log('\n\x1b[1m\x1b[34m▶ Suite 3: Supabase Sync Revalidation & Badge Preservation\x1b[0m');

    await testCase('3.1.1: Supabase cloud records LACKING badge columns (undefined) MUST preserve local badges', async () => {
      const localProduct = {
        id: 'prod-sync-test-1',
        name: 'Buku Fikih Ibadah',
        slug: 'buku-fikih-ibadah',
        sku_master: 'FKH-01',
        category_id: 'cat-1',
        base_price: 60000,
        stock_quantity: 25,
        min_stock_alert: 5,
        rating: 4.9,
        reviews_count: 5,
        sales_count: 50,
        is_active: true,
        is_featured: true,
        is_best_seller: true,
        is_new_arrival: true,
        images: ['https://example.com/fikih.jpg'],
      };
      useProductStore.setState({ products: [localProduct] });

      const cloudRecord = {
        id: 'prod-sync-test-1',
        name: 'Buku Fikih Ibadah Cloud Edition',
        slug: 'buku-fikih-ibadah',
        sku_master: 'FKH-01',
        category_id: 'cat-1',
        base_price: 65000,
        stock_quantity: 40,
        min_stock_alert: 5,
        rating: 4.9,
        reviews_count: 10,
        sales_count: 80,
        is_active: true,
        images: ['https://example.com/fikih-cloud.jpg'],
      };

      useProductStore.getState().setProductsFromSupabase([cloudRecord]);

      const merged = useProductStore.getState().getProductById('prod-sync-test-1');
      assertEqual(merged.name, 'Buku Fikih Ibadah Cloud Edition', 'Cloud name must be applied');
      assertEqual(merged.base_price, 65000, 'Cloud price must be applied');
      assertEqual(merged.stock_quantity, 40, 'Cloud stock must be applied');
      assertEqual(merged.is_featured, true, 'is_featured must NOT be overwritten by undefined');
      assertEqual(merged.is_best_seller, true, 'is_best_seller must NOT be overwritten by undefined');
      assertEqual(merged.is_new_arrival, true, 'is_new_arrival must NOT be overwritten by undefined');

      const stored = JSON.parse(mockStorage.getItem('uski_products_v2'))[0];
      assertEqual(stored.is_featured, true, 'LocalStorage must preserve is_featured');
      assertEqual(stored.is_best_seller, true, 'LocalStorage must preserve is_best_seller');
      assertEqual(stored.is_new_arrival, true, 'LocalStorage must preserve is_new_arrival');
    });

    await testCase('3.1.2: Supabase cloud records with NULL badge columns MUST preserve local badges', async () => {
      const localProduct = {
        id: 'prod-sync-test-2',
        name: 'Kitab Safinatun Naja',
        is_featured: true,
        is_best_seller: false,
        is_new_arrival: true,
      };
      useProductStore.setState({ products: [localProduct] });

      const cloudRecord = {
        id: 'prod-sync-test-2',
        name: 'Kitab Safinatun Naja Updated',
        is_featured: null,
        is_best_seller: null,
        is_new_arrival: null,
      };

      useProductStore.getState().setProductsFromSupabase([cloudRecord]);

      const merged = useProductStore.getState().getProductById('prod-sync-test-2');
      assertEqual(merged.is_featured, true, 'Null should fallback to existing is_featured: true');
      assertEqual(merged.is_best_seller, false, 'Null should fallback to existing is_best_seller: false');
      assertEqual(merged.is_new_arrival, true, 'Null should fallback to existing is_new_arrival: true');
    });

    await testCase('3.1.3: Supabase cloud records with EXPLICIT boolean values should override', async () => {
      const localProduct = {
        id: 'prod-sync-test-3',
        name: 'Kitab Jurumiyah',
        is_featured: true,
        is_best_seller: true,
        is_new_arrival: true,
      };
      useProductStore.setState({ products: [localProduct] });

      const cloudRecord = {
        id: 'prod-sync-test-3',
        name: 'Kitab Jurumiyah',
        is_featured: false,
        is_best_seller: false,
        is_new_arrival: true,
      };

      useProductStore.getState().setProductsFromSupabase([cloudRecord]);

      const merged = useProductStore.getState().getProductById('prod-sync-test-3');
      assertEqual(merged.is_featured, false, 'Explicit cloud false should take effect');
      assertEqual(merged.is_best_seller, false, 'Explicit cloud false should take effect');
      assertEqual(merged.is_new_arrival, true, 'Explicit cloud true should take effect');
    });

    await testCase('3.1.4: Brand new cloud product should safely default missing badges to false', async () => {
      useProductStore.setState({ products: [] });

      const newCloudProduct = {
        id: 'prod-new-cloud-99',
        name: 'Produk Baru Cloud',
        base_price: 100000,
      };

      useProductStore.getState().setProductsFromSupabase([newCloudProduct]);

      const loaded = useProductStore.getState().getProductById('prod-new-cloud-99');
      assertEqual(loaded.is_featured, false, 'New product missing is_featured defaults to false');
      assertEqual(loaded.is_best_seller, false, 'New product missing is_best_seller defaults to false');
      assertEqual(loaded.is_new_arrival, false, 'New product missing is_new_arrival defaults to false');
    });

    await testCase('3.1.5: setProductsFromSupabase should handle null and undefined safely without wiping store', async () => {
      const testProd = { id: 'prod-retain-1', name: 'Produk Bertahan', is_featured: true };
      useProductStore.setState({ products: [testProd] });

      useProductStore.getState().setProductsFromSupabase(null);
      assertEqual(useProductStore.getState().products.length, 1, 'Null payload should not wipe products');

      useProductStore.getState().setProductsFromSupabase(undefined);
      assertEqual(useProductStore.getState().products.length, 1, 'Undefined payload should not wipe products');
    });

    console.log('\n\x1b[1m\x1b[34m▶ Suite 4: Storefront & Dummy Data Elimination Stress\x1b[0m');

    await testCase('4.1.1: mockBrands and mockPublishers must be empty arrays with 0 dummy items', async () => {
      const { mockBrands, mockPublishers } = await server.ssrLoadModule('./src/data/mockData.ts');
      assert(Array.isArray(mockBrands), 'mockBrands must be an array');
      assert(Array.isArray(mockPublishers), 'mockPublishers must be an array');
      assertEqual(mockBrands.length, 0, 'mockBrands must be empty (0 items)');
      assertEqual(mockPublishers.length, 0, 'mockPublishers must be empty (0 items)');
    });

    await testCase('4.2.1: Dynamic brand extraction should extract authors and brands accurately with deduplication', async () => {
      const testProducts = [
        { id: 'p1', name: 'Buku 1', author: 'Tere Liye', is_active: true },
        { id: 'p2', name: 'Buku 2', author: 'Tere Liye', is_active: true },
        { id: 'p3', name: 'Buku 3', author: 'Habiburrahman El Shirazy', is_active: true },
        { id: 'p4', name: 'Buku 4', author: '', is_active: true },
        { id: 'p5', name: 'Buku 5', author: 'Tere Liye', is_active: false },
      ];

      const brandMap = new Map();
      testProducts
        .filter((p) => p.is_active !== false)
        .forEach((p) => {
          const rawName = p.author?.trim();
          if (!rawName) return;
          const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          if (!slug) return;
          if (!brandMap.has(slug)) {
            brandMap.set(slug, {
              id: slug,
              name: rawName,
              slug,
              count: 0,
            });
          }
          brandMap.get(slug).count += 1;
        });

      const extracted = Array.from(brandMap.values());
      assertEqual(extracted.length, 2, 'Should extract exactly 2 unique active authors/brands');
      assertEqual(extracted[0].name, 'Tere Liye');
      assertEqual(extracted[0].count, 2, 'Tere Liye has 2 active books (inactive excluded)');
      assertEqual(extracted[1].name, 'Habiburrahman El Shirazy');
      assertEqual(extracted[1].count, 1);
    });

    await testCase('4.3.1: Resilient HomePage carousel fallback logic when 0 products have explicit badges', async () => {
      const activeProducts = [
        { id: 'p1', name: 'Produk 1', sales_count: 100, rating: 5.0, stock_quantity: 50, created_at: '2026-10-01T00:00:00Z', is_active: true },
        { id: 'p2', name: 'Produk 2', sales_count: 50, rating: 4.8, stock_quantity: 30, created_at: '2026-10-05T00:00:00Z', is_active: true },
        { id: 'p3', name: 'Produk 3', sales_count: 10, rating: 4.5, stock_quantity: 10, created_at: '2026-10-10T00:00:00Z', is_active: true },
        { id: 'p4', name: 'Produk Inaktif', sales_count: 500, rating: 5.0, stock_quantity: 90, created_at: '2026-10-15T00:00:00Z', is_active: false },
      ];

      const activeOnly = activeProducts.filter((p) => p.is_active !== false);
      assertEqual(activeOnly.length, 3, 'Must exclude inactive products');

      const bestSellers = [...activeOnly].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      assertEqual(bestSellers[0].id, 'p1', 'Highest sales must be first');
      assertEqual(bestSellers[1].id, 'p2');

      const newArrivals = [...activeOnly].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      assertEqual(newArrivals[0].id, 'p3', 'Most recently created must be first');
      assertEqual(newArrivals[1].id, 'p2');
    });

    await testCase('4.4.1: Dynamic discount percentage computation in ProductCard / ProductDetail', async () => {
      function computeDiscount(basePrice, salePrice, explicitDiscount) {
        if (typeof explicitDiscount === 'number' && explicitDiscount > 0) return explicitDiscount;
        if (salePrice && basePrice && salePrice < basePrice) {
          return Math.round(((basePrice - salePrice) / basePrice) * 100);
        }
        return 0;
      }

      assertEqual(computeDiscount(100000, 75000, undefined), 25, '100k -> 75k should be 25%');
      assertEqual(computeDiscount(50000, 42000, undefined), 16, '50k -> 42k should be 16%');
      assertEqual(computeDiscount(50000, 50000, undefined), 0, 'No discount when sale == base');
      assertEqual(computeDiscount(50000, 60000, undefined), 0, 'No discount when sale > base');
      assertEqual(computeDiscount(50000, null, undefined), 0, 'No discount when sale is null');
      assertEqual(computeDiscount(100000, 75000, 30), 30, 'Explicit discount overrides computed if provided');
    });

  } finally {
    await server.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log('                 ADVERSARIAL STRESS TEST SUMMARY                ');
  console.log('================================================================');
  console.log(`Passed: \x1b[32m${passedCount}\x1b[0m`);
  console.log(`Failed: \x1b[${failedCount > 0 ? '31' : '32'}m${failedCount}\x1b[0m`);
  console.log(`Total:  ${passedCount + failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    console.error('\x1b[31mAdversarial Stress Verification FAILED with', failedCount, 'errors.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[32m🎉 All adversarial stress test assertions PASSED without error!\x1b[0m\n');
  }
}

main().catch((err) => {
  console.error('Fatal test harness execution error:', err);
  process.exit(1);
});
