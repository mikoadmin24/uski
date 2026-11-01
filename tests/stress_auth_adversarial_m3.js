/**
 * Milestone 3 Adversarial Authentication Stress Test Harness
 * Author: challenger_m3_1 (Teamwork Empirical Challenger)
 *
 * Objectives:
 * 1. Bogus Password Attack:
 *    - Arbitrary passwords, blank passwords, SQL injection strings, random tokens,
 *      buffer strings, and XSS strings against real accounts (admin@uskistore.id, cs@uskistore.id)
 *      and non-existent accounts.
 *    - Verify 100% of invalid attempts are rejected with an error banner string and never create a session.
 * 2. Valid Credential Verification:
 *    - Login for admin@uskistore.id with password123 returns real UUID and logs in.
 * 3. Session Persistence & Logout:
 *    - Verify localStorage.getItem('uski_auth_user_v1') persistence of genuine session.
 *    - Verify clean wipe to 'logged_out' on logout() and state reset (user=null, isAuthenticated=false).
 *    - Verify reload hydration behavior after logout and with corrupted storage payloads.
 */

import { createServer } from 'vite';
import { supabase } from './e2e/harness.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureList = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`  \x1b[31m✗ FAILED:\x1b[0m ${message}`);
    failureList.push(message);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`  \x1b[32m✓ PASSED:\x1b[0m ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual !== expected) {
    failedTests++;
    const errMsg = `${message} (Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)})`;
    console.error(`  \x1b[31m✗ FAILED:\x1b[0m ${errMsg}`);
    failureList.push(errMsg);
    throw new Error(errMsg);
  } else {
    passedTests++;
    console.log(`  \x1b[32m✓ PASSED:\x1b[0m ${message}`);
  }
}

// In-Memory LocalStorage Mock simulating browser Web Storage API
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

async function runSection(name, fn) {
  console.log(`\n================================================================`);
  console.log(`  ${name}`);
  console.log(`================================================================`);
  await fn();
}

async function safeLoginWithRetry(authStore, email, password, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await authStore.getState().login(email, password);
    if (!res.success && res.error && res.error.includes('rate limit')) {
      console.log(`    [Rate Limit backoff] Waiting 3s before retry ${attempt}/${maxRetries}...`);
      await sleep(3000);
      continue;
    }
    return res;
  }
  return await authStore.getState().login(email, password);
}

async function main() {
  console.log('\n\x1b[1m\x1b[35m================================================================');
  console.log('    CHALLENGER M3-1: ADVERSARIAL AUTH STRESS HARNESS');
  console.log('================================================================\x1b[0m\n');

  // Install Mock LocalStorage on globalThis before loading Vite SSR modules
  const mockStorage = new MemoryLocalStorage();
  globalThis.localStorage = mockStorage;

  const server = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
  });

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: VALID CREDENTIAL VERIFICATION (Tested First with Fresh Session)
    // -------------------------------------------------------------------------
    await runSection('SECTION 1: Valid Credential Verification & Real UUID', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_auth_user_v1', 'logged_out');
      const { useAuthStore } = await server.ssrLoadModule('./src/store/authStore.ts');

      console.log('Attempting genuine login for admin@uskistore.id with password123...');
      const loginRes = await safeLoginWithRetry(useAuthStore, 'admin@uskistore.id', 'password123');

      // 1. Success flag
      assertEqual(loginRes.success, true, 'Valid login returns success: true');
      assertEqual(loginRes.error, undefined, 'Valid login returns no error');

      // 2. Store authentication state
      assertEqual(useAuthStore.getState().isAuthenticated, true, 'Store isAuthenticated is true');

      // 3. User profile verification
      const currentUser = useAuthStore.getState().user;
      assert(currentUser !== null, 'Current user is not null');
      assertEqual(currentUser.email, 'admin@uskistore.id', 'User email is admin@uskistore.id');
      assertEqual(currentUser.role, 'super_admin', 'User role is super_admin');

      // 4. Verify Real UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert(
        uuidRegex.test(currentUser.id),
        `User ID "${currentUser.id}" is a valid UUID format`
      );
      assertEqual(
        currentUser.id,
        '9d160c9f-627a-48a8-96a7-d5b2bd9ea4ae',
        'User UUID matches live Supabase Auth account'
      );

      // 5. Verify localStorage persistence of valid session
      const savedSession = mockStorage.getItem('uski_auth_user_v1');
      assert(savedSession !== null && savedSession !== 'logged_out', 'localStorage contains session payload');
      const parsedSession = JSON.parse(savedSession);
      assertEqual(parsedSession.id, '9d160c9f-627a-48a8-96a7-d5b2bd9ea4ae', 'Persisted session contains correct UUID');
      assertEqual(parsedSession.email, 'admin@uskistore.id', 'Persisted session contains correct email');
      assertEqual(parsedSession.role, 'super_admin', 'Persisted session contains super_admin role');
    });

    // -------------------------------------------------------------------------
    // SECTION 2: SESSION PERSISTENCE, HYDRATION & CLEAN LOGOUT
    // -------------------------------------------------------------------------
    await runSection('SECTION 2: Session Persistence, Hydration & Clean Logout', async () => {
      // 2a. Hydration from existing valid session in localStorage
      server.moduleGraph.invalidateAll();
      const { useAuthStore: reloadedStore } = await server.ssrLoadModule('./src/store/authStore.ts');

      assertEqual(reloadedStore.getState().isAuthenticated, true, 'Rehydrated store restores isAuthenticated: true');
      assert(reloadedStore.getState().user !== null, 'Rehydrated store restores user profile');
      assertEqual(reloadedStore.getState().user.id, '9d160c9f-627a-48a8-96a7-d5b2bd9ea4ae', 'Rehydrated store restores real UUID');

      // 2b. Perform Clean Logout
      console.log('Invoking useAuthStore.logout()...');
      await reloadedStore.getState().logout();

      // 2c. Verify immediate state wipe
      assertEqual(reloadedStore.getState().isAuthenticated, false, 'After logout: isAuthenticated is false');
      assertEqual(reloadedStore.getState().user, null, 'After logout: user is null');
      assertEqual(
        mockStorage.getItem('uski_auth_user_v1'),
        'logged_out',
        'After logout: localStorage is explicitly set to "logged_out"'
      );

      // 2d. Rehydrate after logout to verify persistence of logged-out state
      server.moduleGraph.invalidateAll();
      const { useAuthStore: postLogoutStore } = await server.ssrLoadModule('./src/store/authStore.ts');
      assertEqual(postLogoutStore.getState().isAuthenticated, false, 'Store reloads as unauthenticated following logout');
      assertEqual(postLogoutStore.getState().user, null, 'Store reloads with null user following logout');

      // 2e. Corrupted localStorage handling (Defensive Robustness)
      const corruptedPayloads = [
        '{malformed json:',
        'null',
        'undefined',
        '12345',
        '{"id": null}',
      ];

      for (const payload of corruptedPayloads) {
        mockStorage.setItem('uski_auth_user_v1', payload);
        server.moduleGraph.invalidateAll();
        // Should not throw an uncaught syntax error
        let loadError = null;
        try {
          await server.ssrLoadModule('./src/store/authStore.ts');
        } catch (err) {
          loadError = err;
        }
        assert(loadError === null, `Corrupted storage payload "${payload}" handled without runtime exception`);
      }
    });

    // -------------------------------------------------------------------------
    // SECTION 3: DIRECT SUPABASE AUTH API ADVERSARIAL ATTACK
    // -------------------------------------------------------------------------
    await runSection('SECTION 3: Live Supabase Auth Bogus Credential Rejection', async () => {
      assert(supabase !== null, 'Supabase client is configured and connected');

      const adversarialPayloads = [
        // Arbitrary passwords
        { label: 'Arbitrary password "wrong_password_999"', password: 'wrong_password_999' },
        { label: 'Arbitrary password "admin"', password: 'admin' },
        { label: 'Arbitrary password "123456"', password: '123456' },
        { label: 'Arbitrary password "Password123" (case sensitivity check)', password: 'Password123' },
        { label: 'Arbitrary password "PASSWORD123" (all caps check)', password: 'PASSWORD123' },
        { label: 'Arbitrary password "password12"', password: 'password12' },
        { label: 'Arbitrary password "password1234"', password: 'password1234' },

        // Blank and whitespace passwords
        { label: 'Blank password ""', password: '' },
        { label: 'Whitespace password "   "', password: '   ' },
        { label: 'Tab and newline password "\\t\\n "', password: '\t\n ' },

        // SQL Injection attack strings
        { label: 'SQLi "\' OR \'1\'=\'1"', password: "' OR '1'='1" },
        { label: 'SQLi "admin\' --"', password: "admin' --" },
        { label: 'SQLi "\' OR 1=1 --"', password: "' OR 1=1 --" },
        { label: 'SQLi "\'; DROP TABLE auth.users; --"', password: "'; DROP TABLE auth.users; --" },

        // Random tokens and boundary strings
        { label: 'SHA256 hash token', password: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
        { label: 'JWT token format string', password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bogusSignature' },
        { label: 'XSS payload string "<script>alert(1)</script>"', password: '<script>alert(1)</script>' },
        { label: 'Buffer string of 500 "A" characters', password: 'A'.repeat(500) },
        { label: 'Unicode & emoji string "🔐🔥\\u0000\\uFFFF"', password: '🔐🔥\u0000\uFFFF' },
      ];

      // Test against real admin account
      for (const item of adversarialPayloads) {
        await sleep(150); // slight delay to respect rate limit
        const res = await supabase.auth.signInWithPassword({
          email: 'admin@uskistore.id',
          password: item.password,
        });

        assert(res.error !== null, `[admin@uskistore.id] ${item.label} was REJECTED by Supabase Auth`);
        assert(res.data.user === null, `[admin@uskistore.id] ${item.label} yielded NULL user`);
        assert(res.data.session === null, `[admin@uskistore.id] ${item.label} yielded NULL session`);
      }

      // Test against real CS account (cs@uskistore.id)
      for (const item of adversarialPayloads.slice(0, 3)) {
        await sleep(150);
        const res = await supabase.auth.signInWithPassword({
          email: 'cs@uskistore.id',
          password: item.password,
        });

        assert(res.error !== null, `[cs@uskistore.id] ${item.label} was REJECTED by Supabase Auth`);
        assert(res.data.user === null, `[cs@uskistore.id] ${item.label} yielded NULL user`);
      }

      // Test against non-existent accounts
      const nonExistentAccounts = [
        'hacker@evil.com',
        'nonexistent_user_9999@uskistore.id',
      ];

      for (const email of nonExistentAccounts) {
        await sleep(150);
        const res = await supabase.auth.signInWithPassword({
          email,
          password: 'arbitrary_password_123',
        });
        assert(res.error !== null, `[Non-existent: ${email}] Login REJECTED`);
        assert(res.data.user === null, `[Non-existent: ${email}] User is NULL`);
      }
    });

    // -------------------------------------------------------------------------
    // SECTION 4: USEAUTHSTORE ADVERSARIAL STRESS & ERROR BANNER CONTRACT
    // -------------------------------------------------------------------------
    await runSection('SECTION 4: useAuthStore.login() Adversarial Stress & Banner Contract', async () => {
      // Invalidate module graph to load fresh store instance
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_auth_user_v1', 'logged_out');
      const { useAuthStore } = await server.ssrLoadModule('./src/store/authStore.ts');

      // Verify clean initial state
      assertEqual(useAuthStore.getState().isAuthenticated, false, 'Store initializes as unauthenticated when storage is "logged_out"');
      assertEqual(useAuthStore.getState().user, null, 'Store user is null when storage is "logged_out"');

      // Test matrix of attack cases against useAuthStore.login()
      const attackMatrix = [
        // Case 1: Real admin with wrong password
        { email: 'admin@uskistore.id', password: 'bogus_password_123', desc: 'Real admin with bogus password' },
        // Case 2: Real admin with SQL injection
        { email: 'admin@uskistore.id', password: "' OR '1'='1", desc: 'Real admin with SQLi payload' },
        // Case 3: Real admin with blank password
        { email: 'admin@uskistore.id', password: '', desc: 'Real admin with empty password' },
        // Case 4: Real admin with whitespace password
        { email: 'admin@uskistore.id', password: '    ', desc: 'Real admin with whitespace password' },
        // Case 5: Real admin with random hash token
        { email: 'admin@uskistore.id', password: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', desc: 'Real admin with random hash' },
        // Case 6: Real admin with XSS payload
        { email: 'admin@uskistore.id', password: '<script>alert("hacked")</script>', desc: 'Real admin with XSS string' },
        // Case 7: Real CS account with bogus password
        { email: 'cs@uskistore.id', password: 'wrong_password_cs', desc: 'Real CS staff with bogus password' },
        // Case 8: Real CS account with SQL injection
        { email: 'cs@uskistore.id', password: "' UNION SELECT * FROM users--", desc: 'Real CS staff with SQLi string' },
        // Case 9: Non-existent account with arbitrary password
        { email: 'attacker@evil.com', password: 'password123', desc: 'Non-existent account with password123' },
        // Case 10: Non-existent account with SQL injection
        { email: "admin'--@test.com", password: 'password123', desc: 'SQLi email attempt' },
        // Case 11: Empty email and empty password
        { email: '', password: '', desc: 'Empty email and password' },
        // Case 12: Whitespace email
        { email: '   ', password: 'password123', desc: 'Whitespace email' },
      ];

      for (const item of attackMatrix) {
        await sleep(150);
        const res = await useAuthStore.getState().login(item.email, item.password);

        // 1. Must return success: false
        assertEqual(res.success, false, `[${item.desc}] Login returned success: false`);

        // 2. Must provide a non-empty error message suitable for UI banner display
        assert(
          typeof res.error === 'string' && res.error.length > 0,
          `[${item.desc}] Error message returned for UI banner: "${res.error}"`
        );

        // 3. Must NEVER set isAuthenticated to true
        assertEqual(
          useAuthStore.getState().isAuthenticated,
          false,
          `[${item.desc}] Store isAuthenticated remains FALSE`
        );

        // 4. Must NEVER create or populate a user session
        assertEqual(
          useAuthStore.getState().user,
          null,
          `[${item.desc}] Store user remains NULL`
        );

        // 5. Must NEVER overwrite 'logged_out' in localStorage with bogus session
        assertEqual(
          mockStorage.getItem('uski_auth_user_v1'),
          'logged_out',
          `[${item.desc}] localStorage remains "logged_out"`
        );
      }
    });

    // -------------------------------------------------------------------------
    // SECTION 5: TAMPER RESISTANCE & SUBSEQUENT BOGUS ATTEMPTS
    // -------------------------------------------------------------------------
    await runSection('SECTION 5: Tamper Resistance & Post-Logout Attack Resilience', async () => {
      server.moduleGraph.invalidateAll();
      mockStorage.setItem('uski_auth_user_v1', 'logged_out');
      const { useAuthStore } = await server.ssrLoadModule('./src/store/authStore.ts');

      // Attack: Attempt to login with valid email but slightly mutated password
      const mutatedPasswords = [
        'password123 ',
        ' password123',
        'password 123',
        'PASSWORD123',
        'password123\0',
        'password123\n',
      ];

      for (const pw of mutatedPasswords) {
        await sleep(150);
        const res = await useAuthStore.getState().login('admin@uskistore.id', pw);
        assertEqual(res.success, false, `Mutated password ${JSON.stringify(pw)} rejected`);
        assertEqual(useAuthStore.getState().isAuthenticated, false, 'Authentication remained false');
      }
    });

  } finally {
    await server.close();
  }

  // -------------------------------------------------------------------------
  // FINAL REPORT & TALLY
  // -------------------------------------------------------------------------
  console.log('\n\x1b[1m\x1b[35m================================================================');
  console.log('             CHALLENGER M3-1 ADVERSARIAL TEST RESULTS');
  console.log('================================================================\x1b[0m');
  console.log(`Total Assertions Checked : ${totalTests}`);
  console.log(`Assertions Passed        : \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Assertions Failed        : \x1b[${failedTests > 0 ? '31' : '32'}m${failedTests}\x1b[0m`);
  console.log(`Pass Rate                : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error(`\x1b[31mFAILURE DETAILS (${failedTests} failures):\x1b[0m`);
    failureList.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log('\x1b[32m✔ ALL ADVERSARIAL STRESS CHALLENGES PASSED CONVINCINGLY.\x1b[0m\n');
  }
}

main().catch((err) => {
  console.error('\n\x1b[31mFATAL TEST HARNESS ERROR:\x1b[0m', err);
  process.exit(1);
});
