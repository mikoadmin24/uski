import { create } from 'zustand';
import { Voucher } from '@/types';
import { mockVouchers } from '@/data/mockData';

interface PromoState {
  vouchers: Voucher[];
  setVouchersFromSupabase: (vouchers: Voucher[]) => void;
  addVoucher: (voucher: Omit<Voucher, 'id' | 'usage_count'>) => Voucher;
  updateVoucher: (id: string, updates: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  toggleVoucherStatus: (id: string) => void;
  validateVoucher: (
    code: string,
    subtotal: number
  ) => { valid: boolean; discountAmount: number; voucher?: Voucher; message?: string };
}

const VOUCHERS_KEY = 'uski_vouchers_v1';

const getInitialVouchers = (): Voucher[] => {
  try {
    const saved = localStorage.getItem(VOUCHERS_KEY);
    return saved ? JSON.parse(saved) : mockVouchers;
  } catch {
    return mockVouchers;
  }
};

export const usePromoStore = create<PromoState>((set, get) => ({
  vouchers: getInitialVouchers(),

  setVouchersFromSupabase: (vouchers) => {
    if (!vouchers || vouchers.length === 0) return;
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers));
    } catch {
      // ignore
    }
    set({ vouchers });
  },

  addVoucher: (data) => {
    const newVoucher: Voucher = {
      ...data,
      id: `vouch-${Date.now()}`,
      usage_count: 0,
    };
    const updated = [newVoucher, ...get().vouchers];
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });
    return newVoucher;
  },

  updateVoucher: (id, updates) => {
    const updated = get().vouchers.map((v) => (v.id === id ? { ...v, ...updates } : v));
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });
  },

  deleteVoucher: (id) => {
    const updated = get().vouchers.filter((v) => v.id !== id);
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });
  },

  toggleVoucherStatus: (id) => {
    const updated = get().vouchers.map((v) => (v.id === id ? { ...v, is_active: !v.is_active } : v));
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });
  },

  validateVoucher: (code, subtotal) => {
    const cleanCode = code.trim().toUpperCase();
    const voucher = get().vouchers.find((v) => v.code.toUpperCase() === cleanCode);

    if (!voucher) {
      return { valid: false, discountAmount: 0, message: 'Kode voucher tidak ditemukan.' };
    }

    if (!voucher.is_active) {
      return { valid: false, discountAmount: 0, message: 'Kode voucher sudah tidak aktif.' };
    }

    if (subtotal < voucher.min_spend) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimal belanja Rp ${voucher.min_spend.toLocaleString('id-ID')} untuk menggunakan voucher ini.`,
      };
    }

    let discount = 0;
    if (voucher.discount_type === 'percentage') {
      discount = (subtotal * voucher.discount_value) / 100;
      if (voucher.max_discount && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    } else {
      discount = voucher.discount_value;
    }

    // Never exceed subtotal
    discount = Math.min(discount, subtotal);

    return {
      valid: true,
      discountAmount: Math.round(discount),
      voucher,
      message: `Voucher ${voucher.code} berhasil diterapkan!`,
    };
  },
}));
