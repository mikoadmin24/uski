import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kxbdoqviqzseymjofsjg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmRvcXZpcXpzZXltam9mc2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0Nzc2NzgsImV4cCI6MjA0NjA1MzY3OH0.0y7m_G1qj67M7y-Y2gU-Z733s0oO0oM-k6789';

// We can import the actual client from tests/e2e/harness.js
import { supabase, ensureAuthSession } from './e2e/harness.js';

async function main() {
  await ensureAuthSession();
  console.log('Testing partial upsert vs update on Supabase products table...');

  // 1. Get an existing product
  const { data: prods, error: getErr } = await supabase.from('products').select('*').limit(1);
  if (getErr || !prods || prods.length === 0) {
    console.error('Failed to get product:', getErr);
    return;
  }
  const prod = prods[0];
  console.log('Existing product:', prod.id, prod.name, 'current is_featured:', prod.is_featured);

  // 2. Test partial upsert as productStore.ts does: dbService.products.upsert({ id: prod.id, is_featured: true })
  console.log('\nExecuting partial upsert: { id: "' + prod.id + '", is_featured: true }...');
  const { data: upsertData, error: upsertErr } = await supabase
    .from('products')
    .upsert({ id: prod.id, is_featured: true })
    .select()
    .single();

  console.log('Upsert result error:', upsertErr);

  // 3. Test update instead: supabase.from('products').update({ is_featured: true }).eq('id', prod.id)
  console.log('\nExecuting update: .update({ is_featured: true }).eq("id", "' + prod.id + '")...');
  const { data: updateData, error: updateErr } = await supabase
    .from('products')
    .update({ is_featured: true })
    .eq('id', prod.id)
    .select()
    .single();

  console.log('Update result error:', updateErr);
  console.log('Update success, new is_featured:', updateData?.is_featured);
}

main().catch(console.error);
