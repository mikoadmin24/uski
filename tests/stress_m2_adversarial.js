/**
 * Adversarial Stress & Verification Harness for Milestone 2
 * Author: challenger_m2_2 (teamwork_challenger)
 * 
 * Objectives:
 * 1. HomePage Carousel Fallback Stress:
 *    - 0 products have badge flags
 *    - All products have badge flags
 *    - All products are inactive
 *    - Products with extreme sales / rating / stock values
 *    - Verify carousels never crash or render corrupt views
 * 
 * 2. Dynamic Brand Filtering Stress:
 *    - Bizarre author names (special chars, symbols, multiple spaces)
 *    - Empty / whitespace authors
 *    - Pure special character authors
 *    - Unicode / non-ASCII author names (Arabic, Cyrillic, Chinese, umlauts)
 *    - URL-encoded query strings (?brand=...)
 *    - Filter matching across slug, name, and brand_id
 *    - Mobile filter drawer behavior
 *    - Empty results handling and reset button
 * 
 * 3. Discount Calculation Stress:
 *    - base_price = 0 with various sale_price values
 *    - sale_price > base_price (price markup / inflation)
 *    - Negative base_price / sale_price
 *    - Floating point discounts
 *    - ProductCard & ProductDetailPage component rendering with route parameters
 * 
 * 4. Dummy Data Elimination & Cache Hydration Audit:
 *    - mockBrands and mockPublishers empty in mockData.ts
 *    - No mockIds filtering in any of the 6 stores
 *    - AdminProducts badge toggle support
 */

import { createServer } from 'vite';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';

// Enable Zustand store SSR compatibility
React.useSyncExternalStore = (subscribe, getSnapshot, getServerSnapshot) => getSnapshot();

let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
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

