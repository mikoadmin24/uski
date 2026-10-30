import { create } from 'zustand';
import { Category, PromoBanner } from '@/types';
import { mockCategories, mockBanners } from '@/data/mockData';

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
    return saved ? JSON.parse(saved) : mockCategories;
  } catch {
    return mockCategories;
  }
};

const getInitialBanners = (): PromoBanner[] => {
  try {
    const saved = localStorage.getItem(BANNERS_KEY);
    return saved ? JSON.parse(saved) : mockBanners;
  } catch {
    return mockBanners;
  }
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: getInitialCategories(),
  banners: getInitialBanners(),

  setCategoriesFromSupabase: (categories) => {
    if (!categories || categories.length === 0) return;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch {
      // ignore
    }
    set({ categories });
  },

  setBannersFromSupabase: (banners) => {
    if (!banners || banners.length === 0) return;
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
  },

  deleteCategory: (id) => {
    const updated = get().categories.filter((c) => c.id !== id);
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ categories: updated });
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
  },

  deleteBanner: (id) => {
    const updated = get().banners.filter((b) => b.id !== id);
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ banners: updated });
  },

  toggleBannerStatus: (id) => {
    const updated = get().banners.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b));
    try {
      localStorage.setItem(BANNERS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ banners: updated });
  },
}));
