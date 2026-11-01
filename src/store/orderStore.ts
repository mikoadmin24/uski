import { create } from 'zustand';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { dbService, isSupabaseConfigured, supabase } from '@/lib/supabase';

interface OrderState {
  orders: Order[];
  setOrdersFromSupabase: (orders: Order[]) => void;
  createOrder: (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => Order;
  addOrder: (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => Order;
  getOrderByNumber: (orderNumber: string) => Order | undefined;
  getUserOrders: (userId?: string, email?: string, phone?: string) => Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus, verifierName?: string, rejectionReason?: string) => void;
  uploadPaymentProof: (orderId: string, proofUrl: string) => void;
  updateShipmentTracking: (orderId: string, trackingNumber: string, courierName?: string) => void;
}

const STORAGE_KEY = 'uski_orders_v1';

const getInitialOrders = (): Order[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: Order[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: getInitialOrders(),

  setOrdersFromSupabase: (cloudOrders) => {
    if (!cloudOrders) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudOrders));
    } catch {
      // ignore
    }
    set({ orders: cloudOrders });
  },

  createOrder: (orderData) => {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newOrder, ...get().orders];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ orders: updated });

    if (isSupabaseConfigured) {
      const isUuid = (val?: string) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

      const payload = {
        ...newOrder,
        customer_id: isUuid(newOrder.customer_id) ? newOrder.customer_id : undefined,
        customer_email: newOrder.customer_email?.trim() || 'pembeli@uskistore.id',
      };

      dbService.orders.insert(payload).catch((err) =>
        console.error('Failed to sync new order to Supabase:', err)
      );
    }

    return newOrder;
  },

  addOrder: (orderData) => get().createOrder(orderData),

  getOrderByNumber: (orderNumber) => {
    const cleanNum = orderNumber.trim().toUpperCase();
    return get().orders.find((o) => o.order_number.toUpperCase() === cleanNum);
  },

  getUserOrders: (userId?: string, email?: string, phone?: string) => {
    if (!userId && !email && !phone) return [];
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone?.trim();
    const cleanPhoneDigits = cleanPhone?.replace(/\D/g, '') || '';

    return get().orders.filter((o) => {
      // 1. Authoritative account ID match
      if (userId && o.customer_id && o.customer_id === userId) return true;
      // 2. Email match (case-insensitive)
      if (cleanEmail && o.customer_email && o.customer_email.trim().toLowerCase() === cleanEmail) return true;
      // 3. Phone match (exact or normalized digits)
      if (cleanPhone && o.customer_phone) {
        if (o.customer_phone.trim() === cleanPhone) return true;
        const orderPhoneDigits = o.customer_phone.replace(/\D/g, '');
        if (cleanPhoneDigits.length >= 8 && orderPhoneDigits.length >= 8 && cleanPhoneDigits === orderPhoneDigits) {
          return true;
        }
      }
      return false;
    });
  },

  updateOrderStatus: (orderId, status) => {
    const updated = get().orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status,
          updated_at: new Date().toISOString(),
        };
      }
      return order;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ orders: updated });

    if (isSupabaseConfigured) {
      dbService.orders.updateStatus(orderId, status).catch((err) =>
        console.error('Failed to sync order status to Supabase:', err)
      );
    }
  },

  updatePaymentStatus: (orderId, status, verifierName = 'Admin', rejectionReason) => {
    let orderStatus: OrderStatus = 'awaiting_payment';
    const updated = get().orders.map((order) => {
      if (order.id === orderId) {
        orderStatus = order.status;
        if (status === 'verified') {
          orderStatus = 'processing';
        } else if (status === 'rejected') {
          orderStatus = 'awaiting_payment';
        }

        return {
          ...order,
          status: orderStatus,
          payment_status: status,
          payment: order.payment
            ? {
                ...order.payment,
                status,
                verified_by: verifierName,
                verified_at: new Date().toISOString(),
                rejection_reason: rejectionReason,
              }
            : undefined,
          updated_at: new Date().toISOString(),
        };
      }
      return order;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ orders: updated });

    if (isSupabaseConfigured) {
      dbService.orders.updateStatus(orderId, orderStatus).catch((err) =>
        console.error('Failed to sync payment status to Supabase:', err)
      );
      if (supabase) {
        supabase
          .from('orders')
          .update({
            payment_status: status,
            payment_rejection_reason: rejectionReason || null,
            verified_by: verifierName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .then(({ error }) => {
            if (error) console.error('Failed to sync payment details to Supabase:', error);
          });
      }
    }
  },

  uploadPaymentProof: (orderId, proofUrl) => {
    const updated = get().orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'awaiting_verification' as OrderStatus,
          payment: {
            id: `pay-${Date.now()}`,
            order_id: order.id,
            method: order.payment_method,
            amount: order.total_amount,
            status: 'pending' as PaymentStatus,
            proof_image_url: proofUrl,
            created_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        };
      }
      return order;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ orders: updated });

    if (isSupabaseConfigured) {
      dbService.orders.updatePaymentProof(orderId, proofUrl).catch((err) =>
        console.error('Failed to sync payment proof to Supabase:', err)
      );
    }
  },

  updateShipmentTracking: (orderId, trackingNumber, courierName) => {
    const updated = get().orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'shipped' as OrderStatus,
          courier_name: courierName || order.shipping_method,
          tracking_number: trackingNumber,
          shipment: {
            id: `shp-${Date.now()}`,
            order_id: order.id,
            courier_name: courierName || order.shipping_method,
            service_type: 'Reguler',
            tracking_number: trackingNumber,
            shipping_fee: order.shipping_fee,
            status: 'In Transit',
            recipient_name: order.shipping_address.recipient_name,
            phone_number: order.shipping_address.phone_number,
            shipping_address: `${order.shipping_address.street_address}, ${order.shipping_address.city}`,
            dispatched_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        };
      }
      return order;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ orders: updated });

    if (isSupabaseConfigured) {
      dbService.orders.updateStatus(orderId, 'shipped').catch((err) =>
        console.error('Failed to sync shipment tracking to Supabase:', err)
      );
      if (supabase) {
        supabase
          .from('orders')
          .update({
            tracking_number: trackingNumber,
            courier_name: courierName || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .then(({ error }) => {
            if (error) console.error('Failed to sync tracking fields to Supabase:', error);
          });
      }
    }
  },
}));
