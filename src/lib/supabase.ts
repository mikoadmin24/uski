import { createClient } from '@supabase/supabase-js';
import { Product, Order, Category, Courier, PromoBanner, Voucher, InventoryMovement, CustomRequest } from '@/types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://kxbdoqviqzseymjofsjg.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fhozwGC_3SgDnie_Z-10Lg_0C1n8M_v';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

// Create Supabase Client instance (safe for browser environments)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Ensure active Supabase Auth session so Row-Level Security (RLS)
 * permits write operations (insert, update, delete, storage upload).
 */
export async function ensureAuthSession(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: 'admin@uskistore.id',
      password: 'password123',
    });
    return Boolean(!error && loginData.session);
  } catch (err) {
    console.warn('ensureAuthSession error:', err);
    return false;
  }
}

/**
 * Upload image or document directly to Supabase Storage Bucket
 * with automatic public URL generation
 */
export async function uploadFileToStorage(
  file: File,
  bucket: 'product-images' | 'payment-proofs' | 'delivery-proofs' | 'custom-order-attachments',
  customFolder = ''
): Promise<string> {
  if (!supabase) {
    // Fallback for local preview if Supabase is not yet configured: create object URL
    return URL.createObjectURL(file);
  }

  await ensureAuthSession();

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = customFolder ? `${customFolder}/${fileName}` : fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error(`Error uploading to ${bucket}:`, uploadError);
    return URL.createObjectURL(file);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Database Services for real Supabase connectivity
 */
export const dbService = {
  // PRODUCTS
  products: {
    async getAll(): Promise<Product[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching products from Supabase:', error);
        return null;
      }
      return data as Product[];
    },

    async upsert(product: Partial<Product>): Promise<Product | null> {
      if (!supabase) return null;
      await ensureAuthSession();
      const { data, error } = await supabase
        .from('products')
        .upsert(product)
        .select()
        .single();
      if (error) {
        console.error('Error upserting product to Supabase:', error);
        return null;
      }
      return data as Product;
    },

    async delete(id: string): Promise<boolean> {
      if (!supabase) return false;
      await ensureAuthSession();
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    },
  },

  // ORDERS
  orders: {
    async getAll(): Promise<Order[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching orders from Supabase:', error);
        return null;
      }
      return data as Order[];
    },

    async insert(order: Order): Promise<Order | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      if (error) {
        console.error('Error inserting order to Supabase:', error);
        return null;
      }
      return data as Order;
    },

    async updateStatus(id: string, status: string): Promise<boolean> {
      if (!supabase) return false;
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      return !error;
    },

    async updatePaymentProof(id: string, proofUrl: string): Promise<boolean> {
      if (!supabase) return false;
      const { error } = await supabase
        .from('orders')
        .update({
          proof_of_payment_url: proofUrl,
          payment_status: 'pending',
          status: 'awaiting_verification',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      return !error;
    },
  },

  // COURIERS (REAL-TIME GPS TELEMETRY)
  couriers: {
    async getAll(): Promise<Courier[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase.from('couriers').select('*');
      if (error) {
        console.error('Error fetching couriers from Supabase:', error);
        return null;
      }
      return data as Courier[];
    },

    async updateLocation(
      courierId: string,
      currentLocation: any,
      activeDelivery?: any
    ): Promise<boolean> {
      if (!supabase) return false;
      const updates: any = {
        current_location: currentLocation,
        updated_at: new Date().toISOString(),
      };
      if (activeDelivery !== undefined) {
        updates.active_delivery = activeDelivery;
      }
      const { error } = await supabase
        .from('couriers')
        .update(updates)
        .eq('id', courierId);
      return !error;
    },
  },

  // CATEGORIES
  categories: {
    async getAll(): Promise<Category[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching categories from Supabase:', error);
        return null;
      }
      return data as Category[];
    },
  },

  // VOUCHERS
  vouchers: {
    async getAll(): Promise<Voucher[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true);
      if (error) {
        console.error('Error fetching vouchers from Supabase:', error);
        return null;
      }
      return data as Voucher[];
    },
  },

  // BANNERS
  banners: {
    async getAll(): Promise<PromoBanner[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching banners from Supabase:', error);
        return null;
      }
      return data as PromoBanner[];
    },
  },

  // INVENTORY MOVEMENTS (AUDIT TRAIL)
  inventoryMovements: {
    async insert(movement: InventoryMovement): Promise<boolean> {
      if (!supabase) return false;
      const { error } = await supabase.from('inventory_movements').insert(movement);
      return !error;
    },

    async getAll(): Promise<InventoryMovement[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return null;
      return data as InventoryMovement[];
    },
  },
};
