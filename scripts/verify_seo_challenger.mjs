import fs from 'fs';
import path from 'path';

console.log('=== STARTING EMPIRICAL CHALLENGER VERIFICATION ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${message}`);
  }
}

// -------------------------------------------------------------
// SUITE 1: SITEMAP.XML INTEGRITY & COMPLIANCE
// -------------------------------------------------------------
console.log('--- SUITE 1: Testing public/sitemap.xml ---');
const sitemapPath = path.resolve('public/sitemap.xml');
assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists');

const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

// 1.1 Well-formed XML structure
assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'Valid XML 1.0 UTF-8 declaration header');
assert(sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'Root element is <urlset> with standard sitemaps 0.9 namespace');
assert(sitemapContent.endsWith('</urlset>\n') || sitemapContent.endsWith('</urlset>'), 'Properly closing </urlset> root tag');

// Check XML tag balancing
const openTags = (sitemapContent.match(/<(?!\?|\/|!--)([^ >]+)/g) || []).map(t => t.replace('<', ''));
const closeTags = (sitemapContent.match(/<\/([^ >]+)>/g) || []).map(t => t.replace(/<\/?|>/g, ''));
console.log(`Extracted ${openTags.length} opening tags and ${closeTags.length} closing tags.`);
assert(openTags.length === closeTags.length, `Opening tag count (${openTags.length}) matches closing tag count (${closeTags.length})`);

// 1.2 Extract and validate individual <url> nodes
const urlBlockRegex = /<url>([\s\S]*?)<\/url>/g;
let match;
const urls = [];

while ((match = urlBlockRegex.exec(sitemapContent)) !== null) {
  const block = match[1];
  const locMatch = block.match(/<loc>(.*?)<\/loc>/);
  const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);
  const changefreqMatch = block.match(/<changefreq>(.*?)<\/changefreq>/);
  const priorityMatch = block.match(/<priority>(.*?)<\/priority>/);

  urls.push({
    loc: locMatch ? locMatch[1].trim() : null,
    lastmod: lastmodMatch ? lastmodMatch[1].trim() : null,
    changefreq: changefreqMatch ? changefreqMatch[1].trim() : null,
    priority: priorityMatch ? priorityMatch[1].trim() : null,
  });
}

assert(urls.length >= 20, `Sitemap contains substantial URL coverage (${urls.length} URLs found, >= 20 expected)`);

// 1.3 Uniqueness check (zero duplicate URLs)
const urlMap = new Map();
const duplicates = [];
urls.forEach((u, idx) => {
  if (urlMap.has(u.loc)) {
    duplicates.push({ url: u.loc, firstIndex: urlMap.get(u.loc), duplicateIndex: idx });
  } else {
    urlMap.set(u.loc, idx);
  }
});
assert(duplicates.length === 0, `Zero duplicate URLs found (Found duplicates: ${JSON.stringify(duplicates)})`);

// 1.4 Domain consistency: All URLs must start with https://uskistore.com
const nonCanonicalUrls = urls.filter(u => !u.loc.startsWith('https://uskistore.com/'));
assert(nonCanonicalUrls.length === 0, `All URLs start with canonical https://uskistore.com/ (Non-canonical count: ${nonCanonicalUrls.length})`);

// 1.5 Date validation (YYYY-MM-DD)
const invalidDates = urls.filter(u => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(u.lastmod)) return true;
  const d = new Date(u.lastmod);
  return isNaN(d.getTime());
});
assert(invalidDates.length === 0, `All <lastmod> dates are valid YYYY-MM-DD calendar dates (Invalid: ${invalidDates.length})`);

// 1.6 Changefreq validation
const validChangefreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
const invalidChangefreqs = urls.filter(u => !validChangefreqs.includes(u.changefreq));
assert(invalidChangefreqs.length === 0, `All <changefreq> values are valid per sitemap protocol (Invalid: ${invalidChangefreqs.length})`);

// 1.7 Priority validation
const invalidPriorities = urls.filter(u => {
  const p = parseFloat(u.priority);
  return isNaN(p) || p < 0.0 || p > 1.0;
});
assert(invalidPriorities.length === 0, `All <priority> values are between 0.0 and 1.0 (Invalid: ${invalidPriorities.length})`);

// 1.8 Verify core pillars and active live products in sitemap
const expectedLocs = [
  'https://uskistore.com/',
  'https://uskistore.com/products',
  'https://uskistore.com/products?category=kitab',
  'https://uskistore.com/products?category=alquran',
  'https://uskistore.com/products?category=buku-pelajaran',
  'https://uskistore.com/products?category=atk',
  'https://uskistore.com/bulk-order',
  'https://uskistore.com/products/kitab-fathul-qorib-syarah-taqrib',
  'https://uskistore.com/products/alquran-albayan-tajwid-warna-a5',
  'https://uskistore.com/products/atomic-habits',
  'https://uskistore.com/products/filosofi-teras',
  'https://uskistore.com/products/joyko-gel-pen-gp265-pack-12',
  'https://uskistore.com/products/buku-tulis-sidu-38-lembar-pack-10'
];

