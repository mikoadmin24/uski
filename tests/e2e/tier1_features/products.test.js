/**
 * Tier 1 Feature Tests: Products Catalog & Inventory
 * Covers: Catalog query, Category filtering, Product details, Product Upsert, Stock updates, Deactivation.
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
  registerTeardown,
  ensureAuthSession,
} from '../harness.js';

describe('Tier 1: Products Feature Coverage', () => {
  const testProduct = createTestProductFixture();

  beforeAll(async () => {
    await ensureAuthSession();
    if (supabase) {
      await supabase.from('products').delete().eq('id', testProduct.id);
    }
    registerTeardown(async () => {
      if (supabase) {
        await supabase.from('products').delete().eq('id', testProduct.id);
      }
    });
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.from('products').delete().eq('id', testProduct.id);
    }
  });

  it('TC-P01: Should retrieve active products catalog with valid price and stock properties', async () => {
    assert(supabase, 'Supabase client must be configured');
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku_master, base_price, stock_quantity, is_active')
      .eq('is_active', true)
      .limit(10);

    assertEqual(error, null, `Query products failed: ${error?.message}`);
    assert(Array.isArray(data), 'Products result should be an array');
    assert(data.length > 0, 'Catalog should contain at least 1 active product');

    for (const prod of data) {
      assert(typeof prod.id === 'string' && prod.id.length > 0, 'Product id must be non-empty string');
      assert(typeof prod.name === 'string' && prod.name.length > 0, 'Product name must be non-empty string');
      assert(typeof prod.sku_master === 'string', 'Product sku_master must be a string');
      assertGreaterThanOrEqual(Number(prod.base_price), 0, 'Product base_price must be >= 0');
      assertGreaterThanOrEqual(Number(prod.stock_quantity), 0, 'Product stock_quantity must be >= 0');
    }
  });

  it('TC-P02: Should filter products correctly by valid category_id', async () => {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    assertEqual(catError, null, `Fetching categories failed: ${catError?.message}`);
    assert(categories && categories.length > 0, 'Must have at least one category to test filtering');

    const targetCategoryId = categories[0].id;
    const { data: filteredProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, category_id')
      .eq('category_id', targetCategoryId);

    assertEqual(prodError, null, `Filtering products by category failed: ${prodError?.message}`);
    assert(Array.isArray(filteredProducts), 'Filtered products result must be an array');
    for (const p of filteredProducts) {
      assertEqual(p.category_id, targetCategoryId, `Product ${p.id} category_id must match filtered category`);
    }
  });

  it('TC-P03: Should retrieve product details by ID with specifications and metadata', async () => {
    const { data: sampleList } = await supabase.from('products').select('id, slug').limit(1);
    assert(sampleList && sampleList.length > 0, 'Sample product needed');
    const targetId = sampleList[0].id;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', targetId)
      .single();

    assertEqual(error, null, `Fetching product detail failed: ${error?.message}`);
    assert(product !== null, 'Product detail must not be null');
    assertEqual(product.id, targetId, 'Retrieved product id must match queried ID');
    assert(typeof product.description === 'string', 'Product description must be string');
    assert(Array.isArray(product.images), 'Product images must be an array');
  });

  it('TC-P04: Should insert / upsert a new product into Supabase and verify persistence', async () => {
    // Attempt insert with core supported columns
    const insertPayload = {
      id: testProduct.id,
      name: testProduct.name,
      slug: testProduct.slug,
      sku_master: testProduct.sku_master,
      base_price: testProduct.base_price,
      stock_quantity: testProduct.stock_quantity,
      min_stock_alert: testProduct.min_stock_alert,
      weight_grams: testProduct.weight_grams,
      images: testProduct.images,
      description: testProduct.description,
      is_active: testProduct.is_active,
      category_id: 'cat-1',
    };

    const { data, error } = await supabase
      .from('products')
      .upsert(insertPayload)
      .select()
      .single();

    assertEqual(error, null, `Upserting product failed: ${error?.message}`);
    assertEqual(data.id, testProduct.id, 'Persisted product id must match fixture id');
    assertEqual(data.sku_master, testProduct.sku_master, 'Persisted SKU must match');
    assertEqual(Number(data.base_price), testProduct.base_price, 'Persisted base_price must match');
  });

  it('TC-P05: Should update product stock quantity and verify persistence', async () => {
    const updatedStock = 85;
    const updatedPrice = 82000;

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: updatedStock,
        base_price: updatedPrice,
      })
      .eq('id', testProduct.id);

    assertEqual(updateError, null, `Updating product stock/price failed: ${updateError?.message}`);

    const { data: verifyData, error: verifyError } = await supabase
      .from('products')
      .select('stock_quantity, base_price')
      .eq('id', testProduct.id)
      .single();

    assertEqual(verifyError, null, `Verifying updated product failed: ${verifyError?.message}`);
    assertEqual(Number(verifyData.stock_quantity), updatedStock, 'stock_quantity should match updated value');
    assertEqual(Number(verifyData.base_price), updatedPrice, 'base_price should match updated value');
  });

  it('TC-P06: Should deactivate product (soft exclusion) and verify is_active status', async () => {
    const { error: deactError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', testProduct.id);

    assertEqual(deactError, null, `Deactivating product failed: ${deactError?.message}`);

    const { data, error: fetchError } = await supabase
      .from('products')
      .select('is_active')
      .eq('id', testProduct.id)
      .single();

    assertEqual(fetchError, null, `Fetching deactivated product failed: ${fetchError?.message}`);
    assertEqual(data.is_active, false, 'is_active must be false after deactivation');
  });
}, { tier: 1 });
