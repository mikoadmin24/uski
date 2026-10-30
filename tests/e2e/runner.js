#!/usr/bin/env node
/**
 * USKI STORE - E2E Test Suite Unified Runner
 * Usage:
 *   node tests/e2e/runner.js
 *   node tests/e2e/runner.js --tier=1
 *   node tests/e2e/runner.js --tier=2
 *   node tests/e2e/runner.js --tier=3
 *   node tests/e2e/runner.js --tier=4
 *   node tests/e2e/runner.js --verbose
 *   node tests/e2e/runner.js --bail
 */

import { performance } from 'node:perf_hooks';
import {
  testSuites,
  runGlobalTeardowns,
  supabase,
  supabaseUrl,
  ensureAuthSession,
} from './harness.js';

// ANSI escape sequences
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// 1. Parse CLI Arguments
const args = process.argv.slice(2);
let selectedTier = null;
let verbose = false;
let bail = false;

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    selectedTier = parseInt(arg.split('=')[1], 10);
  } else if (arg === '-t' && args[args.indexOf(arg) + 1]) {
    selectedTier = parseInt(args[args.indexOf(arg) + 1], 10);
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  } else if (arg === '--bail' || arg === '-b') {
    bail = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
USKI STORE E2E Test Runner
Options:
  --tier=N    Run only tests for Tier N (1, 2, 3, or 4)
  --verbose   Show detailed assertion outputs
  --bail      Stop execution immediately on first failure
  --help      Show this help message
`);
    process.exit(0);
  }
}

// 2. Discover and Import Test Suites
async function loadTestSuites() {
  const tierFiles = {
    1: [
      './tier1_features/products.test.js',
      './tier1_features/orders.test.js',
      './tier1_features/couriers.test.js',
      './tier1_features/vouchers.test.js',
      './tier1_features/bulk_orders.test.js',
      './tier1_features/storage.test.js',
    ],
    2: ['./tier2_boundaries/boundary_corner_cases.test.js'],
    3: ['./tier3_combinations/cross_feature_combinations.test.js'],
    4: ['./tier4_realworld/real_world_scenarios.test.js'],
  };

  const tiersToRun = selectedTier ? [selectedTier] : [1, 2, 3, 4];

  for (const tier of tiersToRun) {
    const files = tierFiles[tier] || [];
    for (const file of files) {
      try {
        await import(file);
      } catch (err) {
        console.error(`${c.red}Failed to import test suite ${file}:${c.reset}`, err);
        process.exit(1);
      }
    }
  }
}

// 3. Main Runner Function
async function run() {
  const overallStart = performance.now();

  console.log(`\n${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}       USKI STORE — END-TO-END (E2E) TEST SUITE RUNNER         ${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.dim}Target Endpoint : ${supabaseUrl}${c.reset}`);
  console.log(`${c.dim}Execution Scope : ${selectedTier ? `Tier ${selectedTier}` : 'All Tiers (1 - 4)'}${c.reset}`);
  console.log(`${c.dim}Client Engine   : Supabase PostgREST & Storage${c.reset}`);
  console.log(`${c.dim}Fail-fast (Bail): ${bail ? 'Enabled' : 'Disabled'}${c.reset}`);
  console.log(`${c.cyan}----------------------------------------------------------------${c.reset}\n`);

  // Verify connection
  if (!supabase) {
    console.error(`${c.red}FATAL: Supabase client is not configured. Check .env file.${c.reset}\n`);
    process.exit(1);
  }

  // Ensure active admin authentication session for RLS write permissions
  const authSuccess = await ensureAuthSession();
  if (authSuccess) {
    console.log(`${c.green}✔ Admin auth session established (RLS write permitted)${c.reset}\n`);
  } else {
    console.log(`${c.yellow}⚠ Running in anonymous mode (some admin write operations may require RLS policies)${c.reset}\n`);
  }

  await loadTestSuites();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];
  const tierSummary = { 1: { pass: 0, fail: 0 }, 2: { pass: 0, fail: 0 }, 3: { pass: 0, fail: 0 }, 4: { pass: 0, fail: 0 } };

  for (const suite of testSuites) {
    console.log(`\n${c.bold}▶ Suite: ${suite.name}${c.reset} ${c.dim}(Tier ${suite.tier})${c.reset}`);

    // Run beforeAll hooks
    for (const hook of suite.beforeAllHooks) {
      try {
        await hook();
      } catch (hookErr) {
        console.error(`${c.red}  [Hook Error - beforeAll]: ${hookErr.message}${c.reset}`);
      }
    }

    // Run tests
    for (const test of suite.tests) {
      totalTests++;
      const testStart = performance.now();
      let passed = false;
      let error = null;

      try {
        await test.fn();
        passed = true;
        passedTests++;
        tierSummary[suite.tier].pass++;
      } catch (err) {
        failedTests++;
        tierSummary[suite.tier].fail++;
        error = err;
        failureDetails.push({
          suite: suite.name,
          tier: suite.tier,
          test: test.name,
          error: err,
        });
      }

      const durationMs = Math.round(performance.now() - testStart);

      if (passed) {
        console.log(`  ${c.green}✔ PASS${c.reset} ${c.bold}${test.name}${c.reset} ${c.dim}(${durationMs}ms)${c.reset}`);
      } else {
        console.log(`  ${c.red}✖ FAIL${c.reset} ${c.bold}${test.name}${c.reset} ${c.dim}(${durationMs}ms)${c.reset}`);
        console.log(`    ${c.red}Error: ${error.message}${c.reset}`);
        if (verbose && error.stack) {
          console.log(`    ${c.dim}${error.stack.split('\n').slice(1, 4).join('\n    ')}${c.reset}`);
        }
      }

      if (!passed && bail) {
        console.log(`\n${c.yellow}Bail mode active: Stopping test execution on first failure.${c.reset}`);
        break;
      }
    }

    // Run afterAll hooks
    for (const hook of suite.afterAllHooks) {
      try {
        await hook();
      } catch (hookErr) {
        console.error(`${c.red}  [Hook Error - afterAll]: ${hookErr.message}${c.reset}`);
      }
    }

    if (failedTests > 0 && bail) break;
  }

  // Global teardown
  console.log(`\n${c.dim}Executing fixture sanitization & teardown hooks...${c.reset}`);
  await runGlobalTeardowns();

  const totalDuration = ((performance.now() - overallStart) / 1000).toFixed(2);

  // 4. Print Summary Report
  console.log(`\n${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}                      TEST EXECUTION SUMMARY                    ${c.reset}`);
  console.log(`${c.cyan}================================================================${c.reset}`);
  console.log(`Tier 1 (Feature Coverage)        : ${tierSummary[1].pass} Passed, ${tierSummary[1].fail} Failed`);
  console.log(`Tier 2 (Boundary & Corner Cases) : ${tierSummary[2].pass} Passed, ${tierSummary[2].fail} Failed`);
  console.log(`Tier 3 (Cross-Feature Combinations): ${tierSummary[3].pass} Passed, ${tierSummary[3].fail} Failed`);
  console.log(`Tier 4 (Real-World Scenarios)    : ${tierSummary[4].pass} Passed, ${tierSummary[4].fail} Failed`);
  console.log(`${c.cyan}----------------------------------------------------------------${c.reset}`);
  console.log(`Total Executed : ${totalTests}`);
  console.log(`Passed         : ${c.green}${passedTests}${c.reset}`);
  console.log(`Failed         : ${failedTests > 0 ? c.red : c.green}${failedTests}${c.reset}`);
  console.log(`Total Duration : ${totalDuration}s`);
  console.log(`${c.cyan}================================================================${c.reset}`);

  if (failureDetails.length > 0) {
    console.log(`\n${c.bold}${c.red}FAILURES OVERVIEW (${failureDetails.length}):${c.reset}`);
    failureDetails.forEach((f, idx) => {
      console.log(`\n${idx + 1}) [Tier ${f.tier}] ${f.suite} > ${f.test}`);
      console.log(`   ${c.red}${f.error.message}${c.reset}`);
      if (f.error.stack) {
        console.log(`   ${c.dim}${f.error.stack.split('\n')[1] || ''}${c.reset}`);
      }
    });
    console.log('');
    process.exit(1);
  } else {
    console.log(`\n${c.bold}${c.green}🎉 ALL E2E TEST SUITES PASSED SUCCESSFULLY! (100% PASS RATE)${c.reset}\n`);
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(`${c.red}Unexpected runner error:${c.reset}`, err);
  process.exit(1);
});
