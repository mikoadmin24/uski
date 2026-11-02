import React, { useState } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';
import { useProductStore } from '@/store/productStore';
import { Category, PromoBanner } from '@/types';

export const AdminCategories: React.FC = () => {
  const {
    categories,
    banners,
    addCategory,
    updateCategory,
    deleteCategory,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
  } = useCategoryStore();
  const { products } = useProductStore();

  const [activeTab, setActiveTab] = useState<'categories' | 'banners'>('categories');

  // Category Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('BookOpen');

  // Banner Modal States
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerBadge, setBannerBadge] = useState('PROMO BULAN INI');
  const [bannerLink, setBannerLink] = useState('/products');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);

  // Delete Confirmation Popup States
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<PromoBanner | null>(null);

  // Category Handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatIcon('BookOpen');
    setShowCatModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || '');
    setCatIcon(cat.icon || 'BookOpen');
    setShowCatModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const slug =
      catSlug.trim() ||
      catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        slug,
        description: catDesc.trim(),
        icon: catIcon,
      });
    } else {
      addCategory({
        name: catName.trim(),
        slug,
        description: catDesc.trim(),
        icon: catIcon,
      });
    }
    setShowCatModal(false);
  };

  // Banner Handlers
  const openAddBanner = () => {
    setEditingBanner(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerBadge('PROMO TERBARU');
    setBannerLink('/products');
    setBannerImageUrl('');
    setBannerImagePreview(null);
    setShowBannerModal(true);
  };

  const openEditBanner = (b: PromoBanner) => {
    setEditingBanner(b);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle || '');
    setBannerBadge(b.badge_text || 'PROMO BULAN INI');
    setBannerLink(b.link_url || '/products');
    setBannerImageUrl(b.image_url);
    setBannerImagePreview(b.image_url);
    setShowBannerModal(true);
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) return;

    const finalImage =
      bannerImagePreview ||
      bannerImageUrl.trim() ||
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1400';

    if (editingBanner) {
      updateBanner(editingBanner.id, {
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        badge_text: bannerBadge.trim(),
        link_url: bannerLink.trim(),
        image_url: finalImage,
      });
    } else {
      addBanner({
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        badge_text: bannerBadge.trim(),
        link_url: bannerLink.trim(),
        image_url: finalImage,
        is_active: true,
      });
    }
    setShowBannerModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Kategori & Banner Hero Toko
          </h1>
          <p className="text-xs text-body mt-1">
            Kelola taksonomi kategori buku/ATK dan atur slide banner promo di halaman utama tanpa koding
          </p>
        </div>

        <button
          onClick={activeTab === 'categories' ? openAddCategory : openAddBanner}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'categories' ? 'Tambah Kategori Baru' : 'Tambah Banner Promo'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'categories'
              ? 'text-primary'
              : 'text-body hover:text-[#101519]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master Kategori ({categories.length})</span>
          {activeTab === 'categories' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'banners'
              ? 'text-primary'
              : 'text-body hover:text-[#101519]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Banner Slide Beranda ({banners.length})</span>
          {activeTab === 'banners' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: CATEGORIES TABLE */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Slug URL</th>
                  <th className="py-3 px-4">Deskripsi Singkat</th>
                  <th className="py-3 px-4 text-center">Jumlah Produk</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category_id === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-neutral-2/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#101519]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {cat.name.slice(0, 1)}
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-body">
                        /products?category={cat.slug}
                      </td>
                      <td className="py-3.5 px-4 text-body max-w-xs truncate">
                        {cat.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold px-2 py-0.5 bg-neutral-2 rounded text-[#101519]">
                          {count} item
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Edit Kategori"
                            onClick={() => openEditCategory(cat)}
                            className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Kategori"
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-1.5 hover:text-badge-text text-body hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HERO BANNERS */}
      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-neutral-2 overflow-hidden">
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-between">
                    <span className="self-start px-2 py-0.5 bg-accent-1 text-black font-extrabold text-[10px] rounded tracking-wide uppercase">
                      {b.badge_text || 'PROMO'}
                    </span>
                    <div>
                      <h4 className="text-white font-extrabold text-sm line-clamp-1">{b.title}</h4>
                      <p className="text-white/80 text-[11px] line-clamp-1 mt-0.5">{b.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-body">
                    <span>Tautan Target:</span>
                    <span className="font-mono text-primary font-semibold">{b.link_url}</span>
                  </div>
                  <div className="flex items-center justify-between text-body">
                    <span>Status Publikasi:</span>
                    <button
                      onClick={() => toggleBannerStatus(b.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-2 text-body'
                      }`}
                    >
                      {b.is_active ? 'Aktif Tayang' : 'Non-Aktif'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-hairline flex items-center justify-end gap-2 bg-neutral-2/30">
                <button
                  onClick={() => openEditBanner(b)}
                  className="px-3 py-1.5 bg-white border border-hairline hover:bg-neutral-2 text-body font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Banner</span>
                </button>
                <button
                  onClick={() => setBannerToDelete(b)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-badge-text font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-extrabold text-[#101519]">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setShowCatModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Mushaf & Tafsir"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Slug URL</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="mushaf-tafsir (Opsional, otomatis)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Koleksi Al-Qur'an mushaf dan kitab tafsir..."
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-extrabold text-[#101519]">
                {editingBanner ? 'Edit Banner Promo' : 'Tambah Banner Promo'}
              </h3>
              <button onClick={() => setShowBannerModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Judul Banner *</label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="Contoh: Diskon Kitab Kuning & Mushaf 25%"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Subjudul / Keterangan</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Berlaku selama bulan Ramadhan untuk pesantren dan madrasah"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Label Badge</label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    placeholder="PROMO SPESIAL"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Tautan / URL Klik</label>
                  <input
                    type="text"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="/products?category=kitab"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label className="font-bold text-body block mb-1">Gambar Banner</label>
                {bannerImagePreview ? (
                  <div className="relative border border-hairline rounded-2xl overflow-hidden mb-2">
                    <img
                      src={bannerImagePreview}
                      alt="Preview"
                      className="w-full h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setBannerImagePreview(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-5 cursor-pointer bg-neutral-2/40 hover:bg-neutral-2/80 transition-all text-center">
                    <UploadCloud className="w-8 h-8 text-primary mb-1" />
                    <span className="font-bold text-xs text-[#101519]">
                      Upload Foto Banner dari Komputer
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="mt-2">
                  <span className="text-body text-[11px] block mb-1">Atau masukkan URL gambar:</span>
                  <input
                    type="url"
                    value={bannerImageUrl}
                    onChange={(e) => {
                      setBannerImageUrl(e.target.value);
                      setBannerImagePreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-9 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-hairline flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Popup Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 space-y-4 shadow-2xl text-center border border-hairline animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#101519]">Hapus Kategori?</h3>
              <p className="text-xs text-body mt-1">
                Kategori <strong className="text-[#101519]">"{categoryToDelete.name}"</strong> akan dihapus dari sistem.
              </p>
              <p className="text-[11px] text-rose-600 font-semibold mt-2">
                Produk yang memakai kategori ini tidak akan terhapus namun perlu dipetakan ke kategori lain.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-5 py-2.5 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCategory(categoryToDelete.id);
                  setCategoryToDelete(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Kategori</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Banner Confirmation Popup Modal */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 space-y-4 shadow-2xl text-center border border-hairline animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#101519]">Hapus Banner Promo?</h3>
              <p className="text-xs text-body mt-1">
                Banner <strong className="text-[#101519]">"{bannerToDelete.title}"</strong> akan dihapus dari carousel beranda utama.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="px-5 py-2.5 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBanner(bannerToDelete.id);
                  setBannerToDelete(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
