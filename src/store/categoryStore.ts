import { create } from 'zustand';
import { Category, PromoBanner } from '@/types';
import { dbService, supabase, isSupabaseConfigured } from '@/lib/supabase';

interface CategoryState {
  categories: Category[];
  banners: PromoBanner[];
  setCategoriesFromSupabase: (categories: Category[]) => void;
  setBannersFromSupabase: (banners: PromoBanner[]) => void;
  addCategory: (category: Omit<Category, 'id' | 'sort_order'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addBanner: (banner: Omit<PromoBanner, 'id'>) => PromoBanner;
  updateBanner: (id: string, updates: Partial<PromoBanner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;
}

const CATEGORIES_KEY = 'uski_categories_v1';
const BANNERS_KEY = 'uski_banners_v1';

const getInitialCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (!saved) return [];
    const parsed: Category[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const getInitialBanners = (): PromoBanner[] => {
  try {
    const saved = localStorage.getItem(BANNERS_KEY);
    if (!saved) return [];
    const parsed: PromoBanner[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: getInitialCategories(),
  banners: getInitialBanners(),

  setCategoriesFromSupabase: (categories) => {
    if (!categories) return;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch {
      // ignore
    }
    set({ categories });
  },

  setBannersFromSupabase: (banners) => {
    if (!banners) return;
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
    } catch {
      // ignore
    }
    set({ banners });
  },

  addCategory: (data) => {
    const newCategory: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      sort_order: get().categories.length + 1,
    };
    const updated = [...get().categories, newCategory];
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ categories: updated });

    if (isSupabaseConfigured) {
      dbService.categories.upsert(newCategory).catch((err) =>
        console.error('Error inserting category to Supabase:', err)
      );
    }

    return newCategory;
  },

  updateCategory: (id, updates) => {
    const updated = get().categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ categories: updated });

    if (isSupabaseConfigured) {
      dbService.categories.upsert({ id, ...updates }).catch((err) =>
        console.error('Error updating category in Supabase:', err)
      );
    }
  },

  deleteCategory: (id) => {
    const updated = get().categories.filter((c) => c.id !== id);
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ categories: updated });

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting category from Supabase:', error);
        });
    }
  },

  addBanner: (data) => {
    const newBanner: PromoBanner = {
      ...data,
      id: `banner-${Date.now()}`,
    };
    const updated = [newBanner, ...get().banners];
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ banners: updated });

    if (isSupabaseConfigured) {
      dbService.banners.upsert(newBanner).catch((err) =>
        console.error('Error inserting banner to Supabase:', err)
      );
    }

    return newBanner;
  },

  updateBanner: (id, updates) => {
    const updated = get().banners.map((b) => (b.id === id ? { ...b, ...updates } : b));
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ banners: updated });

    if (isSupabaseConfigured) {
      dbService.banners.upsert({ id, ...updates }).catch((err) =>
        console.error('Error updating banner in Supabase:', err)
      );
    }
  },

  deleteBanner: (id) => {
    const updated = get().banners.filter((b) => b.id !== id);
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ banners: updated });

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('banners')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting banner from Supabase:', error);
        });
    }
  },

  toggleBannerStatus: (id) => {
    let nextStatus = false;
    const updated = get().banners.map((b) => {
      if (b.id === id) {
        nextStatus = !b.is_active;
        return { ...b, is_active: nextStatus };
      }
      return b;
    });
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ banners: updated });

    if (isSupabaseConfigured) {
      dbService.banners.upsert({ id, is_active: nextStatus }).catch((err) =>
        console.error('Error toggling banner status in Supabase:', err)
      );
    }
  },
}));
