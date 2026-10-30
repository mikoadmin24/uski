import { create } from 'zustand';
import { Voucher } from '@/types';
import { dbService, isSupabaseConfigured } from '@/lib/supabase';

interface PromoState {
  vouchers: Voucher[];
  setVouchersFromSupabase: (vouchers: Voucher[]) => void;
  addVoucher: (voucher: Omit<Voucher, 'id' | 'usage_count'>) => Voucher;
  updateVoucher: (id: string, updates: Partial<Voucher>) => void;
  deleteVoucher: (id: string) => void;
  toggleVoucherStatus: (id: string) => void;
  incrementUsage: (id: string) => void;
  validateVoucher: (
    code: string,
    subtotal: number
  ) => { valid: boolean; discountAmount: number; voucher?: Voucher; message?: string };
}

const VOUCHERS_KEY = 'uski_vouchers_v1';

const getInitialVouchers = (): Voucher[] => {
  try {
    const saved = localStorage.getItem(VOUCHERS_KEY);
    if (!saved) return [];
    const parsed: Voucher[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    const mockIds = new Set(['vouch-1', 'vouch-2', 'vouch-3', 'vouch-4']);
    return parsed
      .filter((v) => !mockIds.has(v.id))
      .map((v) => ({
        ...v,
        target_audience: v.target_audience || 'all',
        target_audience_label: v.target_audience_label || 'Semua Pelanggan (Publik)',
        usage_per_user: v.usage_per_user || 1,
      }));
  } catch {
    return [];
  }
};

export const usePromoStore = create<PromoState>((set, get) => ({
  vouchers: getInitialVouchers(),

  setVouchersFromSupabase: (vouchers) => {
    if (!vouchers) return;
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
      target_audience: data.target_audience || 'all',
      target_audience_label: data.target_audience_label || 'Semua Pelanggan (Publik)',
      usage_per_user: data.usage_per_user || 1,
    };
    const updated = [newVoucher, ...get().vouchers];
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });

    if (isSupabaseConfigured) {
      dbService.vouchers.upsert(newVoucher).catch((err) =>
        console.error('Error inserting voucher to Supabase:', err)
      );
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

    if (isSupabaseConfigured) {
      dbService.vouchers.upsert({ id, ...updates }).catch((err) =>
        console.error('Error updating voucher in Supabase:', err)
      );
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

    if (isSupabaseConfigured) {
      dbService.vouchers.delete(id).catch((err) =>
        console.error('Error deleting voucher from Supabase:', err)
      );
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

    if (isSupabaseConfigured) {
      dbService.vouchers.upsert({ id, is_active: nextStatus }).catch((err) =>
        console.error('Error toggling voucher status in Supabase:', err)
      );
    }
  },

  incrementUsage: (id) => {
    let newCount = 1;
    const updated = get().vouchers.map((v) => {
      if (v.id === id) {
        newCount = (v.usage_count || 0) + 1;
        return { ...v, usage_count: newCount };
      }
      return v;
    });
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ vouchers: updated });

    if (isSupabaseConfigured) {
      dbService.vouchers.upsert({ id, usage_count: newCount }).catch((err) =>
        console.error('Error incrementing voucher usage in Supabase:', err)
      );
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
