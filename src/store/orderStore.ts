import { create } from 'zustand';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { mockOrders } from '@/data/mockData';
import { dbService, isSupabaseConfigured } from '@/lib/supabase';

interface OrderState {
  orders: Order[];
  setOrdersFromSupabase: (orders: Order[]) => void;
  createOrder: (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => Order;
  getOrderByNumber: (orderNumber: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus, verifierName?: string, rejectionReason?: string) => void;
  uploadPaymentProof: (orderId: string, proofUrl: string) => void;
  updateShipmentTracking: (orderId: string, trackingNumber: string, courierName?: string) => void;
}

const STORAGE_KEY = 'uski_orders_v1';

const getInitialOrders = (): Order[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return mockOrders;
    const parsed: Order[] = JSON.parse(saved);
    const existingIds = new Set(parsed.map(o => o.id));
    const missingMocks = mockOrders.filter(m => !existingIds.has(m.id));
    return [...parsed, ...missingMocks];
  } catch {
    return mockOrders;
  }
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: getInitialOrders(),

  setOrdersFromSupabase: (cloudOrders) => {
    if (!cloudOrders || cloudOrders.length === 0) return;
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
      id: `ord-${Date.now()}`,
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
      dbService.orders.insert(newOrder).catch((err) =>
        console.error('Failed to sync new order to Supabase:', err)
      );
    }

    return newOrder;
  },

  getOrderByNumber: (orderNumber) => {
    const cleanNum = orderNumber.trim().toUpperCase();
    return get().orders.find((o) => o.order_number.toUpperCase() === cleanNum);
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
    }
  },
}));
