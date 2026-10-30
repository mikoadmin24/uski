import { supabase, ensureAuthSession } from '@/lib/supabase';
import {
  Product,
  Order,
  OrderItem,
  Category,
  Courier,
  CourierLocation,
  PromoBanner,
  Voucher,
  InventoryMovement,
  CustomRequest,
  CustomRequestStatus,
  OrderStatus,
} from '@/types';

export interface PingResult {
  connected: boolean;
  latencyMs: number;
  timestamp: string;
  endpoint: string;
  error?: string;
  details?: {
    hasAuthSession: boolean;
    serverTime?: string;
    productsCount?: number;
  };
}

export interface DeliveryProofRecord {
  id?: string;
  order_id: string;
  courier_id?: string;
  recipient_name: string;
  proof_photo_url: string;
  signature_url?: string;
  delivery_notes?: string;
  delivered_at?: string;
  created_at?: string;
}

export interface PaymentConfirmationRecord {
  id?: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  payment_method: string;
  amount: number;
  proof_image_url: string;
  bank_name?: string;
  account_name?: string;
  status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Centralized Database Service for USKI STORE
 * Real Supabase PostgREST Client Integration
 */
export const dbService = {
  /**
   * Active Live Database Ping Diagnostics
   * Queries the live Supabase cloud database to verify actual network connectivity and latency
   */
  async ping(): Promise<PingResult> {
    const timestamp = new Date().toISOString();
    const endpoint = import.meta.env.VITE_SUPABASE_URL || 'https://kxbdoqviqzseymjofsjg.supabase.co';

    if (!supabase) {
      return {
        connected: false,
        latencyMs: 0,
        timestamp,
        endpoint,
        error: 'Supabase client is not instantiated or URL/key is missing.',
      };
    }

    const start = performance.now();
    try {
      // Query categories table (fast lightweight check)
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      const latencyMs = Math.round(performance.now() - start);

      if (error) {
        return {
          connected: false,
          latencyMs,
          timestamp,
          endpoint,
          error: error.message || 'Database query failed.',
        };
      }

      // Check auth status
      const hasSession = await ensureAuthSession();

      return {
        connected: true,
        latencyMs,
        timestamp,
        endpoint,
        details: {
          hasAuthSession: hasSession,
          serverTime: timestamp,
          productsCount: data?.length || 0,
        },
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        connected: false,
        latencyMs,
        timestamp,
        endpoint,
        error: err?.message || 'Network connectivity error.',
      };
    }
  },

  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
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

    async getById(id: string): Promise<Product | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data as Product;
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

  // --------------------------------------------------------------------------
  // ORDERS
  // --------------------------------------------------------------------------
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

    async getById(id: string): Promise<Order | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data as Order;
    },

