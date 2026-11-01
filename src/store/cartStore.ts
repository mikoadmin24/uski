import { create } from 'zustand';
import { CartItem, Product, ProductVariant, Voucher } from '@/types';
import { usePromoStore } from '@/store/promoStore';

interface CartState {
  items: CartItem[];
  appliedVoucher: Voucher | null;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: (shippingFee?: number) => number;
  getItemCount: () => number;
}

const STORAGE_KEY = 'uski_cart_storage_v1';
const VOUCHER_STORAGE_KEY = 'uski_cart_voucher_v1';

const getInitialItems = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const getInitialVoucher = (items: CartItem[]): Voucher | null => {
  try {
    const saved = localStorage.getItem(VOUCHER_STORAGE_KEY);
    if (!saved) return null;
    const voucher: Voucher = JSON.parse(saved);
    if (!voucher || typeof voucher !== 'object') return null;

    const subtotal = items.reduce((total, item) => total + item.selected_price * item.quantity, 0);
    if (voucher.min_spend && subtotal < voucher.min_spend) {
      localStorage.removeItem(VOUCHER_STORAGE_KEY);
      return null;
    }
    return voucher;
  } catch {
    return null;
  }
};

const initialItems = getInitialItems();
const initialVoucher = getInitialVoucher(initialItems);

export const useCartStore = create<CartState>((set, get) => ({
  items: initialItems,
  appliedVoucher: initialVoucher,

  addToCart: (product, quantity = 1, variant) => {
    const currentItems = get().items;
    const price = variant?.price_override ?? (product.sale_price ?? product.base_price);
    const existingIndex = currentItems.findIndex(
      (item) => item.product.id === product.id && item.variant_id === variant?.id
    );

    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      const newQty = updatedItems[existingIndex].quantity + quantity;
      const maxStock = variant ? variant.stock_quantity : product.stock_quantity;
      updatedItems[existingIndex].quantity = Math.min(newQty, maxStock);
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${variant?.id || 'default'}-${Date.now()}`,
        product,
        variant_id: variant?.id,
        variant,
        quantity,
        selected_price: price,
      };
      updatedItems = [...currentItems, newItem];
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    } catch {
      // ignore
    }

    set({ items: updatedItems });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const updated = get().items.map((item) => {
      if (item.id === itemId) {
        const maxStock = item.variant
          ? item.variant.stock_quantity
          : item.product.stock_quantity;
        return {
          ...item,
          quantity: Math.min(quantity, maxStock),
        };
      }
      return item;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Automatic Voucher Revalidation
    const newSubtotal = updated.reduce((total, item) => total + item.selected_price * item.quantity, 0);
    let nextVoucher = get().appliedVoucher;

    if (nextVoucher && newSubtotal < nextVoucher.min_spend) {
      nextVoucher = null;
      try {
        localStorage.removeItem(VOUCHER_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    set({ items: updated, appliedVoucher: nextVoucher });
  },

  removeItem: (itemId) => {
    const updated = get().items.filter((item) => item.id !== itemId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Automatic Voucher Revalidation
    const newSubtotal = updated.reduce((total, item) => total + item.selected_price * item.quantity, 0);
    let nextVoucher = get().appliedVoucher;

    if (nextVoucher && (updated.length === 0 || newSubtotal < nextVoucher.min_spend)) {
      nextVoucher = null;
      try {
        localStorage.removeItem(VOUCHER_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    set({ items: updated, appliedVoucher: nextVoucher });
  },

  clearCart: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VOUCHER_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ items: [], appliedVoucher: null });
  },

  applyVoucher: (code) => {
    const cleanCode = code.trim().toUpperCase();
    const vouchers = usePromoStore.getState().vouchers;
    const voucher = vouchers.find((v) => v.code === cleanCode && v.is_active);

    if (!voucher) {
      return { success: false, message: 'Kode voucher tidak valid atau sudah kedaluwarsa.' };
    }

    const subtotal = get().getSubtotal();
    if (subtotal < voucher.min_spend) {
      return {
        success: false,
        message: `Minimal belanja Rp ${voucher.min_spend.toLocaleString('id-ID')} untuk menggunakan voucher ini.`,
      };
    }

    try {
      localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(voucher));
    } catch {
      // ignore
    }

    set({ appliedVoucher: voucher });
    return { success: true, message: `Voucher ${voucher.code} berhasil digunakan!` };
  },

  removeVoucher: () => {
    try {
      localStorage.removeItem(VOUCHER_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ appliedVoucher: null });
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.selected_price * item.quantity, 0);
  },

  getDiscount: () => {
    const { appliedVoucher } = get();
    if (!appliedVoucher) return 0;

    const subtotal = get().getSubtotal();
    if (appliedVoucher.discount_type === 'percentage') {
      const discount = (subtotal * appliedVoucher.discount_value) / 100;
      return appliedVoucher.max_discount
        ? Math.min(discount, appliedVoucher.max_discount)
        : discount;
    }

    return Math.min(appliedVoucher.discount_value, subtotal);
  },

  getTotal: (shippingFee = 0) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscount();
    return Math.max(0, subtotal - discount + shippingFee);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
