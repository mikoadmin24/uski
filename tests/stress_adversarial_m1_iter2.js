/**
 * Adversarial Re-Challenge Test Suite for Milestone 1 Iteration 2
 * Author: challenger_m1_iter2 (teamwork_challenger)
 * 
 * Verifies that all 5 defects identified in Iteration 1 are completely eliminated,
 * stress-testing edge case malformed slugs, fail-closed category filtering,
 * uppercase category query handling, and SSR route rendering resilience.
 */

import { createServer } from 'vite';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Ensure Zustand stores evaluate active state in SSR
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
  console.log('\n\x1b[1m\x1b[35m================================================================');
  console.log('   EMPIRICAL CHALLENGER: M1 ITERATION 2 RE-CHALLENGE HARNESS');
  console.log('================================================================\x1b[0m\n');

  // Suppress useLayoutEffect SSR warning
  const origError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) {
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
    const { ProductDetailPage } = await server.ssrLoadModule('./src/pages/ProductDetailPage.tsx');
    const { CatalogPage } = await server.ssrLoadModule('./src/pages/CatalogPage.tsx');
    const { StaticPolicyPage } = await server.ssrLoadModule('./src/pages/StaticPolicyPage.tsx');
    const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
    const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');

    // Setup Mock Categories
    const testCategories = [
      { id: 'cat-kitab', name: 'Kitab Kuning & Pesantren', slug: 'kitab-kuning', icon: 'Book' },
      { id: 'cat-atk', name: 'Buku Tulis & ATK', slug: 'buku-tulis-dan-atk', icon: 'FileText' },
      { id: 'cat-novel', name: 'Buku Umum & Novel', slug: 'buku-umum', icon: 'BookOpen' },
    ];
    useCategoryStore.setState({ categories: testCategories });

    // Setup Mock Products
    const testProducts = [
      {
        id: 'prod-kitab-01',
        name: 'Kitab Fathul Qorib Al Mujib',
        slug: 'kitab-fathul-qorib',
        category_id: 'cat-kitab',
        base_price: 35000,
        sale_price: 32000,
        stock_quantity: 20,
        sku_master: 'KTB-FQ-01',
        rating: 4.9,
        reviews_count: 15,
        images: ['https://images.unsplash.com/photo-book1.jpg'],
        specifications: { Bahasa: 'Arab' },
      },
      {
        id: 'prod-atk-01',
        name: 'Buku Tulis Sinar Dunia 58 Lembar',
        slug: 'buku-tulis-sidu-58',
        category_id: 'cat-atk',
        base_price: 45000,
        sale_price: 42000,
        stock_quantity: 50,
        sku_master: 'ATK-SD-58',
        rating: 4.8,
        reviews_count: 40,
        images: ['https://images.unsplash.com/photo-book2.jpg'],
      },
      {
        id: 'prod-novel-01',
        name: 'Atomic Habits',
        slug: 'atomic-habits',
        category_id: 'cat-novel',
        base_price: 98000,
        sale_price: 88000,
        stock_quantity: 15,
        sku_master: 'NVL-AH-01',
        rating: 5.0,
        reviews_count: 99,
        images: ['https://images.unsplash.com/photo-book3.jpg'],
      },
      {
        id: 'prod-special-01',
        name: 'Produk Diskon Spesial',
        slug: 'diskon-50%', // Edge case: slug with literal percent stored
        category_id: 'cat-atk',
        base_price: 50000,
        sale_price: 25000,
        stock_quantity: 10,
        sku_master: 'SPC-50-PCT',
        rating: 4.5,
        reviews_count: 5,
        images: ['https://images.unsplash.com/photo-book4.jpg'],
      },
    ];
    useProductStore.setState({ products: testProducts });

    // =========================================================================
    // SUITE 1: MALFORMED SLUGS & URI RESILIENCE
    // =========================================================================
    console.log('\x1b[36m--- Suite 1: Malformed Slug Edge Cases (productStore & PDP) ---\x1b[0m');

    const malformedSlugs = [
      'diskon-50%',
      'buku%2',
      '%E0%A4%A',
      '%',
      '%%',
      '%ZZ',
      '%%%',
      '%1',
      '%E0%A4',
      'item%',
      'promo%20',
      'abc%def',
      '%a%b%c%',
      '   %   ',
    ];

    for (const slug of malformedSlugs) {
      await testCase(`productStore.getProductBySlug safe on malformed slug "${slug}"`, () => {
        let res;
        try {
          res = useProductStore.getState().getProductBySlug(slug);
        } catch (err) {
          throw new Error(`Threw ${err.name}: ${err.message} on slug "${slug}"`);
        }
        // If the slug is 'diskon-50%', it should actually find prod-special-01 via fallback!
        if (slug === 'diskon-50%') {
          assert(res && res.id === 'prod-special-01', 'Should match product with slug diskon-50% via fallback');
        }
      });
    }

    for (const slug of ['diskon-50%', 'buku%2', '%E0%A4%A', '%', '%%', '%ZZ']) {
      await testCase(`ProductDetailPage SSR renders without crash on route /products/${slug}`, () => {
        let html;
        try {
          const element = React.createElement(
            MemoryRouter,
            { initialEntries: [`/products/${encodeURIComponent(slug)}`] },
            React.createElement(
              Routes,
              null,
              React.createElement(Route, { path: '/products/:slug', element: React.createElement(ProductDetailPage) })
            )
          );
          html = ReactDOMServer.renderToString(element);
        } catch (err) {
          throw new Error(`PDP crashed on route /products/${slug}: ${err.message}`);
        }

        if (slug === 'diskon-50%') {
          // Found via fallback
          assert(html.includes('Produk Diskon Spesial'), 'Should render product details for matched slug');
        } else {
          // Not found -> clean 404 message
          assert(html.includes('Produk Tidak Ditemukan'), 'Should render safe not-found state without crashing');
        }
      });
    }

    // =========================================================================
    // SUITE 2: FAIL-CLOSED CATEGORY QUERIES
    // =========================================================================
    console.log('\n\x1b[36m--- Suite 2: Fail-Closed Category Filtering in CatalogPage ---\x1b[0m');

    const invalidCategories = [
      'invalid-category',
      'non-existent-123',
      'xyz-unknown',
      '<script>alert(1)</script>',
      'cat-kitab', // This is category ID, NOT category slug
      'null',
      'undefined',
    ];

    for (const catQuery of invalidCategories) {
      await testCase(`CatalogPage returns 0 products for invalid category "${catQuery}"`, () => {
        const element = React.createElement(
          MemoryRouter,
          { initialEntries: [`/products?category=${encodeURIComponent(catQuery)}`] },
          React.createElement(CatalogPage)
        );
        const html = ReactDOMServer.renderToString(element);

        // Header shows fallback 'Katalog Produk'
        assert(html.includes('Katalog Produk'), 'Header title should fall back to Katalog Produk');
        // Product counter must be 0
        assert(
          html.includes('Menampilkan <span class="font-bold text-[#101519]">0</span> produk'),
          `Product count must be 0, html snippet: ${html.slice(html.indexOf('Menampilkan'), html.indexOf('Menampilkan') + 80)}`
        );
        // None of the mock product titles should be present
        assert(!html.includes('Kitab Fathul Qorib Al Mujib'), 'Must not display any products from other categories');
        assert(!html.includes('Buku Tulis Sinar Dunia'), 'Must not display any products from other categories');
        assert(!html.includes('Atomic Habits'), 'Must not display any products from other categories');
      });
    }

    // =========================================================================
    // SUITE 3: UPPERCASE & MIXED-CASE CATEGORY QUERIES
    // =========================================================================
    console.log('\n\x1b[36m--- Suite 3: Uppercase & Mixed-Case Category Queries ---\x1b[0m');

    const validCategoryVariations = [
      {
        query: 'KITAB-KUNING',
        expectedTitle: 'Kitab Kuning &amp; Pesantren',
        expectedProduct: 'Kitab Fathul Qorib Al Mujib',
        expectedCount: 1,
      },
      {
        query: 'kitab-kuning',
        expectedTitle: 'Kitab Kuning &amp; Pesantren',
        expectedProduct: 'Kitab Fathul Qorib Al Mujib',
        expectedCount: 1,
      },
      {
        query: 'Kitab-Kuning',
        expectedTitle: 'Kitab Kuning &amp; Pesantren',
        expectedProduct: 'Kitab Fathul Qorib Al Mujib',
        expectedCount: 1,
      },
      {
        query: 'BUKU-TULIS-DAN-ATK',
        expectedTitle: 'Buku Tulis &amp; ATK',
        expectedProduct: 'Buku Tulis Sinar Dunia 58 Lembar',
        expectedCount: 2, // prod-atk-01 and prod-special-01
      },
      {
        query: 'buku-umum',
        expectedTitle: 'Buku Umum &amp; Novel',
        expectedProduct: 'Atomic Habits',
        expectedCount: 1,
      },
    ];

    for (const { query, expectedTitle, expectedProduct, expectedCount } of validCategoryVariations) {
      await testCase(`CatalogPage handles category "${query}": title & button highlight`, () => {
        const element = React.createElement(
          MemoryRouter,
          { initialEntries: [`/products?category=${query}`] },
          React.createElement(CatalogPage)
        );
        const html = ReactDOMServer.renderToString(element);

        // 1. Check Header Title
        assert(
          html.includes(expectedTitle),
          `Header title must display "${expectedTitle}". Did not find in HTML.`
        );

        // 2. Check Product Count
        assert(
          html.includes(`Menampilkan <span class="font-bold text-[#101519]">${expectedCount}</span> produk`),
          `Expected ${expectedCount} product(s) for category ${query}`
        );

        // 3. Check Expected Product is rendered
        assert(html.includes(expectedProduct), `Expected product "${expectedProduct}" to be present`);

        // 4. Check Button Active Highlight:
        // The active button should have 'bg-primary text-white font-bold'
        // And "Semua Kategori" should NOT have 'bg-primary text-white font-bold'
        // Let's verify active styling on the specific category button
        const activeClass = 'bg-primary text-white font-bold';
        assert(html.includes(activeClass), 'At least one button must have active class');

        // Regex check for "Semua Kategori" button styling
        const semuaKategoriMatch = html.match(/<button[^>]*>[\s\S]*?Semua Kategori[\s\S]*?<\/button>/);
        assert(semuaKategoriMatch, 'Semua Kategori button must exist');
        assert(
          !semuaKategoriMatch[0].includes('bg-primary text-white font-bold'),
          'Semua Kategori button must NOT be active when specific category is selected'
        );
      });
    }

    // Check default / no category query: "Semua Kategori" should be active
    await testCase('CatalogPage with empty/no category query highlights "Semua Kategori"', () => {
      const element = React.createElement(
        MemoryRouter,
        { initialEntries: ['/products'] },
        React.createElement(CatalogPage)
      );
      const html = ReactDOMServer.renderToString(element);

      assert(html.includes('Semua Produk'), 'Header title must be "Semua Produk"');
      assert(
        html.includes('Menampilkan <span class="font-bold text-[#101519]">4</span> produk'),
        'All 4 products should be displayed'
      );

      const semuaKategoriMatch = html.match(/<button[^>]*>[\s\S]*?Semua Kategori[\s\S]*?<\/button>/);
      assert(semuaKategoriMatch, 'Semua Kategori button must exist');
      assert(
        semuaKategoriMatch[0].includes('bg-primary text-white font-bold'),
        'Semua Kategori button MUST be active when no category is selected'
      );
    });

    // =========================================================================
    // SUITE 4: POLICY PAGE ROUTE RESOLUTION
    // =========================================================================
    console.log('\n\x1b[36m--- Suite 4: StaticPolicyPage Route Case-Insensitivity ---\x1b[0m');

    const policyRoutes = [
      { route: '/policies/PRIVACY', expected: 'Kebijakan Privasi (Privacy Policy)' },
      { route: '/policies/Privacy', expected: 'Kebijakan Privasi (Privacy Policy)' },
      { route: '/policies/TERMS', expected: 'Syarat &amp; Ketentuan Layanan (Terms &amp; Conditions)' },
      { route: '/policies/Terms', expected: 'Syarat &amp; Ketentuan Layanan (Terms &amp; Conditions)' },
      { route: '/policies/SHIPPING', expected: 'Kebijakan Pengiriman &amp; Ekspedisi' },
      { route: '/policies/Shipping', expected: 'Kebijakan Pengiriman &amp; Ekspedisi' },
      { route: '/policies/PAYMENT', expected: 'Kebijakan &amp; Panduan Pembayaran' },
      { route: '/policies/Payment', expected: 'Kebijakan &amp; Panduan Pembayaran' },
      { route: '/policies/RETURNS', expected: 'Kebijakan Garansi &amp; Retur Barang' },
      { route: '/policies/Returns', expected: 'Kebijakan Garansi &amp; Retur Barang' },
      { route: '/policies/unknown-type', expected: 'Tentang USKI STORE &amp; Hubungi Kami' },
    ];

    for (const { route, expected } of policyRoutes) {
      await testCase(`StaticPolicyPage resolves ${route} correctly`, () => {
        const element = React.createElement(
          MemoryRouter,
          { initialEntries: [route] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/policies/:type', element: React.createElement(StaticPolicyPage) })
          )
        );
        const html = ReactDOMServer.renderToString(element);
        assert(html.includes(expected), `Expected content "${expected}" in route ${route}`);
      });
    }

  } finally {
    await server.close();
  }

  console.log('\n\x1b[1m\x1b[35m================================================================');
  console.log('             RE-CHALLENGE EXECUTION SUMMARY');
  console.log('================================================================\x1b[0m');
  console.log(`  Total Executed : ${passedCount + failedCount}`);
  console.log(`  Passed         : \x1b[32m${passedCount}\x1b[0m`);
  console.log(`  Failed         : \x1b[31m${failedCount}\x1b[0m`);
  console.log('\x1b[1m\x1b[35m================================================================\x1b[0m\n');

  if (failedCount > 0) {
    console.error('\x1b[31mRE-CHALLENGE VERDICT: REJECT (Defects Detected)\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32mRE-CHALLENGE VERDICT: APPROVE (All Stress Tests Passed Cleanly)\x1b[0m\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal Harness Failure:', err);
  process.exit(1);
});
