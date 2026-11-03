/**
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE M1 (SEO STRATEGY)
 * Target: docs/seo/SEO_STRATEGY_USKI_STORE.md, public/robots.txt, public/sitemap.xml
 * Author: challenger_seo_1 (teamwork_challenger)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];
const anomalies = [];

function assert(condition, message, details = null) {
  totalTests++;
  if (!condition) {
    failedTests++;
    const err = { message, details };
    findings.push(err);
    console.error(`  \x1b[31m✗ FAILED:\x1b[0m ${message}`);
    if (details) console.error(`    Details:`, details);
  } else {
    passedTests++;
    console.log(`  \x1b[32m✓ PASSED:\x1b[0m ${message}`);
  }
}

function recordAnomaly(title, detail) {
  anomalies.push({ title, detail });
  console.warn(`  \x1b[33m⚠ ADVERSARIAL OBSERVATION:\x1b[0m [${title}] ${detail}`);
}

console.log('\n===============================================================');
console.log('🚀 RUNNING EMPIRICAL SEO CHALLENGER VERIFICATION');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// 1. FILE EXISTENCE & PERMISSIONS VERIFICATION
// -----------------------------------------------------------------------------
console.log('--- 1. File Existence & Integrity Verification ---');
const strategyPath = path.join(rootDir, 'docs', 'seo', 'SEO_STRATEGY_USKI_STORE.md');
const robotsPath = path.join(rootDir, 'public', 'robots.txt');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');

assert(fs.existsSync(strategyPath), 'docs/seo/SEO_STRATEGY_USKI_STORE.md exists');
assert(fs.existsSync(robotsPath), 'public/robots.txt exists');
assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists');

const strategyContent = fs.readFileSync(strategyPath, 'utf8');
const robotsContent = fs.readFileSync(robotsPath, 'utf8');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

assert(strategyContent.length > 10000, `SEO strategy document is comprehensive (${strategyContent.length} bytes)`);
assert(robotsContent.length > 200, `robots.txt is populated (${robotsContent.length} bytes)`);
assert(sitemapContent.length > 1000, `sitemap.xml is populated (${sitemapContent.length} bytes)`);

// -----------------------------------------------------------------------------
// 2. PARSE AND VERIFY SEO STRATEGY DOCUMENT
// -----------------------------------------------------------------------------
console.log('\n--- 2. Markdown SEO Strategy Document Parsing ---');

// Parse markdown tables under Section 4
// 4.1 Pilar 1, 4.2 Pilar 2, 4.3 Pilar 3, 4.4 Pilar 4, 4.5 Pilar 5
const pillarRegex = /### 4\.(\d)\s+PILAR \d:[^\n]+([\s\S]*?)(?=(?:### 4\.\d|## 5|$))/gi;

const pillars = {};
let match;
while ((match = pillarRegex.exec(strategyContent)) !== null) {
  const pillarNum = parseInt(match[1], 10);
  const tableContent = match[2];
  
  const lines = tableContent.split('\n');
  const rows = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('|:---') || trimmed.includes('| No |')) {
      continue;
    }
    const cols = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (cols.length >= 6) {
      rows.push({
        no: parseInt(cols[0], 10),
        keyword: cols[1].replace(/`/g, '').trim(),
        intent: cols[2].trim(),
        type: cols[3].trim(),
        metrics: cols[4].trim(),
        rawTargetUrl: cols[5].replace(/`/g, '').trim(),
        cleanTargetUrl: cols[5].replace(/`/g, '').replace(/\s*\(.*?\)/, '').trim(),
      });
    }
  }
  pillars[pillarNum] = rows;
}

const pillarNames = {
  1: 'Local SEO & Ekosistem Pesantren (Kesugihan, Cilacap, Banyumas)',
  2: 'Kitab Klasik Pesantren & Mushaf Al-Quran',
  3: 'Buku Pelajaran Kurikulum Sekolah & Madrasah',
  4: 'Alat Tulis Kantor & Sekolah (ATK) serta Perlengkapan Santri',
  5: 'Pesanan Custom & Grosir B2B (Pengadaan Instansi)',
};

let grandTotalKeywords = 0;
const allKeywords = [];
const keywordSet = new Set();
const duplicateKeywords = [];

for (let p = 1; p <= 5; p++) {
  const pRows = pillars[p] || [];
  const count = pRows.length;
  grandTotalKeywords += count;
  console.log(`Pilar ${p} (${pillarNames[p]}): ${count} keywords parsed`);
  
  assert(count >= 15, `Pilar ${p} has >= 15 keywords (Observed: ${count})`, { pillar: p, count });
  
  for (const r of pRows) {
    if (keywordSet.has(r.keyword.toLowerCase())) {
      duplicateKeywords.push({ keyword: r.keyword, pillar: p });
    }
    keywordSet.add(r.keyword.toLowerCase());
    allKeywords.push({ ...r, pillar: p });
  }
}

assert(grandTotalKeywords >= 100, `Grand total keywords >= 100 across 5 pillars (Observed: ${grandTotalKeywords})`);
assert(duplicateKeywords.length === 0, `No duplicate keywords found across 5 pillars (Found: ${duplicateKeywords.length})`, duplicateKeywords);

// -----------------------------------------------------------------------------
// 3. SEARCH INTENT VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 3. Search Intent Taxonomy Verification ---');

// Accepted intent components: Transactional, Informational, Commercial, Navigational, Lokal (or recognized abbreviations)
const validIntentKeywords = ['trans', 'info', 'comm', 'nav', 'lokal', 'local', 'b2b', 'auth', 'desa', 'transit', 'disc'];
const invalidIntents = [];

for (const kw of allKeywords) {
  const intentLower = kw.intent.toLowerCase();
  const hasRecognizedComponent = validIntentKeywords.some(v => intentLower.includes(v));
  if (!hasRecognizedComponent) {
    invalidIntents.push({ keyword: kw.keyword, intent: kw.intent, pillar: kw.pillar });
  }
}

assert(invalidIntents.length === 0, `All ${grandTotalKeywords} keywords have valid search intent classifications`, invalidIntents);

const intentBreakdown = {
  Transactional: 0,
  Commercial: 0,
  Informational: 0,
  Navigational: 0,
  Local: 0,
};

for (const kw of allKeywords) {
  const l = kw.intent.toLowerCase();
  if (l.includes('trans')) intentBreakdown.Transactional++;
  if (l.includes('comm')) intentBreakdown.Commercial++;
  if (l.includes('info')) intentBreakdown.Informational++;
  if (l.includes('nav')) intentBreakdown.Navigational++;
  if (l.includes('local') || l.includes('lokal')) intentBreakdown.Local++;
}

console.log('Search Intent Breakdown Across Repository:', intentBreakdown);
assert(intentBreakdown.Transactional > 0, `Transactional intent keywords present (${intentBreakdown.Transactional})`);
assert(intentBreakdown.Commercial > 0, `Commercial intent keywords present (${intentBreakdown.Commercial})`);
assert(intentBreakdown.Informational > 0, `Informational intent keywords present (${intentBreakdown.Informational})`);
assert(intentBreakdown.Navigational > 0, `Navigational intent keywords present (${intentBreakdown.Navigational})`);
assert(intentBreakdown.Local > 0, `Local intent keywords present (${intentBreakdown.Local})`);

// -----------------------------------------------------------------------------
// 4. HEAD VS LONG-TAIL DESIGNATION VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 4. Head vs Long-Tail Designation Verification ---');

const typeCounts = {
  Head: 0,
  'Middle-Tail': 0,
  'Long-Tail': 0,
  Other: 0,
};

const invalidTypes = [];
for (const kw of allKeywords) {
  const t = kw.type;
  if (t === 'Head') typeCounts.Head++;
  else if (t === 'Middle-Tail') typeCounts['Middle-Tail']++;
  else if (t === 'Long-Tail') typeCounts['Long-Tail']++;
  else {
    typeCounts.Other++;
    invalidTypes.push({ keyword: kw.keyword, type: t });
  }
}

console.log('Keyword Tail Types Distribution:', typeCounts);
assert(invalidTypes.length === 0, 'All keywords designated as Head, Middle-Tail, or Long-Tail', invalidTypes);
assert(typeCounts.Head > 0, `Head keywords designated (${typeCounts.Head})`);
assert(typeCounts['Long-Tail'] > 0, `Long-Tail keywords designated (${typeCounts['Long-Tail']})`);
assert(typeCounts['Long-Tail'] > typeCounts.Head * 5, 'Long-Tail keywords significantly outnumber Head keywords (healthy long-tail curve)');

// -----------------------------------------------------------------------------
// 5. TARGET URL MAPPING & ROUTE INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- 5. Target URL Mapping & Route Integrity ---');

const validBaseRoutes = [
  '/',
  '/products',
  '/bulk-order',
  '/track-order',
  '/contact',
  '/about',
  '/policies',
  '/lokasi-toko-kesugihan-cilacap', // Identified future permalink
];

const knownProductSlugs = [
  'atomic-habits',
  'filosofi-teras',
  'alquran-albayan-tajwid-warna-a5',
  'joyko-gel-pen-gp265-pack-12',
  'buku-tulis-sidu-38-lembar-pack-10',
  'kitab-fathul-qorib-syarah-taqrib',
];

const knownCategorySlugs = [
  'buku-novel',
  'alquran',
  'buku-pelajaran',
  'buku-anak',
  'atk',
  'buku-tulis-kertas',
  'kitab',
  'perlengkapan-kantor',
  'perlengkapan-islami',
  'kerajinan-seni',
];

const targetUrlAudit = [];
const annotatedUrls = [];

for (const kw of allKeywords) {
  assert(kw.rawTargetUrl.startsWith('/'), `Target URL begins with '/': ${kw.rawTargetUrl} (Keyword: ${kw.keyword})`);
  
  if (kw.rawTargetUrl.includes('(')) {
    annotatedUrls.push({ keyword: kw.keyword, raw: kw.rawTargetUrl, clean: kw.cleanTargetUrl });
  }
  
  const parsedPath = kw.cleanTargetUrl.split('?')[0];
  const queryStr = kw.cleanTargetUrl.includes('?') ? kw.cleanTargetUrl.split('?')[1] : null;
  
  if (parsedPath.startsWith('/products/')) {
    const slug = parsedPath.replace('/products/', '');
    assert(knownProductSlugs.includes(slug), `Product PDP slug exists in seed catalog: ${slug} (Keyword: ${kw.keyword})`);
  } else if (!validBaseRoutes.includes(parsedPath)) {
    targetUrlAudit.push({ keyword: kw.keyword, targetUrl: kw.cleanTargetUrl, parsedPath });
  }
  
  if (queryStr) {
    const params = new URLSearchParams(queryStr);
    if (params.has('category')) {
      const cat = params.get('category');
      assert(knownCategorySlugs.includes(cat), `Category filter query '${cat}' exists in category taxonomy`);
    }
  }
}

if (annotatedUrls.length > 0) {
  recordAnomaly(
    'Markdown Parenthetical Annotation in Target URL',
    `${annotatedUrls.length} keywords contain human annotation in Target URL cell (e.g. '/ (Homepage)'). Parsed clean route is '/' which matches HomePage.`
  );
}

assert(targetUrlAudit.length === 0, 'No completely unmapped or illegal target URL paths', targetUrlAudit);

// -----------------------------------------------------------------------------
// 6. SITEMAP.XML STRICT VALIDATION
// -----------------------------------------------------------------------------
console.log('\n--- 6. Sitemap.xml Strict Validation ---');

assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml has valid XML declaration');
assert(sitemapContent.includes('<urlset'), 'sitemap.xml contains <urlset> root element');
assert(sitemapContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'sitemap.xml has valid Sitemaps.org namespace');
assert(sitemapContent.endsWith('</urlset>\n') || sitemapContent.endsWith('</urlset>'), 'sitemap.xml ends cleanly with </urlset>');

const urlBlockRegex = /<url>([\s\S]*?)<\/url>/g;
let urlMatch;
const sitemapUrls = [];
let urlIndex = 0;

while ((urlMatch = urlBlockRegex.exec(sitemapContent)) !== null) {
  urlIndex++;
  const block = urlMatch[1];
  
  const locMatch = /<loc>(.*?)<\/loc>/.exec(block);
  const lastmodMatch = /<lastmod>(.*?)<\/lastmod>/.exec(block);
  const changefreqMatch = /<changefreq>(.*?)<\/changefreq>/.exec(block);
  const priorityMatch = /<priority>(.*?)<\/priority>/.exec(block);
  
  assert(locMatch !== null, `URL entry #${urlIndex} contains <loc> tag`);
  const loc = locMatch ? locMatch[1].trim() : '';
  
  assert(loc.startsWith('https://uskistore.com'), `URL #${urlIndex} uses canonical https://uskistore.com domain: ${loc}`);
  
  if (lastmodMatch) {
    const lastmod = lastmodMatch[1].trim();
    assert(/^\d{4}-\d{2}-\d{2}$/.test(lastmod), `URL #${urlIndex} has valid YYYY-MM-DD lastmod format (${lastmod})`);
  }
  
  if (changefreqMatch) {
    const cf = changefreqMatch[1].trim();
    const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    assert(validFrequencies.includes(cf), `URL #${urlIndex} has valid changefreq value (${cf})`);
  }
  
  if (priorityMatch) {
    const pVal = parseFloat(priorityMatch[1].trim());
    assert(!isNaN(pVal) && pVal >= 0.0 && pVal <= 1.0, `URL #${urlIndex} has valid priority float 0.0 - 1.0 (${pVal})`);
  }
  
  sitemapUrls.push(loc);
}

console.log(`Total URLs indexed in sitemap.xml: ${sitemapUrls.length}`);
assert(sitemapUrls.length >= 20, `Sitemap has comprehensive URL coverage (Observed: ${sitemapUrls.length})`);

// Verify all seed products are present in sitemap
for (const slug of knownProductSlugs) {
  const expectedPdp = `https://uskistore.com/products/${slug}`;
  assert(sitemapUrls.includes(expectedPdp), `Sitemap includes seed product PDP: ${slug}`);
}

// Verify all 10 categories are present in sitemap
for (const cat of knownCategorySlugs) {
  const expectedCatUrl = `https://uskistore.com/products?category=${cat}`;
  assert(sitemapUrls.includes(expectedCatUrl), `Sitemap includes category URL: ${cat}`);
}

// Adversarial test: Verify no disallowed/private paths exist in sitemap.xml
const disallowedPatterns = ['/admin', '/cart', '/checkout', '/account', '/order-confirmation', '/bulk-order/'];
for (const u of sitemapUrls) {
  for (const dis of disallowedPatterns) {
    const urlPath = u.replace('https://uskistore.com', '');
    if (dis === '/bulk-order/') {
      assert(!urlPath.startsWith('/bulk-order/'), `Sitemap does not leak private quotation lookup route: ${u}`);
    } else {
      assert(!urlPath.startsWith(dis), `Sitemap does not include disallowed route ${dis}: ${u}`);
    }
  }
}

// -----------------------------------------------------------------------------
// 7. ROBOTS.TXT DIRECTIVE & ADVERSARIAL PARITY VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 7. Robots.txt Syntax & Parity Verification ---');

assert(robotsContent.includes('User-agent: *'), 'robots.txt specifies User-agent: *');
assert(robotsContent.includes('Sitemap: https://uskistore.com/sitemap.xml'), 'robots.txt includes valid Sitemap directive');

const allowRules = [];
const disallowRules = [];

for (const rawLine of robotsContent.split('\n')) {
  const line = rawLine.trim();
  if (line.startsWith('Allow:')) {
    allowRules.push(line.replace('Allow:', '').trim());
  } else if (line.startsWith('Disallow:')) {
    disallowRules.push(line.replace('Disallow:', '').trim());
  }
}

console.log('Robots.txt Allow Rules Count:', allowRules.length);
console.log('Robots.txt Disallow Rules Count:', disallowRules.length);

assert(disallowRules.includes('/admin/'), 'robots.txt disallows /admin/');
assert(disallowRules.includes('/cart'), 'robots.txt disallows /cart');
assert(disallowRules.includes('/checkout'), 'robots.txt disallows /checkout');
assert(disallowRules.includes('/account'), 'robots.txt disallows /account');
assert(disallowRules.includes('/bulk-order/*'), 'robots.txt disallows /bulk-order/*');

assert(allowRules.includes('/'), 'robots.txt allows /');
assert(allowRules.includes('/products'), 'robots.txt allows /products');
assert(allowRules.includes('/bulk-order'), 'robots.txt allows /bulk-order');
assert(allowRules.includes('/contact'), 'robots.txt allows /contact');

function isRobotsAllowed(pathStr) {
  if (pathStr === '/bulk-order') return true;
  if (pathStr.startsWith('/bulk-order/')) return false;
  if (pathStr.startsWith('/admin')) return false;
  if (pathStr.startsWith('/cart') || pathStr.startsWith('/checkout') || pathStr.startsWith('/account')) return false;
  return true;
}

assert(isRobotsAllowed('/bulk-order') === true, 'Public B2B form /bulk-order is indexable and ALLOWED');
assert(isRobotsAllowed('/bulk-order/RFQ-2026-001') === false, 'Customer private quotation /bulk-order/RFQ-2026-001 is DISALLOWED');
assert(isRobotsAllowed('/admin/products') === false, 'Admin backoffice /admin/products is DISALLOWED');
assert(isRobotsAllowed('/cart') === false, 'Cart /cart is DISALLOWED');
assert(isRobotsAllowed('/checkout') === false, 'Checkout /checkout is DISALLOWED');
assert(isRobotsAllowed('/products/atomic-habits') === true, 'Product PDP /products/atomic-habits is ALLOWED');

// ADVERSARIAL PARITY CHECK: Are ANY URLs in sitemap blocked by robots.txt?
for (const sitemapUrl of sitemapUrls) {
  const route = sitemapUrl.replace('https://uskistore.com', '');
  const allowed = isRobotsAllowed(route);
  assert(allowed === true, `Sitemap URL is permitted by robots.txt: ${route}`);
}

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`EMPIRICAL CHALLENGE VERIFICATION SUMMARY`);
console.log(`Total Assertions Run: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Observations / Anomalies: ${anomalies.length}`);
if (anomalies.length > 0) {
  console.log('Anomalies Breakdown:');
  anomalies.forEach((a, i) => console.log(`  ${i + 1}. [${a.title}] ${a.detail}`));
}
console.log('===============================================================\n');

if (failedTests > 0) {
  console.error('\x1b[31mVERDICT: REJECT - Empirical failures detected!\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32mVERDICT: APPROVE - All empirical tests passed 100%!\x1b[0m');
  process.exit(0);
}
