import { create } from 'zustand';
import { Product, InventoryMovement } from '@/types';
import { dbService, isSupabaseConfigured } from '@/lib/supabase';

interface ProductState {
  products: Product[];
  inventoryMovements: InventoryMovement[];
  setProductsFromSupabase: (products: Product[]) => void;
  setInventoryMovementsFromSupabase: (movements: InventoryMovement[]) => void;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  getProductByBarcodeOrSku: (query: string) => Product | undefined;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'rating' | 'reviews_count' | 'sales_count'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, newStock: number) => Promise<void>;
  adjustStock: (
    productId: string,
    variantId: string | undefined,
    delta: number,
    type: InventoryMovement['type'],
    notes: string,
    operator: string
  ) => void;
}

const STORAGE_KEY = 'uski_products_v2';
const MOVEMENTS_STORAGE_KEY = 'uski_inventory_movements_v2';

const getInitialProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const getInitialMovements = (): InventoryMovement[] => {
  try {
    const saved = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: getInitialProducts(),
  inventoryMovements: getInitialMovements(),

  setProductsFromSupabase: (cloudProducts) => {
    if (!cloudProducts) return;
    const current = get().products;
    const currentMap = new Map(current.map((p) => [p.id, p]));
    const merged = cloudProducts.map((cp) => {
      const existing = currentMap.get(cp.id);
      return {
        ...cp,
        is_featured: cp.is_featured ?? existing?.is_featured ?? false,
        is_best_seller: cp.is_best_seller ?? existing?.is_best_seller ?? false,
        is_new_arrival: cp.is_new_arrival ?? existing?.is_new_arrival ?? false,
      };
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
    set({ products: merged });
  },

  setInventoryMovementsFromSupabase: (movements) => {
    if (!movements) return;
    try {
      localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
    } catch {
      // ignore
    }
    set({ inventoryMovements: movements });
  },

  getProductBySlug: (slug) => {
    if (!slug) return undefined;
    let cleanSlug = slug.trim().toLowerCase();
    try {
      cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {
      // Keep trimmed lowercase fallback if URL decoding throws URIError
    }
    if (!cleanSlug) return undefined;
    return get().products.find((p) => p.slug?.trim().toLowerCase() === cleanSlug);
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  getProductByBarcodeOrSku: (query) => {
    const q = query.trim().toUpperCase();
    if (!q) return undefined;
    const cleanDigits = q.replace(/[^0-9]/g, '');

    return get().products.find(
      (p) =>
        p.id.toUpperCase() === q ||
        p.sku_master.toUpperCase() === q ||
        (cleanDigits.length >= 8 && p.sku_master.replace(/[^0-9]/g, '') === cleanDigits) ||
        (p.isbn && cleanDigits.length >= 8 && p.isbn.replace(/[^0-9]/g, '') === cleanDigits) ||
        (p.variants && p.variants.some((v) => v.sku.toUpperCase() === q))
    );
  },

  addProduct: async (productData) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviews_count: 0,
      sales_count: 0,
      created_at: new Date().toISOString(),
    };

    const updated = [newProduct, ...get().products];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set({ products: updated });

    if (isSupabaseConfigured) {
      await dbService.products.upsert(newProduct);
    }

    return newProduct;
  },

  updateProduct: async (id, updates) => {
    const updated = get().products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ products: updated });

    if (isSupabaseConfigured) {
      const mergedProduct = updated.find((p) => p.id === id);
      if (mergedProduct) {
        const updateRes = await dbService.products.update(id, updates);
        if (!updateRes) {
          await dbService.products.upsert(mergedProduct);
        }
      }
    }
  },

  deleteProduct: async (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ products: updated });

    if (isSupabaseConfigured) {
      await dbService.products.delete(id);
    }
  },

  updateStock: async (productId: string, newStock: number) => {
    const updated = get().products.map((p) => (p.id === productId ? { ...p, stock_quantity: newStock } : p));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ products: updated });

    if (isSupabaseConfigured) {
      const updateRes = await dbService.products.update(productId, { stock_quantity: newStock });
      if (!updateRes) {
        const fullProduct = updated.find((p) => p.id === productId);
        if (fullProduct) {
          await dbService.products.upsert(fullProduct);
        }
      }
    }
  },

  adjustStock: (productId, variantId, delta, type, notes, operator) => {
    let affectedProductName = '';
    let affectedSku = '';
    let newStock = 0;

    const updatedProducts = get().products.map((p) => {
      if (p.id === productId) {
        affectedProductName = p.name;
        if (variantId && p.variants) {
          const updatedVariants = p.variants.map((v) => {
            if (v.id === variantId) {
              affectedSku = v.sku;
              newStock = Math.max(0, v.stock_quantity + delta);
              return { ...v, stock_quantity: newStock };
            }
            return v;
          });
          const totalVariantStock = updatedVariants.reduce((sum, v) => sum + v.stock_quantity, 0);
          return { ...p, variants: updatedVariants, stock_quantity: totalVariantStock };
        } else {
          affectedSku = p.sku_master;
          newStock = Math.max(0, p.stock_quantity + delta);
          return { ...p, stock_quantity: newStock };
        }
      }
      return p;
    });

    const newMovement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      product_id: productId,
      product_name: affectedProductName,
      sku: affectedSku,
      type,
      quantity_delta: delta,
      stock_after: newStock,
      notes,
      operator_name: operator,
      created_at: new Date().toISOString(),
    };

    const updatedMovements = [newMovement, ...get().inventoryMovements];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
      localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(updatedMovements));
    } catch {
      // ignore
    }

    set({ products: updatedProducts, inventoryMovements: updatedMovements });

    if (isSupabaseConfigured) {
      dbService.inventoryMovements.insert(newMovement).catch((err) =>
        console.error('Failed to sync inventory movement to Supabase:', err)
      );
      dbService.products.update(productId, { stock_quantity: newStock }).catch(async (err) => {
        console.warn('dbService.products.update failed, falling back to full upsert:', err);
        const fullProduct = updatedProducts.find((p) => p.id === productId);
        if (fullProduct) {
          await dbService.products.upsert(fullProduct).catch((e) =>
            console.error('Failed to upsert full product to Supabase:', e)
          );
        }
      });
    }
  },
}));