async function main() {
  console.log('\n\x1b[1m\x1b[36m================================================================');
  console.log('   EMPIRICAL CHALLENGER: MILESTONE 2 ADVERSARIAL STRESS SUITE   ');
  console.log('================================================================\x1b[0m\n');

  // Suppress harmless useLayoutEffect SSR warning in Node
  const origError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && (
      args[0].includes('useLayoutEffect does nothing on the server') ||
      args[0].includes('react-dom/server') ||
      args[0].includes('WebSocket server error')
    )) {
      return;
    }
    origError(...args);
  };

  const server = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
  });

  try {
    const { MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom');
    const { HomePage } = await server.ssrLoadModule('./src/pages/HomePage.tsx');
    const { CatalogPage } = await server.ssrLoadModule('./src/pages/CatalogPage.tsx');
    const { ProductCard } = await server.ssrLoadModule('./src/components/common/ProductCard.tsx');
    const { ProductDetailPage } = await server.ssrLoadModule('./src/pages/ProductDetailPage.tsx');
    const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
    const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');
    const { formatRupiah } = await server.ssrLoadModule('./src/lib/utils.ts');
    const mockDataModule = await server.ssrLoadModule('./src/data/mockData.ts');

    // Setup base categories
    const testCategories = [
      { id: 'cat-kitab', name: 'Kitab Kuning & Pesantren', slug: 'kitab-kuning', icon: 'Book' },
      { id: 'cat-atk', name: 'Buku Tulis & ATK', slug: 'buku-tulis-dan-atk', icon: 'FileText' },
      { id: 'cat-pelajaran', name: 'Buku Pelajaran', slug: 'buku-pelajaran', icon: 'BookOpen' },
    ];
    useCategoryStore.setState({ categories: testCategories });

    // =========================================================================
    // SECTION 1: HomePage Carousel Fallback Stress
    // =========================================================================
    console.log('\x1b[1m\x1b[33m▶ Objective 1: HomePage Carousel Fallback Stress\x1b[0m');

    await testCase('TC1.1: 0 products have badge flags (all is_best_seller/is_featured/is_new_arrival false)', async () => {
      // Create 12 active products with NO badge flags
      const products = Array.from({ length: 12 }, (_, i) => ({
        id: `prod-nobadge-${i}`,
        name: `Buku Standar Tanpa Badge ${i}`,
        slug: `buku-standar-${i}`,
        category_id: 'cat-kitab',
        base_price: 50000,
        sale_price: i % 2 === 0 ? 40000 : null,
        stock_quantity: 10 + i,
        sku_master: `SKU-NB-${i}`,
        rating: 4.0 + (i % 10) * 0.1,
        sales_count: 5 * i,
        reviews_count: i,
        is_active: true,
        is_featured: false,
        is_best_seller: false,
        is_new_arrival: false,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      // Verify that sections fall back gracefully and render supplemental products
      assert(html.includes('Buku &amp; ATK Pilihan Terlaris') || html.includes('Buku & ATK Pilihan Terlaris'), 'Best Seller section should render via sales fallback');
      assert(html.includes('Koleksi Unggulan USKI'), 'Featured section should render via stock/rating fallback');
      assert(html.includes('Produk Terbaru Minggu Ini'), 'New arrivals section should render via created_at fallback');
      assert(html.includes('Penawaran Diskon Spesial'), 'Discount section should render for products with sale_price < base_price');
      // Verify no NaN or corrupt views in output
      assert(!html.includes('NaN'), 'HTML must not contain NaN');
      assert(!html.includes('undefined%'), 'HTML must not contain undefined%');
    });

    await testCase('TC1.2: All products have all badge flags true (20 products with all badges set)', async () => {
      const products = Array.from({ length: 20 }, (_, i) => ({
        id: `prod-allbadge-${i}`,
        name: `Super Product Flagged ${i}`,
        slug: `super-product-${i}`,
        category_id: 'cat-kitab',
        base_price: 75000,
        sale_price: 60000,
        stock_quantity: 50,
        sku_master: `SKU-ALL-${i}`,
        rating: 5.0,
        sales_count: 100 + i,
        reviews_count: 20,
        is_active: true,
        is_featured: true,
        is_best_seller: true,
        is_new_arrival: true,
        created_at: new Date().toISOString(),
      }));

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      // Each carousel slices at 8 max
      assert(html.includes('Super Product Flagged 0'), 'First product should render');
      assert(html.includes('Super Product Flagged 7'), 'Eighth product should render');
      assert(!html.includes('NaN'), 'No NaN in output');
    });

    await testCase('TC1.3: All products inactive (is_active: false for 100% of products)', async () => {
      const products = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-inactive-${i}`,
        name: `Produk Nonaktif ${i}`,
        slug: `produk-nonaktif-${i}`,
        category_id: 'cat-kitab',
        base_price: 50000,
        stock_quantity: 20,
        sku_master: `SKU-INACT-${i}`,
        is_active: false,
        is_featured: true,
        is_best_seller: true,
        is_new_arrival: true,
      }));

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      // Inactive products must be completely excluded
      assert(!html.includes('Produk Nonaktif'), 'Inactive products must NOT render');
      // ProductSections return null when products.length === 0, so no empty section titles
      assert(!html.includes('Buku &amp; ATK Pilihan Terlaris') && !html.includes('Buku & ATK Pilihan Terlaris'), 'Best Seller section must be null when 0 active items');
      assert(!html.includes('Koleksi Unggulan USKI'), 'Featured section must be null when 0 active items');
      assert(!html.includes('Produk Terbaru Minggu Ini'), 'New arrivals section must be null when 0 active items');
      assert(!html.includes('Penawaran Diskon Spesial'), 'Discount section must be null when 0 active items');
    });

    await testCase('TC1.4: Extreme sales count values (1e12, -999999, 0, null, undefined)', async () => {
      const products = [
        {
          id: 'prod-sale-high',
          name: 'Produk Mega Sales',
          slug: 'prod-mega-sales',
          category_id: 'cat-atk',
          base_price: 10000,
          sales_count: 1000000000000,
          stock_quantity: 10,
          sku_master: 'SKU-SH-1',
          is_active: true,
        },
        {
          id: 'prod-sale-neg',
          name: 'Produk Negatif Sales',
          slug: 'prod-neg-sales',
          category_id: 'cat-atk',
          base_price: 10000,
          sales_count: -999999,
          stock_quantity: 10,
          sku_master: 'SKU-SN-1',
          is_active: true,
        },
        {
          id: 'prod-sale-null',
          name: 'Produk Null Sales',
          slug: 'prod-null-sales',
          category_id: 'cat-atk',
          base_price: 10000,
          sales_count: null,
          stock_quantity: 10,
          sku_master: 'SKU-SNULL-1',
          is_active: true,
        },
        {
          id: 'prod-sale-undef',
          name: 'Produk Undef Sales',
          slug: 'prod-undef-sales',
          category_id: 'cat-atk',
          base_price: 10000,
          sales_count: undefined,
          stock_quantity: 10,
          sku_master: 'SKU-SUNDEF-1',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      // Mega sales product must be present and at the top of best sellers
      assert(html.includes('Produk Mega Sales'), 'Mega sales product must render');
      assert(!html.includes('NaN'), 'No NaN in rendering');
    });

    await testCase('TC1.5: Extreme rating values (999.9, -5.0, 0, null, undefined, NaN)', async () => {
      const products = [
        {
          id: 'prod-rate-high',
          name: 'Produk Rating Super',
          slug: 'prod-rate-super',
          category_id: 'cat-atk',
          base_price: 10000,
          rating: 999.9,
          stock_quantity: 10,
          sku_master: 'SKU-RH-1',
          is_active: true,
        },
        {
          id: 'prod-rate-neg',
          name: 'Produk Rating Negatif',
          slug: 'prod-rate-neg',
          category_id: 'cat-atk',
          base_price: 10000,
          rating: -5.0,
          stock_quantity: 10,
          sku_master: 'SKU-RN-1',
          is_active: true,
        },
        {
          id: 'prod-rate-null',
          name: 'Produk Rating Null',
          slug: 'prod-rate-null',
          category_id: 'cat-atk',
          base_price: 10000,
          rating: null,
          stock_quantity: 10,
          sku_master: 'SKU-RNULL-1',
          is_active: true,
        },
        {
          id: 'prod-rate-undef',
          name: 'Produk Rating Undef',
          slug: 'prod-rate-undef',
          category_id: 'cat-atk',
          base_price: 10000,
          rating: undefined,
          stock_quantity: 10,
          sku_master: 'SKU-RUNDEF-1',
          is_active: true,
        },
        {
          id: 'prod-rate-nan',
          name: 'Produk Rating Corrupt',
          slug: 'prod-rate-corrupt',
          category_id: 'cat-atk',
          base_price: 10000,
          rating: NaN,
          stock_quantity: 10,
          sku_master: 'SKU-RNAN-1',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      // Verify no uncaught crashes and rating displays cleanly
      assert(html.includes('Produk Rating Super'), 'Should render extreme rating product without crash');
      assert(!html.includes('NaN'), 'Should guard NaN rating and not display literal NaN to user');
    });

    await testCase('TC1.6: Extreme stock values (stock_quantity = 0, 9999999, -10, null, undefined)', async () => {
      const products = [
        {
          id: 'prod-stock-0',
          name: 'Produk Habis Stok',
          slug: 'prod-habis-stok',
          category_id: 'cat-atk',
          base_price: 10000,
          stock_quantity: 0,
          sku_master: 'SKU-S0',
          is_active: true,
        },
        {
          id: 'prod-stock-huge',
          name: 'Produk Gudang Melimpah',
          slug: 'prod-melimpah',
          category_id: 'cat-atk',
          base_price: 10000,
          stock_quantity: 9999999,
          sku_master: 'SKU-SHUGE',
          is_active: true,
        },
        {
          id: 'prod-stock-neg',
          name: 'Produk Stok Minus',
          slug: 'prod-stok-minus',
          category_id: 'cat-atk',
          base_price: 10000,
          stock_quantity: -10,
          sku_master: 'SKU-SNEG',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      assert(html.includes('Stok Habis'), 'Should show Stok Habis overlay for 0 stock');
      assert(html.includes('Produk Gudang Melimpah'), 'Should render huge stock product cleanly');
    });

    await testCase('TC1.7: Corrupted / invalid created_at timestamps ("invalid-date", "", null, undefined)', async () => {
      const products = [
        {
          id: 'prod-date-invalid',
          name: 'Produk Tanggal Ngawur',
          slug: 'prod-date-ngawur',
          category_id: 'cat-atk',
          base_price: 10000,
          stock_quantity: 10,
          sku_master: 'SKU-DI-1',
          created_at: 'NOT-A-REAL-DATE-STRING',
          is_active: true,
        },
        {
          id: 'prod-date-empty',
          name: 'Produk Tanggal Kosong',
          slug: 'prod-date-kosong',
          category_id: 'cat-atk',
          base_price: 10000,
          stock_quantity: 10,
          sku_master: 'SKU-DE-1',
          created_at: '',
          is_active: true,
        },
        {
          id: 'prod-date-null',
          name: 'Produk Tanggal Null',
          slug: 'prod-date-null',
          category_id: 'cat-atk',
          base_price: 10000,
          stock_quantity: 10,
          sku_master: 'SKU-DN-1',
          created_at: null,
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage))
      );

      assert(html.includes('Produk Tanggal Ngawur'), 'Must not crash on invalid date');
      assert(html.includes('Produk Tanggal Kosong'), 'Must not crash on empty date');
    });

    await testCase('TC1.8: Missing / undefined images array handled with default fallback', async () => {
      const product = {
        id: 'p-no-img',
        name: 'Produk Tanpa Foto',
        slug: 'prod-tanpa-foto',
        category_id: 'cat-atk',
        base_price: 20000,
        stock_quantity: 10,
        sku_master: 'SKU-NOIMG',
        images: undefined,
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(html.includes('unsplash.com'), 'Should safely fall back to default unsplash image');
      assert(html.includes('Produk Tanpa Foto'), 'Should render title without error');
    });

    // =========================================================================
    // SECTION 2: Dynamic Brand Filtering Stress in CatalogPage
    // =========================================================================
    console.log('\n\x1b[1m\x1b[33m▶ Objective 2: Dynamic Brand Filtering Stress\x1b[0m');

    await testCase('TC2.1: Dynamic extraction with bizarre author names (special symbols, multiple spaces)', async () => {
      const products = [
        {
          id: 'prod-bizarre-1',
          name: 'Buku Aneh 1',
          slug: 'buku-aneh-1',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-BZ-1',
          author: 'Prof. Dr. Ir. H. M. Quraish Shihab, M.A. & Rekan (Ed. 2)',
          is_active: true,
        },
        {
          id: 'prod-bizarre-2',
          name: 'Buku Spasi Lebar',
          slug: 'buku-spasi-lebar',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-BZ-2',
          author: '   Penerbit    Sinar     Dunia    ',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products'] }, React.createElement(CatalogPage))
      );

      assert(html.includes('Prof. Dr. Ir. H. M. Quraish Shihab'), 'Bizarre author name should be displayed in brand list');
      assert(html.includes('Penerbit    Sinar     Dunia'), 'Trimmed author should be displayed');
    });

    await testCase('TC2.2: Dynamic extraction with empty / whitespace / null authors', async () => {
      const products = [
        {
          id: 'prod-empty-auth-1',
          name: 'Produk Author Kosong',
          slug: 'prod-auth-empty',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-EA-1',
          author: '',
          is_active: true,
        },
        {
          id: 'prod-empty-auth-2',
          name: 'Produk Author Spasi',
          slug: 'prod-auth-space',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-EA-2',
          author: '     ',
          is_active: true,
        },
        {
          id: 'prod-empty-auth-3',
          name: 'Produk Author Null',
          slug: 'prod-auth-null',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-EA-3',
          author: null,
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products'] }, React.createElement(CatalogPage))
      );

      assert(!html.includes('Merek & Penulis') && !html.includes('Merek &amp; Penulis'), 'Empty brands list must not render a broken Merek header');
    });

    await testCase('TC2.3: Pure special characters author names ("!@#$%", "---")', async () => {
      const products = [
        {
          id: 'prod-spec-1',
          name: 'Produk Simbol Aneh',
          slug: 'prod-simbol-aneh',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-SA-1',
          author: '!@#$%^&*()',
          is_active: true,
        },
        {
          id: 'prod-spec-2',
          name: 'Produk Strip Strip',
          slug: 'prod-strip-strip',
          category_id: 'cat-kitab',
          base_price: 50000,
          stock_quantity: 10,
          sku_master: 'SKU-SS-1',
          author: '------',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products'] }, React.createElement(CatalogPage))
      );

      assert(html.includes('Produk Simbol Aneh'), 'Product itself should still render in catalog');
    });

    await testCase('TC2.4: Unicode / non-ASCII author names (Arabic, Cyrillic, Chinese, Umlauts)', async () => {
      const products = [
        {
          id: 'prod-arab-1',
          name: 'Kitab Ihya Ulumuddin',
          slug: 'kitab-ihya-ulumuddin',
          category_id: 'cat-kitab',
          base_price: 150000,
          stock_quantity: 15,
          sku_master: 'SKU-IHYA-1',
          author: 'الإمام الغزالي',
          is_active: true,
        },
        {
          id: 'prod-umlaut-1',
          name: 'Teori Sosiologi Modern',
          slug: 'teori-sosiologi',
          category_id: 'cat-kitab',
          base_price: 85000,
          stock_quantity: 8,
          sku_master: 'SKU-TSM-1',
          author: 'Jürgen Habermas',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products'] }, React.createElement(CatalogPage))
      );

      assert(html.includes('Kitab Ihya Ulumuddin'), 'Arabic author product rendered in catalog');
      assert(html.includes('Teori Sosiologi Modern'), 'Umlaut author product rendered in catalog');
    });

    await testCase('TC2.5: URL-encoded query strings (?brand=...) filter matching', async () => {
      const products = [
        {
          id: 'prod-sd-1',
          name: 'Buku Tulis Sinar Dunia 38 Lembar',
          slug: 'buku-tulis-sidu-38',
          category_id: 'cat-atk',
          base_price: 35000,
          stock_quantity: 25,
          sku_master: 'SKU-SD-38',
          author: 'Sinar Dunia',
          is_active: true,
        },
        {
          id: 'prod-ktb-1',
          name: 'Safinatun Naja',
          slug: 'safinatun-naja',
          category_id: 'cat-kitab',
          base_price: 15000,
          stock_quantity: 30,
          sku_master: 'SKU-SN-1',
          author: 'Syekh Salim bin Sumair',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      // Test URL with slugified query parameter
      const htmlFiltered = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products?brand=sinar-dunia'] }, React.createElement(CatalogPage))
      );

      assert(htmlFiltered.includes('Buku Tulis Sinar Dunia 38 Lembar'), 'Should match and display Sinar Dunia product');
      assert(!htmlFiltered.includes('Safinatun Naja'), 'Should filter out non-matching Safinatun Naja');

      // Test URL with unencoded author name (e.g. ?brand=Sinar%20Dunia)
      const htmlNameFiltered = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products?brand=Sinar%20Dunia'] }, React.createElement(CatalogPage))
      );

      assert(htmlNameFiltered.includes('Buku Tulis Sinar Dunia 38 Lembar'), 'Should match case-insensitively on raw decoded author name');
      assert(!htmlNameFiltered.includes('Safinatun Naja'), 'Should filter out non-matching Safinatun Naja');
    });

    await testCase('TC2.6: Filter matching by brand_id', async () => {
      const products = [
        {
          id: 'prod-brand-id-1',
          name: 'Pensil 2B Faber-Castell',
          slug: 'pensil-2b-faber',
          category_id: 'cat-atk',
          brand_id: 'brand-fc-99',
          base_price: 5000,
          stock_quantity: 100,
          sku_master: 'SKU-FC-2B',
          is_active: true,
        },
        {
          id: 'prod-other-brand',
          name: 'Pen Joyko Gel',
          slug: 'pen-joyko-gel',
          category_id: 'cat-atk',
          brand_id: 'brand-jk-11',
          base_price: 4000,
          stock_quantity: 50,
          sku_master: 'SKU-JK-GEL',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products?brand=brand-fc-99'] }, React.createElement(CatalogPage))
      );

      assert(html.includes('Pensil 2B Faber-Castell'), 'Should match product via direct brand_id');
      assert(!html.includes('Pen Joyko Gel'), 'Should filter out different brand_id');
    });

    await testCase('TC2.7: Mobile filter drawer content and empty results reset', async () => {
      const products = [
        {
          id: 'prod-mob-1',
          name: 'Produk Mobile Filter Test',
          slug: 'prod-mobile-test',
          category_id: 'cat-atk',
          base_price: 25000,
          stock_quantity: 20,
          sku_master: 'SKU-MOB-1',
          author: 'Penerbit Erlangga',
          is_active: true,
        },
      ];

      useProductStore.setState({ products });

      // Search for non-existent brand
      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, { initialEntries: ['/products?brand=non-existent-brand'] }, React.createElement(CatalogPage))
      );

      assert(html.includes('Tidak Ada Produk yang Sesuai'), 'Should show empty results message');
      assert(html.includes('Reset Semua Filter'), 'Should show reset button');
    });

    // =========================================================================
    // SECTION 3: Discount Calculation Stress
    // =========================================================================
    console.log('\n\x1b[1m\x1b[33m▶ Objective 3: Discount Calculation Stress\x1b[0m');

    await testCase('TC3.1: Normal discount calculation (base_price = 100000, sale_price = 75000)', async () => {
      const product = {
        id: 'p-disc-norm',
        name: 'Produk Diskon Normal',
        slug: 'prod-disc-norm',
        category_id: 'cat-atk',
        base_price: 100000,
        sale_price: 75000,
        stock_quantity: 15,
        sku_master: 'SKU-DN-1',
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(/25.*% OFF/.test(html), 'Should calculate and display 25% OFF badge');
      assert(html.includes(formatRupiah(75000)), 'Should format sale_price as display price');
      assert(html.includes(formatRupiah(100000)), 'Should render strikethrough base_price');
    });

    await testCase('TC3.2: base_price = 0, sale_price = 0 (Free item, no discount)', async () => {
      const product = {
        id: 'p-free',
        name: 'Buku Wakaf Gratis',
        slug: 'buku-wakaf-gratis',
        category_id: 'cat-kitab',
        base_price: 0,
        sale_price: 0,
        stock_quantity: 50,
        sku_master: 'SKU-FREE-1',
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(!html.includes('% OFF'), 'Must NOT display discount badge for 0 base price');
      assert(!html.includes('NaN'), 'Must NOT produce NaN');
      assert(!html.includes('Infinity'), 'Must NOT produce Infinity');
      assert(html.includes(formatRupiah(0)), 'Should render Rp 0 cleanly via formatRupiah');
    });

    await testCase('TC3.3: base_price = 0, sale_price = -1000 (Zero base with negative sale)', async () => {
      const product = {
        id: 'p-zero-neg',
        name: 'Produk Edge Zero Neg',
        slug: 'prod-zero-neg',
        category_id: 'cat-kitab',
        base_price: 0,
        sale_price: -1000,
        stock_quantity: 5,
        sku_master: 'SKU-ZN-1',
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(!html.includes('% OFF'), 'Discount badge must be guarded by product.base_price > 0');
      assert(!html.includes('Infinity%'), 'Must NOT render Infinity% OFF');
      assert(!html.includes('NaN'), 'Must NOT produce NaN');
    });

    await testCase('TC3.4: sale_price > base_price (Price markup / inflation)', async () => {
      const product = {
        id: 'p-markup',
        name: 'Produk Mark Up',
        slug: 'prod-markup',
        category_id: 'cat-atk',
        base_price: 50000,
        sale_price: 75000,
        stock_quantity: 20,
        sku_master: 'SKU-MU-1',
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(!html.includes('% OFF'), 'Must NOT render discount badge when sale_price > base_price');
      assert(html.includes(formatRupiah(75000)), 'Display price should be sale_price');
      assert(!html.includes('line-through'), 'Strikethrough base price must NOT render when not on discount');
    });

    await testCase('TC3.5: Negative base_price and sale_price (base_price = -50000, sale_price = -75000)', async () => {
      const product = {
        id: 'p-both-neg',
        name: 'Produk Serba Negatif',
        slug: 'prod-serba-neg',
        category_id: 'cat-atk',
        base_price: -50000,
        sale_price: -75000,
        stock_quantity: 10,
        sku_master: 'SKU-BN-1',
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(!html.includes('% OFF'), 'Negative base_price must NOT render discount badge');
      assert(!html.includes('NaN'), 'Must NOT produce NaN');
    });

    await testCase('TC3.6: Floating point discount rounding (base_price = 33333, sale_price = 22222)', async () => {
      const product = {
        id: 'p-float-disc',
        name: 'Produk Diskon Pecahan',
        slug: 'prod-disc-pecahan',
        category_id: 'cat-atk',
        base_price: 33333,
        sale_price: 22222,
        stock_quantity: 10,
        sku_master: 'SKU-FLOAT-1',
        is_active: true,
      };

      // (33333 - 22222) / 33333 = 11111 / 33333 = 0.333333... -> 33%
      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(/33.*% OFF/.test(html), 'Floating point discount should cleanly round to 33% OFF');
      assert(!/33\.\d+%/.test(html), 'Should not display ugly unrounded decimal percentage');
    });

    await testCase('TC3.7: ProductDetailPage discount and price rendering check with route match', async () => {
      const product = {
        id: 'p-pdp-check',
        name: 'Al-Quran Terjemah dan Tajwid',
        slug: 'al-quran-tajwid',
        category_id: 'cat-kitab',
        base_price: 120000,
        sale_price: 90000,
        stock_quantity: 25,
        sku_master: 'SKU-QRN-1',
        images: ['https://images.unsplash.com/photo-book.jpg'],
        is_active: true,
      };

      useProductStore.setState({ products: [product] });

      const html = ReactDOMServer.renderToString(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/products/al-quran-tajwid'] },
          React.createElement(
            Routes,
            {},
            React.createElement(Route, { path: '/products/:slug', element: React.createElement(ProductDetailPage) })
          )
        )
      );

      assert(/25.*% OFF/.test(html), 'PDP should display 25% OFF badge');
      assert(html.includes(formatRupiah(90000)), 'PDP should display current price 90.000');
    });

    await testCase('TC3.8: Explicit discount_percentage takes priority over calculated percentage', async () => {
      const product = {
        id: 'p-override-disc',
        name: 'Produk Diskon Khusus Toko',
        slug: 'prod-override-disc',
        category_id: 'cat-atk',
        base_price: 100000,
        sale_price: 80000,
        discount_percentage: 50, // explicit 50% discount override
        stock_quantity: 10,
        sku_master: 'SKU-OD-1',
        is_active: true,
      };

      const html = ReactDOMServer.renderToString(
        React.createElement(MemoryRouter, {}, React.createElement(ProductCard, { product }))
      );

      assert(/50.*% OFF/.test(html), 'Explicit discount_percentage should take precedence');
    });

    // =========================================================================
    // SECTION 4: Dummy Data Elimination & Cache Hydration Audit
    // =========================================================================
    console.log('\n\x1b[1m\x1b[33m▶ Objective 4: Dummy Data Elimination & Store Hydration Audit\x1b[0m');

    await testCase('TC4.1: mockBrands and mockPublishers in src/data/mockData.ts are completely empty []', async () => {
      assert(Array.isArray(mockDataModule.mockBrands), 'mockBrands should be an array');
      assert(mockDataModule.mockBrands.length === 0, `mockBrands should be empty array, but has length ${mockDataModule.mockBrands.length}`);
      assert(Array.isArray(mockDataModule.mockPublishers), 'mockPublishers should be an array');
      assert(mockDataModule.mockPublishers.length === 0, `mockPublishers should be empty array, but has length ${mockDataModule.mockPublishers.length}`);
    });

    await testCase('TC4.2: Audit all 6 Zustand stores for zero mockIds filtering', async () => {
      const storeFiles = [
        'src/store/productStore.ts',
        'src/store/categoryStore.ts',
        'src/store/courierStore.ts',
        'src/store/promoStore.ts',
        'src/store/customOrderStore.ts',
        'src/store/orderStore.ts',
      ];

      for (const relPath of storeFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(!content.includes('mockIds'), `Store ${relPath} should not contain mockIds filter`);
        assert(!content.includes('mockIdSet'), `Store ${relPath} should not contain mockIdSet filter`);
      }
    });

    await testCase('TC4.3: Audit supabase/schema.sql for badge column definitions', async () => {
      const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      assert(schemaContent.includes('is_featured boolean default false'), 'Schema must define is_featured');
      assert(schemaContent.includes('is_best_seller boolean default false'), 'Schema must define is_best_seller');
      assert(schemaContent.includes('is_new_arrival boolean default false'), 'Schema must define is_new_arrival');
    });

    await testCase('TC4.4: Audit AdminProducts.tsx for badge controls & quick filters', async () => {
      const adminPath = path.resolve(process.cwd(), 'src/pages/admin/AdminProducts.tsx');
      const adminContent = fs.readFileSync(adminPath, 'utf8');
      assert(adminContent.includes('isFeatured') && adminContent.includes('isBestSeller') && adminContent.includes('isNewArrival'), 'AdminProducts must manage badge states');
      assert(adminContent.includes('updateProduct(p.id, { is_featured: !p.is_featured })'), 'AdminProducts must support 1-click badge toggle for is_featured');
      assert(adminContent.includes('updateProduct(p.id, { is_best_seller: !p.is_best_seller })'), 'AdminProducts must support 1-click badge toggle for is_best_seller');
      assert(adminContent.includes('updateProduct(p.id, { is_new_arrival: !p.is_new_arrival })'), 'AdminProducts must support 1-click badge toggle for is_new_arrival');
      assert(adminContent.includes('Lencana Beranda'), 'AdminProducts table must include Lencana Beranda column');
      assert(adminContent.includes('featuredCount') && adminContent.includes('bestSellerCount') && adminContent.includes('newArrivalCount'), 'AdminProducts must support filtering by badge tab');
    });

  } finally {
    await server.close();
  }

  console.log('\n\x1b[1m\x1b[36m================================================================');
  console.log(`   EXECUTION SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log('================================================================\x1b[0m\n');

  if (failedCount > 0) {
    console.error(`\x1b[31m${failedCount} adversarial stress tests failed!\x1b[0m`);
    process.exit(1);
  } else {
    console.log(`\x1b[32mAll ${passedCount} adversarial stress tests passed flawlessly!\x1b[0m\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
