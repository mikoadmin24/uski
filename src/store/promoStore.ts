import { create } from 'zustand';
import { Voucher } from '@/types';
import { mockVouchers } from '@/data/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
    if (!saved) return mockVouchers;
    const parsed: Voucher[] = JSON.parse(saved);
    const existingIds = new Set(parsed.map((v) => v.id));
    const missingMocks = mockVouchers.filter((m) => !existingIds.has(m.id));
    return [...parsed, ...missingMocks].map((v) => ({
      ...v,
      target_audience: v.target_audience || 'all',
      target_audience_label: v.target_audience_label || 'Semua Pelanggan (Publik)',
      usage_per_user: v.usage_per_user || 1,
    }));
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

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('vouchers')
        .insert(newVoucher)
        .then(({ error }) => {
          if (error) console.error('Error inserting voucher to Supabase:', error);
        });
    }

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

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('vouchers')
        .update(updates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error updating voucher in Supabase:', error);
        });
    }
  },

  deleteVoucher: (id) => {
    const updated = get().vouchers.filter((v) => v.id !== id);
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('vouchers')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting voucher from Supabase:', error);
        });
    }
  },

  toggleVoucherStatus: (id) => {
    let nextStatus = false;
    const updated = get().vouchers.map((v) => {
      if (v.id === id) {
        nextStatus = !v.is_active;
        return { ...v, is_active: nextStatus };
      }
      return v;
    });
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('vouchers')
        .update({ is_active: nextStatus })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error toggling voucher status in Supabase:', error);
        });
    }
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