    async getByNumber(orderNumber: string): Promise<Order | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) return null;
      return data as Order;
    },

    async insert(order: Order | Partial<Order>): Promise<Order | null> {
      if (!supabase) return null;
      const isUuid = (val: any) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

      const payload = {
        ...order,
        customer_id: isUuid(order.customer_id) ? order.customer_id : null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Error inserting order to Supabase:', error);
        return null;
      }
      return data as Order;
    },

    async updateStatus(id: string, status: OrderStatus | string): Promise<boolean> {
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

    async assignCourier(
      orderId: string,
      courierId: string,
      courierName?: string
    ): Promise<boolean> {
      if (!supabase) return false;
      const updates: any = {
        courier_id: courierId,
        status: 'shipped',
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (courierName) {
        updates.courier_name = courierName;
      }
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error && error.code === 'PGRST204') {
        const fallbackUpdates: any = {
          status: 'shipped',
          updated_at: updates.updated_at,
        };
        if (courierName) {
          fallbackUpdates.courier_name = courierName;
        }
        const { error: fallbackErr } = await supabase
          .from('orders')
          .update(fallbackUpdates)
          .eq('id', orderId);
        return !fallbackErr;
      }

      return !error;
    },

    async completeDelivery(
      orderId: string,
      proofPhotoUrl: string,
      proofSignatureUrl: string,
      recipientName: string,
      notes?: string
    ): Promise<boolean> {
      if (!supabase) return false;
      const updates: any = {
        status: 'delivered',
        delivery_proof_url: proofPhotoUrl,
        delivery_signature_url: proofSignatureUrl,
        delivery_recipient_name: recipientName,
        delivery_notes: notes || null,
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error && error.code === 'PGRST204') {
        const { error: fallbackErr } = await supabase
          .from('orders')
          .update({
            status: 'delivered',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        return !fallbackErr;
      }

      return !error;
    },
  },

  // --------------------------------------------------------------------------
  // ORDER ITEMS
  // --------------------------------------------------------------------------
  orderItems: {
    async getByOrderId(orderId: string): Promise<OrderItem[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) return null;
      return data as OrderItem[];
    },

    async insertBatch(items: OrderItem[]): Promise<boolean> {
      if (!supabase || items.length === 0) return false;
      const { error } = await supabase.from('order_items').insert(items);
      return !error;
    },
  },

  // --------------------------------------------------------------------------
  // COURIERS
  // --------------------------------------------------------------------------
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

    async getById(id: string): Promise<Courier | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data as Courier;
    },

    async updateLocation(
      courierId: string,
      currentLocation: CourierLocation,
      activeDelivery?: any
    ): Promise<boolean> {
      if (!supabase) return false;
      const updates: any = {
        current_location: currentLocation,
        last_seen_at: new Date().toISOString(),
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

    async insert(courier: any): Promise<Courier | null> {
      if (!supabase) return null;
      const payload = { ...courier };
      if (payload.status === 'available') payload.status = 'idle';
      if (payload.status === 'off_duty') payload.status = 'offline';

      const { data, error } = await supabase
        .from('couriers')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (error.code === '23514') {
          const fallbackStatus = payload.status === 'offline' ? 'offline' : 'idle';
          const { data: fbData, error: fbErr } = await supabase
            .from('couriers')
            .insert({ ...payload, status: fallbackStatus })
            .select()
            .single();
          if (!fbErr) return fbData as Courier;
        }
        console.error('Error inserting courier to Supabase:', error);
        return null;
      }
      return data as Courier;
    },

    async update(courierId: string, data: any): Promise<boolean> {
      if (!supabase) return false;
      const payload: any = { ...data, updated_at: new Date().toISOString() };
      if (payload.status === 'available') payload.status = 'idle';
      if (payload.status === 'off_duty') payload.status = 'offline';

      const { error } = await supabase
        .from('couriers')
        .update(payload)
        .eq('id', courierId);

      if (error && error.code === '23514' && payload.status) {
        const fallbackStatus = payload.status === 'offline' ? 'offline' : 'idle';
        const { error: fallbackErr } = await supabase
          .from('couriers')
          .update({ ...payload, status: fallbackStatus })
          .eq('id', courierId);
        return !fallbackErr;
      }

      return !error;
    },

    async updateStatus(courierId: string, status: string): Promise<boolean> {
      if (!supabase) return false;
      const mappedStatus = status === 'available' ? 'idle' : status === 'off_duty' ? 'offline' : status;
      const { error } = await supabase
        .from('couriers')
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courierId);

      if (error) {
        const fallbackStatus = (status === 'off_duty' || status === 'offline') ? 'offline' : 'idle';
        const { error: fallbackErr } = await supabase
          .from('couriers')
          .update({
            status: fallbackStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', courierId);
        return !fallbackErr;
      }

      return !error;
    },

    async assignDelivery(courierId: string, activeDeliveryData: any): Promise<boolean> {
      if (!supabase) return false;
      const { error } = await supabase
        .from('couriers')
        .update({
          status: 'delivering',
          active_delivery: activeDeliveryData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courierId);
      return !error;
    },

    async completeDelivery(courierId: string): Promise<boolean> {
      if (!supabase) return false;
      const { data: courier } = await supabase
        .from('couriers')
        .select('total_delivered_today')
        .eq('id', courierId)
        .single();

      const newDelivered = (courier?.total_delivered_today || 0) + 1;

      const { error } = await supabase
        .from('couriers')
        .update({
          status: 'idle',
          active_delivery: null,
          total_delivered_today: newDelivered,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courierId);

      return !error;
    },
  },

  // --------------------------------------------------------------------------
  // VOUCHERS
  // --------------------------------------------------------------------------
  vouchers: {
    async getAll(): Promise<Voucher[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vouchers from Supabase:', error);
        return null;
      }
      return data as Voucher[];
    },

    async getActive(): Promise<Voucher[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true);

      if (error) return null;
      return data as Voucher[];
    },

    async getByCode(code: string): Promise<Voucher | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .ilike('code', code.trim())
        .eq('is_active', true)
        .single();

      if (error) return null;
      return data as Voucher;
    },

    async upsert(voucher: Partial<Voucher>): Promise<Voucher | null> {
      if (!supabase) return null;
      await ensureAuthSession();
      const { data, error } = await supabase
        .from('vouchers')
        .upsert(voucher)
        .select()
        .single();

      if (error) return null;
      return data as Voucher;
    },

    async delete(id: string): Promise<boolean> {
      if (!supabase) return false;
      await ensureAuthSession();
      const { error } = await supabase.from('vouchers').delete().eq('id', id);
      return !error;
    },
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
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

    async upsert(category: Partial<Category>): Promise<Category | null> {
      if (!supabase) return null;
      await ensureAuthSession();
      const { data, error } = await supabase
        .from('categories')
        .upsert(category)
        .select()
        .single();

      if (error) return null;
      return data as Category;
    },
  },

  // --------------------------------------------------------------------------
  // BANNERS
  // --------------------------------------------------------------------------
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

    async upsert(banner: Partial<PromoBanner>): Promise<PromoBanner | null> {
      if (!supabase) return null;
      await ensureAuthSession();
      const { data, error } = await supabase
        .from('banners')
        .upsert(banner)
        .select()
        .single();

      if (error) return null;
      return data as PromoBanner;
    },
  },

  // --------------------------------------------------------------------------
  // BULK ORDERS / CUSTOM REQUESTS
  // --------------------------------------------------------------------------
  bulkOrders: {
    async getAll(): Promise<CustomRequest[] | null> {
      if (!supabase) return null;
      // Try bulk_orders table first, fallback to custom_requests
      const { data, error } = await supabase
        .from('bulk_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return data as unknown as CustomRequest[];

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('custom_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallbackError) return null;
      return fallbackData as unknown as CustomRequest[];
    },

    async insert(request: Partial<CustomRequest>): Promise<CustomRequest | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('bulk_orders')
        .insert(request)
        .select()
        .single();

      if (!error && data) return data as unknown as CustomRequest;

      // Fallback to custom_requests
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('custom_requests')
        .insert(request)
        .select()
        .single();

      if (fallbackError) return null;
      return fallbackData as unknown as CustomRequest;
    },

    async updateStatus(id: string, status: CustomRequestStatus): Promise<boolean> {
      if (!supabase) return false;
      const { error } = await supabase
        .from('bulk_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) return true;

      const { error: fallbackError } = await supabase
        .from('custom_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      return !fallbackError;
    },
  },

  // --------------------------------------------------------------------------
  // PAYMENT CONFIRMATIONS
  // --------------------------------------------------------------------------
  paymentConfirmations: {
    async getAll(): Promise<PaymentConfirmationRecord[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('payment_confirmations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return null;
      return data as PaymentConfirmationRecord[];
    },

    async insert(
      record: PaymentConfirmationRecord
    ): Promise<PaymentConfirmationRecord | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('payment_confirmations')
        .insert(record)
        .select()
        .single();

      if (error) return null;
      return data as PaymentConfirmationRecord;
    },
  },

  // --------------------------------------------------------------------------
  // DELIVERY PROOFS
  // --------------------------------------------------------------------------
  deliveryProofs: {
    async getAll(): Promise<DeliveryProofRecord[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return null;
      return data as DeliveryProofRecord[];
    },

    async getByOrderId(orderId: string): Promise<DeliveryProofRecord[] | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('delivery_proofs')
        .select('*')
        .eq('order_id', orderId);

      if (error) return null;
      return data as DeliveryProofRecord[];
    },

    async insert(proof: DeliveryProofRecord): Promise<DeliveryProofRecord | null> {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('delivery_proofs')
        .insert(proof)
        .select()
        .single();

      if (error) return null;
      return data as DeliveryProofRecord;
    },
  },

  // --------------------------------------------------------------------------
  // INVENTORY MOVEMENTS (AUDIT TRAIL)
  // --------------------------------------------------------------------------
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
