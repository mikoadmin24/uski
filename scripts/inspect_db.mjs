import { createClient } from '@supabase/supabase-js';

const url = 'https://kxbdoqviqzseymjofsjg.supabase.co';
const key = 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';
const supabase = createClient(url, key);

async function inspect() {
  console.log('--- CATEGORIES ---');
  const { data: categories, error: catErr } = await supabase.from('categories').select('id, name, slug, is_active');
  if (catErr) console.error('Cat error:', catErr);
  else console.log(categories);

  console.log('\n--- PRODUCTS ---');
  const { data: products, error: prodErr } = await supabase.from('products').select('id, name, category_id, base_price, stock_quantity, weight_grams, is_active');
  if (prodErr) console.error('Prod error:', prodErr);
  else {
    const catIds = new Set((categories || []).map(c => c.id));
    for (const p of products || []) {
      const validCat = catIds.has(p.category_id);
      console.log(`[${p.id}] ${p.name} | Cat: ${p.category_id} (valid: ${validCat}) | Price: Rp ${p.base_price} | Stock: ${p.stock_quantity} | Weight: ${p.weight_grams}g | Active: ${p.is_active}`);
    }
  }

  console.log('\n--- ORDERS ---');
  const { data: orders, error: ordErr } = await supabase.from('orders').select('id, order_number, customer_name, customer_phone, total_amount, status, payment_status, shipping_method, items').order('created_at', { ascending: false }).limit(5);
  if (ordErr) console.error('Order error:', ordErr);
  else {
    for (const o of orders || []) {
      const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
      console.log(`[${o.id}] #${o.order_number} | ${o.customer_name} (${o.customer_phone}) | Total: Rp ${o.total_amount} | Status: ${o.status} | Pay: ${o.payment_status} | Method: ${o.shipping_method} | Items: ${itemsCount}`);
    }
  }

  console.log('\n--- VOUCHERS ---');
  const { data: vouchers, error: vErr } = await supabase.from('vouchers').select('*');
  if (vErr) console.error('Voucher error:', vErr);
  else console.log(vouchers);
}

inspect();
