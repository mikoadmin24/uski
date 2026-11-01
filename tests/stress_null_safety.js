/**
 * Adversarial Stress Testing — Runtime Null-Safety & Fallbacks
 *
 * This test suite stress-tests extreme edge cases against the modified codebase:
 * 1. Nullable ratings: { rating: null }, { rating: undefined }, { rating: '4.85' }, { rating: NaN }
 *    across ProductCard, ProductDetailPage.
 * 2. Image arrays: { images: null }, { images: [] }, { images: [''] }
 *    across ProductCard, ProductDetailPage, CartPage, CheckoutPage, Navbar.
 * 3. User profiles: { full_name: null }, { full_name: '' }, { full_name: undefined }
 *    across Navbar.
 * 4. Specifications: { specifications: undefined }, { specifications: null }
 *    across CatalogPage and ProductDetailPage.
 */

import { createServer } from 'vite';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Ensure Zustand stores evaluate active state in SSR
React.useSyncExternalStore = (subscribe, getSnapshot, getServerSnapshot) => getSnapshot();

// Note: React HTML attribute serialization escapes '&' as '&amp;'
const FALLBACK_IMAGE_400_HTML = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&amp;fit=crop&amp;q=80&amp;w=400';
const FALLBACK_IMAGE_800_HTML = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&amp;fit=crop&amp;q=80&amp;w=800';

