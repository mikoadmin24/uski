#!/usr/bin/env node
/**
 * USKI STORE — Supabase Master Migration Runner & Verifier
 * 
 * Usage:
 *   node scripts/apply_migration.mjs
 *   node scripts/apply_migration.mjs --verify-only
 *   DATABASE_URL="postgres://postgres:[PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres" node scripts/apply_migration.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kxbdoqviqzseymjofsjg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';
const MIGRATION_FILE = path.join(projectRoot, 'supabase', 'supabase_master_migration.sql');

console.log('================================================================');
console.log('       USKI STORE — SUPABASE MIGRATION RUNNER & VERIFIER       ');
console.log('================================================================');
console.log('Target Project URL :', SUPABASE_URL);
console.log('Migration SQL File :', MIGRATION_FILE);

if (!fs.existsSync(MIGRATION_FILE)) {
  console.error(`ERROR: Migration file not found at ${MIGRATION_FILE}`);
  process.exit(1);
}

const migrationSql = fs.readFileSync(MIGRATION_FILE, 'utf8');
console.log(`Migration script loaded: ${migrationSql.length} bytes`);

// 1. Direct PostgreSQL Execution (if connection string or pg password is provided)
async function tryDirectPostgresMigration() {
  const dbUrl = process.env.DATABASE_URL;
  const dbPassword = process.env.PGPASSWORD || process.env.SUPABASE_DB_PASSWORD;

  if (!dbUrl && !dbPassword) {
    return { attempted: false, reason: 'No DATABASE_URL or PGPASSWORD provided in environment.' };
  }

  try {
    const { default: pg } = await import('pg');
    const { Client } = pg;

    const client = dbUrl
      ? new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
      : new Client({
          host: 'aws-0-eu-west-2.pooler.supabase.com',
          port: 6543,
          user: 'postgres.kxbdoqviqzseymjofsjg',
          password: dbPassword,
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
        });

    console.log('\nConnecting to PostgreSQL directly to apply migration...');
    await client.connect();
    console.log('Connected to PostgreSQL successfully. Executing migration SQL...');

    await client.query(migrationSql);
    console.log('✔ Master migration applied successfully via PostgreSQL!');
    await client.end();
    return { attempted: true, success: true };
  } catch (err) {
    console.warn(`PostgreSQL migration error: ${err.message}`);
    return { attempted: true, success: false, error: err.message };
  }
}

// 2. Supabase Client Verification Probe
async function verifyLiveSupabaseSchema() {
  console.log('\n----------------------------------------------------------------');
  console.log('               VERIFYING LIVE SUPABASE SCHEMA                   ');
  console.log('----------------------------------------------------------------');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Authenticate as admin
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'admin@uskistore.id',
    password: 'password123',
  });

  if (authData?.session) {
    console.log('✔ Admin auth session established for verification.');
  }

  const tablesToVerify = [
    'products',
    'categories',
    'orders',
    'order_items',
    'couriers',
    'vouchers',
    'bulk_orders',
    'payment_confirmations',
    'delivery_proofs',
    'inventory_movements',
    'banners',
    'custom_requests',
  ];

  console.log('\n[Tables Probe]:');
  const tableResults = {};
  for (const table of tablesToVerify) {
    const res = await supabase.from(table).select('*').limit(1);
    if (!res.error) {
      console.log(`  ✔ Table '${table}' is ACTIVE and responsive (HTTP 200)`);
      tableResults[table] = 'ACTIVE';
    } else {
      console.log(`  ▲ Table '${table}': ${res.error.code} - ${res.error.message}`);
      tableResults[table] = `${res.error.code}: ${res.error.message}`;
    }
  }

  console.log('\n[Storage Buckets Probe]:');
  const buckets = ['delivery-proofs', 'product-images', 'payment-proofs', 'custom-order-attachments'];
  for (const b of buckets) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${b}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (res.ok) {
      console.log(`  ✔ Bucket '${b}' is ACTIVE (HTTP ${res.status})`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.log(`  ▲ Bucket '${b}': ${err.code || res.status} - ${err.message || 'NoSuchBucket'}`);
    }
  }

  // Probe live ping
  const start = performance.now();
  const { error: pingErr } = await supabase.from('categories').select('id').limit(1);
  const latency = Math.round(performance.now() - start);

  console.log('\n[Live Ping Diagnostics]:');
  console.log(`  Status  : ${!pingErr ? 'ONLINE' : 'OFFLINE'}`);
  console.log(`  Latency : ${latency}ms`);

  console.log('================================================================');
  console.log('                       VERIFICATION COMPLETE                    ');
  console.log('================================================================\n');
}

async function main() {
  const isVerifyOnly = process.argv.includes('--verify-only');

  if (!isVerifyOnly) {
    const pgRes = await tryDirectPostgresMigration();
    if (!pgRes.attempted) {
      console.log('\nNote: Direct database execution requires DATABASE_URL or PGPASSWORD.');
      console.log('To apply via Supabase Dashboard SQL Editor:');
      console.log('1. Open https://supabase.com/dashboard/project/kxbdoqviqzseymjofsjg/sql');
      console.log(`2. Paste contents of ${MIGRATION_FILE}`);
      console.log('3. Click RUN.\n');
    }
  }

  await verifyLiveSupabaseSchema();
}

main().catch(console.error);