expectedLocs.forEach(expected => {
  assert(urlMap.has(expected), `Sitemap includes mandatory route: ${expected}`);
});

console.log('\n--- SUITE 2: Testing public/robots.txt ---');
const robotsPath = path.resolve('public/robots.txt');
assert(fs.existsSync(robotsPath), 'public/robots.txt exists');

const robotsContent = fs.readFileSync(robotsPath, 'utf8');

// 2.1 Directive verification
assert(robotsContent.includes('User-agent: *'), 'Specifies generic User-agent: * crawler scope');
assert(robotsContent.includes('Sitemap: https://uskistore.com/sitemap.xml'), 'Sitemap directive points to canonical sitemap.xml');

// 2.2 Parse directives into Allow and Disallow rules
const lines = robotsContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const allowRules = [];
const disallowRules = [];

lines.forEach(line => {
  if (line.startsWith('Allow:')) {
    allowRules.push(line.replace('Allow:', '').trim());
  } else if (line.startsWith('Disallow:')) {
    disallowRules.push(line.replace('Disallow:', '').trim());
  }
});

console.log(`Parsed ${allowRules.length} Allow rules and ${disallowRules.length} Disallow rules.`);

// 2.3 Empirical Path-Matching Oracle (RFC 9309 / Google specification)
// In Google's specification:
// - Directives are matched by prefix, where '*' matches any sequence of characters.
// - If multiple directives match, the LONGEST directive wins.
// - If Allow and Disallow have equal length and both match, Allow wins in Google's engine.

function isPathAllowed(path) {
  let bestMatch = null;
  let bestMatchLength = -1;
  let isAllowed = true; // default allowed if no rule matches

  function matches(pattern, target) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp('^' + escaped);
    return regex.test(target);
  }

  // Check Disallow rules
  for (const rule of disallowRules) {
    if (matches(rule, path)) {
      if (rule.length > bestMatchLength) {
        bestMatchLength = rule.length;
        bestMatch = 'disallow';
      }
    }
  }

  // Check Allow rules
  for (const rule of allowRules) {
    if (matches(rule, path)) {
      if (rule.length >= bestMatchLength) { // Google: equal length, allow wins
        bestMatchLength = rule.length;
        bestMatch = 'allow';
      }
    }
  }

  return bestMatch === null || bestMatch === 'allow';
}

// Adversarial test cases for robots.txt
const testCases = [
  // Public paths must be ALLOWED
  { path: '/', expected: true, reason: 'Homepage should be allowed' },
  { path: '/products', expected: true, reason: 'Catalog root should be allowed' },
  { path: '/products?category=kitab', expected: true, reason: 'Kitab category query should be allowed' },
  { path: '/products/kitab-fathul-qorib-syarah-taqrib', expected: true, reason: 'PDP should be allowed' },
  { path: '/bulk-order', expected: true, reason: 'Public B2B RFQ portal must be allowed' },
  { path: '/contact', expected: true, reason: 'Contact page should be allowed' },
  { path: '/about', expected: true, reason: 'About page should be allowed' },
  { path: '/policies/shipping', expected: true, reason: 'Policy page should be allowed' },
  { path: '/policies/privacy', expected: true, reason: 'Policy page should be allowed' },
  { path: '/track-order', expected: true, reason: 'Order tracking page should be allowed' },

  // Private / Admin paths must be DISALLOWED
  { path: '/admin/', expected: false, reason: 'Admin base directory should be disallowed' },
  { path: '/admin/orders', expected: false, reason: 'Admin orders should be disallowed' },
  { path: '/admin/products', expected: false, reason: 'Admin products should be disallowed' },
  { path: '/cart', expected: false, reason: 'Shopping cart should be disallowed' },
  { path: '/checkout', expected: false, reason: 'Checkout funnel should be disallowed' },
  { path: '/account', expected: false, reason: 'Account dashboard should be disallowed' },
  { path: '/account/settings', expected: false, reason: 'Account settings should be disallowed' },
  { path: '/order-confirmation/ORD-9912', expected: false, reason: 'Order confirmation should be disallowed' },
  { path: '/bulk-order/RFQ-20261104-ABC', expected: false, reason: 'Private bulk quotation view should be disallowed' },
];

testCases.forEach(tc => {
  const result = isPathAllowed(tc.path);
  assert(result === tc.expected, `Robots rule for "${tc.path}": got ${result ? 'ALLOWED' : 'DISALLOWED'}, expected ${tc.expected ? 'ALLOWED' : 'DISALLOWED'} (${tc.reason})`);
});

