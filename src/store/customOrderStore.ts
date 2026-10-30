import { create } from 'zustand';
import { CustomRequest, CustomQuote, CustomRequestStatus } from '@/types';
import { mockCustomRequests } from '@/data/mockData';
import { generateQuoteNumber } from '@/lib/utils';
import { useOrderStore } from './orderStore';

interface CustomOrderState {
  requests: CustomRequest[];
  createRequest: (data: Omit<CustomRequest, 'id' | 'reference_number' | 'status' | 'created_at'>) => CustomRequest;
  getRequestByReference: (ref: string) => CustomRequest | undefined;
  updateStatus: (requestId: string, status: CustomRequestStatus) => void;
  createOrUpdateQuote: (requestId: string, quote: Omit<CustomQuote, 'id' | 'quote_number' | 'custom_request_id' | 'status' | 'created_at'>) => void;
  approveQuote: (requestId: string) => string; // returns created order_number
  rejectQuote: (requestId: string, reason?: string) => void;
}

const STORAGE_KEY = 'uski_custom_requests_v1';

const getInitialRequests = (): CustomRequest[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : mockCustomRequests;
  } catch {
    return mockCustomRequests;
  }
};

export const useCustomOrderStore = create<CustomOrderState>((set, get) => ({
  requests: getInitialRequests(),

  createRequest: (data) => {
    const newReq: CustomRequest = {
      ...data,
      id: `cr-${Date.now()}`,
      reference_number: generateQuoteNumber(),
      status: 'pending_review',
      created_at: new Date().toISOString(),
    };

    const updated = [newReq, ...get().requests];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ requests: updated });
    return newReq;
  },

  getRequestByReference: (ref) => {
    const clean = ref.trim().toUpperCase();
    return get().requests.find((r) => r.reference_number.toUpperCase() === clean);
  },

  updateStatus: (requestId, status) => {
    const updated = get().requests.map((r) => {
      if (r.id === requestId) {
        return { ...r, status };
      }
      return r;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ requests: updated });
  },

  createOrUpdateQuote: (requestId, quoteData) => {
    const quoteNumber = `QUO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQuote: CustomQuote = {
      ...quoteData,
      id: `q-${Date.now()}`,
      quote_number: quoteNumber,
      custom_request_id: requestId,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    const updated = get().requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'quote_sent' as CustomRequestStatus,
          quote: newQuote,
        };
      }
      return r;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ requests: updated });
  },

  approveQuote: (requestId) => {
    const req = get().requests.find((r) => r.id === requestId);
    if (!req || !req.quote) throw new Error('Quotation tidak ditemukan');

    // Create official order in OrderStore
    const quote = req.quote;
    const orderItems = quote.items.map((item, idx) => ({
      id: `item-q-${idx}-${Date.now()}`,
      order_id: '',
      product_id: `custom-${idx}`,
      product_name: item.description,
      sku: `CUSTOM-${idx + 1}`,
      price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const orderNumber = `USKI-CUSTOM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = useOrderStore.getState().createOrder({
      order_number: orderNumber,
      customer_name: req.customer_name,
      customer_email: req.customer_email,
      customer_phone: req.customer_phone,
      items: orderItems,
      subtotal: quote.subtotal,
      discount_amount: 0,
      shipping_fee: quote.shipping_fee,
      total_amount: quote.grand_total,
      status: 'awaiting_payment',
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      shipping_method: 'Ekspedisi Kargo / Kurir Toko USKI',
      shipping_address: {
        id: `addr-cr-${Date.now()}`,
        user_id: 'guest',
        recipient_name: req.customer_name,
        phone_number: req.customer_phone,
        street_address: req.shipping_address || 'Alamat sesuai pengajuan RFQ',
        district: 'Pengadaan Khusus',
        city: 'Tujuan Tertera',
        province: 'Indonesia',
        postal_code: '00000',
        is_primary: true,
      },
      notes: `Pesanan resmi konversi dari Penawaran: ${quote.quote_number} (${req.title})`,
    });

    // Update custom request status
    const updated = get().requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'converted_to_order' as CustomRequestStatus,
          quote: r.quote ? { ...r.quote, status: 'accepted' as const } : undefined,
        };
      }
      return r;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ requests: updated });
    return newOrder.order_number;
  },

  rejectQuote: (requestId) => {
    const updated = get().requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected' as CustomRequestStatus,
          quote: r.quote ? { ...r.quote, status: 'rejected' as const } : undefined,
        };
      }
      return r;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ requests: updated });
  },
}));