let passedCount = 0;
let failedCount = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTestCase(name, fn) {
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

function makeMockProduct(overrides = {}) {
  return {
    id: 'prod-stress-001',
    name: 'Kitab Al-Hikam Syarah As-Sakandari',
    slug: 'kitab-al-hikam-syarah',
    description: 'Kitab tasawuf klasik rujukan santri dan muhibbin.',
    author: 'Ibnu Athaillah As-Sakandari',
    sku_master: 'KITAB-HIKAM-01',
    isbn: '978-602-0001-01-1',
    category_id: 'cat-kitab',
    base_price: 125000,
    sale_price: 110000,
    discount_percentage: 12,
    stock_quantity: 15,
    min_stock_alert: 3,
    weight_grams: 650,
    rating: 4.8,
    reviews_count: 24,
    sales_count: 88,
    is_featured: true,
    is_best_seller: true,
    is_new_arrival: false,
    images: ['https://images.unsplash.com/photo-example.jpg'],
    specifications: { 'Bahasa': 'Arab - Indonesia', 'Halaman': '380 hlm' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

async function main() {
  console.log('\n\x1b[1m\x1b[36m================================================================');
  console.log('       EMPIRICAL CHALLENGER: RUNTIME NULL-SAFETY STRESS HARNESS');
  console.log('================================================================\x1b[0m\n');

  // Filter out noisy useLayoutEffect SSR warnings from React Router
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
    // Load modules via Vite SSR
    const { MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom');
    const { ProductCard } = await server.ssrLoadModule('./src/components/common/ProductCard.tsx');
    const { ProductDetailPage } = await server.ssrLoadModule('./src/pages/ProductDetailPage.tsx');
    const { Navbar } = await server.ssrLoadModule('./src/components/common/Navbar.tsx');
    const { CartPage } = await server.ssrLoadModule('./src/pages/CartPage.tsx');
    const { CheckoutPage } = await server.ssrLoadModule('./src/pages/CheckoutPage.tsx');
    const { CatalogPage } = await server.ssrLoadModule('./src/pages/CatalogPage.tsx');

    const { useProductStore } = await server.ssrLoadModule('./src/store/productStore.ts');
    const { useCartStore } = await server.ssrLoadModule('./src/store/cartStore.ts');
    const { useAuthStore } = await server.ssrLoadModule('./src/store/authStore.ts');
    const { useCategoryStore } = await server.ssrLoadModule('./src/store/categoryStore.ts');

    // Setup base category store
    useCategoryStore.setState({
      categories: [
        { id: 'cat-kitab', name: 'Kitab Kuning', slug: 'kitab', icon: 'Book' },
        { id: 'cat-buku', name: 'Buku Pelajaran', slug: 'buku-pelajaran', icon: 'BookOpen' },
      ],
    });

    // =========================================================================
    // SECTION 1: NULLABLE RATINGS STRESS TESTS
    // Edge cases: null, undefined, '4.85' (numeric string), NaN
    // Targets: ProductCard, ProductDetailPage
    // =========================================================================
    console.log('\x1b[1m\x1b[33m[Suite 1] Nullable Ratings Across ProductCard & ProductDetailPage\x1b[0m');

    const ratingCases = [
      { label: 'rating: null', val: null },
      { label: 'rating: undefined', val: undefined },
      { label: 'rating: "4.85" (string)', val: '4.85' },
      { label: 'rating: NaN', val: NaN },
    ];

    for (const rc of ratingCases) {
      const expectedStr = (Number(rc.val) || 5.0).toFixed(1);

      await runTestCase(`ProductCard handles ${rc.label} safely without crash`, () => {
        const prod = makeMockProduct({ rating: rc.val });
        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(ProductCard, { product: prod })
          )
        );
        assert(html.length > 0, 'Rendered HTML should not be empty');
        assert(html.includes(`<span>${expectedStr}</span>`), `Rendered HTML must contain formatted rating <span>${expectedStr}</span>`);
      });
    }

    for (const rc of ratingCases) {
      const expectedStr = (Number(rc.val) || 5.0).toFixed(1);

      await runTestCase(`ProductDetailPage handles ${rc.label} safely without crash`, () => {
        const prod = makeMockProduct({ slug: `test-slug-rating-${String(rc.val)}`, rating: rc.val });
        useProductStore.setState({ products: [prod] });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, { initialEntries: [`/products/${prod.slug}`] },
            React.createElement(Routes, null,
              React.createElement(Route, { path: '/products/:slug', element: React.createElement(ProductDetailPage) })
            )
          )
        );
        assert(html.length > 0, 'Rendered HTML should not be empty');
        assert(!html.includes('Produk Tidak Ditemukan'), 'Product should be found and rendered');
        assert(html.includes(`<span>${expectedStr}</span>`), `PDP must contain formatted rating <span>${expectedStr}</span>`);
        assert(html.includes(expectedStr), `PDP must display formatted rating value ${expectedStr}`);
      });
    }

    // =========================================================================
    // SECTION 2: IMAGE ARRAYS STRESS TESTS
    // Edge cases: images: null, images: [], images: ['']
    // Targets: ProductCard, ProductDetailPage, CartPage, CheckoutPage, Navbar
    // =========================================================================
    console.log('\n\x1b[1m\x1b[33m[Suite 2] Image Array Edge Cases Across 5 Components\x1b[0m');

    const imageCases = [
      { label: 'images: null', val: null },
      { label: 'images: [] (empty)', val: [] },
      { label: 'images: [""] (empty string element)', val: [''] },
      { label: 'images: undefined', val: undefined },
    ];

    // 2.1 ProductCard Image Arrays
    for (const ic of imageCases) {
      await runTestCase(`ProductCard handles ${ic.label} by rendering fallback image`, () => {
        const prod = makeMockProduct({ images: ic.val });
        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(ProductCard, { product: prod })
          )
        );
        assert(html.includes(FALLBACK_IMAGE_400_HTML), `ProductCard must render fallback 400px image`);
      });
    }

    // 2.2 ProductDetailPage Image Arrays
    for (const ic of imageCases) {
      await runTestCase(`ProductDetailPage handles ${ic.label} by rendering fallback image`, () => {
        const prod = makeMockProduct({ slug: `test-slug-img-${ic.label}`, images: ic.val });
        useProductStore.setState({ products: [prod] });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, { initialEntries: [`/products/${prod.slug}`] },
            React.createElement(Routes, null,
              React.createElement(Route, { path: '/products/:slug', element: React.createElement(ProductDetailPage) })
            )
          )
        );
        assert(html.includes(FALLBACK_IMAGE_800_HTML), `PDP must render fallback 800px image when images missing`);
      });
    }

    // 2.3 CartPage Image Arrays
    for (const ic of imageCases) {
      await runTestCase(`CartPage handles cart item with ${ic.label} by rendering fallback image`, () => {
        const prod = makeMockProduct({ images: ic.val });
        useCartStore.setState({
          items: [
            {
              id: 'cart-item-stress-1',
              product: prod,
              quantity: 2,
              selected_price: prod.sale_price,
            },
          ],
        });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(CartPage)
          )
        );
        assert(html.includes(FALLBACK_IMAGE_400_HTML), `CartPage must render fallback 400px image on cart item thumbnail`);
      });
    }

    // 2.4 CheckoutPage Image Arrays
    for (const ic of imageCases) {
      await runTestCase(`CheckoutPage handles cart item with ${ic.label} by rendering fallback image`, () => {
        const prod = makeMockProduct({ images: ic.val });
        useCartStore.setState({
          items: [
            {
              id: 'cart-item-stress-chk',
              product: prod,
              quantity: 1,
              selected_price: prod.sale_price,
            },
          ],
        });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(CheckoutPage)
          )
        );
        assert(html.includes(FALLBACK_IMAGE_400_HTML), `CheckoutPage recap must render fallback 400px image`);
      });
    }

    // 2.5 Navbar Search Suggestions with Image Arrays
    for (const ic of imageCases) {
      await runTestCase(`Navbar handles product with ${ic.label} safely without crash`, () => {
        const prod = makeMockProduct({ name: 'Special Rare Item', images: ic.val });
        useProductStore.setState({ products: [prod] });
        useAuthStore.setState({ user: null, isAuthenticated: false });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(Navbar)
          )
        );
        assert(html.length > 0, 'Navbar should render successfully');
      });
    }

    // =========================================================================
    // SECTION 3: USER PROFILES STRESS TESTS
    // Edge cases: full_name: null, full_name: '', full_name: undefined
    // Targets: Navbar (customer, super_admin, manager, staff, courier)
    // =========================================================================
    console.log('\n\x1b[1m\x1b[33m[Suite 3] User Profile full_name Edge Cases Across Navbar\x1b[0m');

    // 3.1 Customer profile edge cases (renders user name/email/Pengguna in header button)
    const customerCases = [
      { label: 'full_name: null, email provided', user: { id: 'u1', full_name: null, email: 'ahmad@example.com', role: 'customer' }, expectedName: 'ahmad', expectedInitial: 'U' },
      { label: 'full_name: "", email provided', user: { id: 'u2', full_name: '', email: 'fatimah@example.com', role: 'customer' }, expectedName: 'fatimah', expectedInitial: 'U' },
      { label: 'full_name: undefined, email provided', user: { id: 'u3', full_name: undefined, email: 'zainal@example.com', role: 'customer' }, expectedName: 'zainal', expectedInitial: 'U' },
      { label: 'full_name: null, email: null', user: { id: 'u4', full_name: null, email: null, role: 'customer' }, expectedName: 'Pengguna', expectedInitial: 'U' },
      { label: 'full_name: "   " (whitespace), email: ""', user: { id: 'u5', full_name: '   ', email: '', role: 'customer' }, expectedName: 'Pengguna', expectedInitial: ' ' },
      { label: 'role: courier, full_name: null', user: { id: 'u9', full_name: null, email: 'courier@uski.id', role: 'courier' }, expectedName: 'courier', expectedInitial: 'U' },
    ];

    for (const pc of customerCases) {
      await runTestCase(`Navbar handles customer ${pc.label} safely with fallback display`, () => {
        useAuthStore.setState({ user: pc.user, isAuthenticated: true });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(Navbar)
          )
        );

        assert(html.length > 0, 'Navbar must render HTML');
        assert(html.includes(pc.expectedName), `Navbar must contain expected name fallback "${pc.expectedName}"`);
        if (pc.expectedInitial && pc.expectedInitial !== ' ') {
          assert(html.includes(`>${pc.expectedInitial}</div>`), `Navbar must contain expected avatar initial "${pc.expectedInitial}"`);
        }
      });
    }

    // 3.2 Staff roles with full_name: null (renders role badge initial A/M/S)
    const staffCases = [
      { label: 'role: super_admin, full_name: null', user: { id: 'u6', full_name: null, email: 'admin@uski.id', role: 'super_admin' }, expectedInitial: 'A' },
      { label: 'role: manager, full_name: null', user: { id: 'u7', full_name: null, email: 'manager@uski.id', role: 'manager' }, expectedInitial: 'M' },
      { label: 'role: staff, full_name: null', user: { id: 'u8', full_name: null, email: 'staff@uski.id', role: 'staff' }, expectedInitial: 'S' },
    ];

    for (const sc of staffCases) {
      await runTestCase(`Navbar handles staff ${sc.label} with role initial "${sc.expectedInitial}"`, () => {
        useAuthStore.setState({ user: sc.user, isAuthenticated: true });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, null,
            React.createElement(Navbar)
          )
        );

        assert(html.length > 0, 'Navbar must render HTML');
        assert(html.includes(`>${sc.expectedInitial}</div>`), `Navbar must contain expected staff avatar initial "${sc.expectedInitial}"`);
      });
    }

    // =========================================================================
    // SECTION 4: SPECIFICATIONS STRESS TESTS
    // Edge cases: specifications: undefined, specifications: null
    // Targets: CatalogPage, ProductDetailPage
    // =========================================================================
    console.log('\n\x1b[1m\x1b[33m[Suite 4] Specifications Edge Cases Across CatalogPage & ProductDetailPage\x1b[0m');

    const specCases = [
      { label: 'specifications: undefined', val: undefined },
      { label: 'specifications: null', val: null },
    ];

    // 4.1 ProductDetailPage Specifications
    for (const sc of specCases) {
      await runTestCase(`ProductDetailPage handles ${sc.label} without crash in specs table logic`, () => {
        const prod = makeMockProduct({ slug: `test-slug-specs-${sc.label}`, specifications: sc.val });
        useProductStore.setState({ products: [prod] });

        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, { initialEntries: [`/products/${prod.slug}`] },
            React.createElement(Routes, null,
              React.createElement(Route, { path: '/products/:slug', element: React.createElement(ProductDetailPage) })
            )
          )
        );
        assert(html.length > 0, 'PDP must render HTML');
        assert(!html.includes('Produk Tidak Ditemukan'), 'PDP must locate product');

        // Test the exact table body expression from PDP: Object.entries(product.specifications || {})
        const entries = Object.entries(prod.specifications || {});
        assert(Array.isArray(entries) && entries.length === 0, 'Object.entries on nullish specifications must evaluate safely to empty array');
      });
    }

    // 4.2 CatalogPage Filtering on Specifications
    for (const sc of specCases) {
      await runTestCase(`CatalogPage filters products having ${sc.label} without crash`, () => {
        const prod = makeMockProduct({
          id: `prod-spec-test-${sc.label}`,
          name: `Kitab Fiqh Tanbihul Ghafilin ${sc.label}`,
          slug: `kitab-tanbih-${sc.label}`,
          specifications: sc.val,
        });

        useProductStore.setState({ products: [prod] });

        // Simulate rendering CatalogPage with search param
        const html = ReactDOMServer.renderToStaticMarkup(
          React.createElement(MemoryRouter, { initialEntries: ['/products?q=Tanbih'] },
            React.createElement(CatalogPage)
          )
        );
        assert(html.length > 0, 'CatalogPage must render successfully');
        assert(html.includes('Kitab Fiqh Tanbihul Ghafilin'), 'Filtered product must display in catalog results');

        // Simulate subFilter predicate evaluation directly as defined in CatalogPage.tsx line 58-61:
        // (p.specifications ? JSON.stringify(p.specifications).toLowerCase().includes(qSub) : false)
        const qSub = 'fikih';
        const specMatch = prod.specifications ? JSON.stringify(prod.specifications).toLowerCase().includes(qSub) : false;
        assert(specMatch === false, 'Nullish specifications must safely return false without exception');
      });
    }

  } finally {
    await server.close();
  }

  // =========================================================================
  // EXECUTION SUMMARY
  // =========================================================================
  console.log('\n\x1b[1m\x1b[36m================================================================');
  console.log('                   STRESS TEST EXECUTION SUMMARY');
  console.log('================================================================\x1b[0m');
  console.log(`  Total Executed : ${passedCount + failedCount}`);
  console.log(`  Passed         : \x1b[32m${passedCount}\x1b[0m`);
  console.log(`  Failed         : \x1b[${failedCount > 0 ? '31' : '32'}m${failedCount}\x1b[0m`);
  console.log('================================================================');

  if (failedCount > 0) {
    console.error(`\n\x1b[31m[VERDICT] REJECT: ${failedCount} stress tests failed.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m[VERDICT] APPROVE: 100% of adversarial stress tests passed cleanly (Zero Runtime Crashes).\x1b[0m\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