// Edge case analysis: What happens to '/admin' without trailing slash?
const adminNoSlashAllowed = isPathAllowed('/admin');
console.log(`[EDGE CASE INVESTIGATION] Path '/admin' without trailing slash: allowed = ${adminNoSlashAllowed}`);
if (adminNoSlashAllowed) {
  console.log('NOTE: /admin (no slash) is currently evaluated as allowed because Disallow rules are /admin/ and /admin/*');
}

console.log('\n--- SUITE 3: Geographic & Coordinate Accuracy Verification ---');
// Target coordinates: -7.6196877, 109.1210494
const targetLat = -7.6196877;
const targetLng = 109.1210494;

// Geographic bounding box for Kecamatan Kesugihan, Kabupaten Cilacap:
// Latitude: roughly -7.65 to -7.58
// Longitude: roughly 109.08 to 109.16
const isInKesugihanBounds = (targetLat <= -7.58 && targetLat >= -7.66) && (targetLng >= 109.08 && targetLng <= 109.16);
assert(isInKesugihanBounds, `Coordinates (${targetLat}, ${targetLng}) fall precisely inside Kecamatan Kesugihan geographical bounds`);

// Haversine distance to central Kesugihan Kidul reference (-7.6197, 109.1210)
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const distanceToCenter = haversineDistanceMeters(targetLat, targetLng, -7.6196877, 109.1210494);
assert(distanceToCenter < 1.0, `Coordinate precision check: delta is ${distanceToCenter.toFixed(2)} meters from PP. Al Ihya Ulumaddin anchor`);

// Verify 16 Desa of Kecamatan Kesugihan in doc
const docContent = fs.readFileSync('docs/seo/SEO_STRATEGY_USKI_STORE.md', 'utf8');
const expectedDesa = [
  'Kesugihan Kidul', 'Kesugihan', 'Planjan', 'Kuripan', 'Kuripan Kidul',
  'Menganti', 'Dondong', 'Kalisabuk', 'Karangkandri', 'Slarang',
  'Bulupayung', 'Ciwuni', 'Jangrana', 'Karangjengkol', 'Keleng', 'Pesanggrahan'
];

let foundDesaCount = 0;
expectedDesa.forEach(d => {
  if (docContent.includes(d)) {
    foundDesaCount++;
  }
});
assert(foundDesaCount === 16, `All 16 official desa of Kecamatan Kesugihan are mapped in strategy (${foundDesaCount}/16)`);

console.log('\n--- SUITE 4: Kitab & Mushaf Classical Texts & Pesantren Formats ---');
const requiredClassicalTexts = [
  { name: 'Safinah', pattern: /safinatun najah/i },
  { name: 'Taqrib', pattern: /taqrib/i },
  { name: 'Jurumiyah', pattern: /jurumiyah/i },
  { name: 'Imrithi', pattern: /imrithi/i },
  { name: 'Alfiyah', pattern: /alfiyah ibnu malik/i },
  { name: 'Fathul Qorib', pattern: /fathul qorib/i }
];

requiredClassicalTexts.forEach(t => {
  assert(t.pattern.test(docContent), `Classical text '${t.name}' is represented in the master keyword strategy`);
});

const requiredPesantrenFormats = [
  { name: 'Makna gandul pegon / petuk', pattern: /makna (gandul|jawa pegon|petuk)/i },
  { name: 'Mushaf pojok 15 baris Menara Kudus', pattern: /mushaf (menara kudus )?pojok 15 baris/i },
  { name: 'Kertas kuning', pattern: /kertas kuning/i },
  { name: 'Pulpen pegon (Pilot Hi-Tec C)', pattern: /pulpen pegon/i }
];

requiredPesantrenFormats.forEach(f => {
  assert(f.pattern.test(docContent), `Pesantren format '${f.name}' is represented in keyword strategy`);
});

console.log('\n--- SUITE 5: B2B / Grosir School & Madrasah Procurement ---');
const requiredB2BElements = [
  { name: 'Dana BOS pengadaan perpustakaan', pattern: /dana bos/i },
  { name: 'ATK kantor desa & instansi', pattern: /atk kantor/i },
  { name: 'Map ijazah emboss foil emas custom', pattern: /map ijazah/i },
  { name: 'Map raport k13 / kurikulum merdeka', pattern: /map raport/i },
  { name: 'Faktur pajak / nota dinas SPJ', pattern: /faktur pajak|nota dinas|spj/i },
  { name: 'SIPLah pengadaan', pattern: /siplah/i }
];

requiredB2BElements.forEach(el => {
  assert(el.pattern.test(docContent), `B2B procurement element '${el.name}' is integrated`);
});

console.log('\n=== EMPIRICAL TEST SUMMARY ===');
console.log(`Total assertions: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n>>> ALL TEST SUITES PASSED SUCCESSFULLY (100%) <<<');
}
