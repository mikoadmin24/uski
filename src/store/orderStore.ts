import { create } from 'zustand';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { mockOrders } from '@/data/mockData';

interface OrderState {
  orders: Order[];
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
    return saved ? JSON.parse(saved) : mockOrders;
  } catch {
    return mockOrders;
  }
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: getInitialOrders(),

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
  },

  updatePaymentStatus: (orderId, status, verifierName = 'Admin', rejectionReason) => {
    const updated = get().orders.map((order) => {
      if (order.id === orderId) {
        let orderStatus: OrderStatus = order.status;
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
  },
}));
