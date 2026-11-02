import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { ProductCard } from '@/components/common/ProductCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();

  const querySearch = searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || '';
  const queryFilter = searchParams.get('filter') || '';
  const queryBrand = searchParams.get('brand') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(queryCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(queryBrand);
  const [subFilter, setSubFilter] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Sync category and brand from URL
  React.useEffect(() => {
    setSelectedCategory(queryCategory || '');
  }, [queryCategory]);

  React.useEffect(() => {
    setSelectedBrand(queryBrand || '');
  }, [queryBrand]);

  // Dynamically extract brands & authors from active products
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, string>(); // slug -> display name
    products
      .filter((p) => p.is_active !== false)
      .forEach((p) => {
        const brandOrAuthor = (p.author || p.brand?.name || '').trim();
        if (!brandOrAuthor) return;
        const slug = brandOrAuthor
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        if (slug && !brandMap.has(slug)) {
          brandMap.set(slug, brandOrAuthor);
        }
      });

    return Array.from(brandMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const hasExplicitBestSellers = products.some((p) => p.is_best_seller);
    const hasExplicitFeatured = products.some((p) => p.is_featured);
    const hasExplicitNewArrivals = products.some((p) => p.is_new_arrival);

    return products
      .filter((p) => {
        // Exclude inactive products
        if (p.is_active === false) return false;

        // Search query filter
        if (querySearch.trim()) {
          const q = querySearch.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchAuthor = p.author?.toLowerCase().includes(q);
          const matchSku = p.sku_master.toLowerCase().includes(q);
          const matchIsbn = p.isbn?.includes(q);
          if (!matchName && !matchAuthor && !matchSku && !matchIsbn) return false;
        }

        // Category filter (case-insensitive slug match, fail-closed)
        if (selectedCategory.trim()) {
          const targetSlug = selectedCategory.trim().toLowerCase();
          const cat = categories.find((c) => c.slug?.trim().toLowerCase() === targetSlug);
          if (!cat || p.category_id !== cat.id) return false;
        }

        // Sub-filter (Bidang Kitab / Jenjang Pendidikan)
        if (subFilter) {
          const qSub = subFilter.toLowerCase();
          const matchText =
            p.name.toLowerCase().includes(qSub) ||
            p.description?.toLowerCase().includes(qSub) ||
            (p.specifications ? JSON.stringify(p.specifications).toLowerCase().includes(qSub) : false);
          if (!matchText) return false;
        }

        // Dynamic Brand / Author filter
        if (selectedBrand.trim()) {
          const targetSlug = selectedBrand.trim().toLowerCase();
          const prodBrandText = (p.author || p.brand?.name || '').trim();
          const prodSlug = prodBrandText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          const matchesSlug = prodSlug === targetSlug;
          const matchesName = prodBrandText.toLowerCase() === targetSlug;
          const matchesBrandId = p.brand_id === selectedBrand;

          if (!matchesSlug && !matchesName && !matchesBrandId) return false;
        }

        // Stock filter
        if (inStockOnly && p.stock_quantity <= 0) return false;

        // Price range
        const price = p.sale_price ?? p.base_price;
        if (price < priceRange[0] || price > priceRange[1]) return false;

        // Preset query filter with intelligent fallback when badges are unassigned
        if (queryFilter === 'best-seller') {
          if (hasExplicitBestSellers && !p.is_best_seller) return false;
        }
        if (queryFilter === 'new') {
          if (hasExplicitNewArrivals && !p.is_new_arrival) return false;
        }
        if (queryFilter === 'discount') {
          if (!(p.sale_price && p.sale_price < p.base_price)) return false;
        }
        if (queryFilter === 'featured') {
          if (hasExplicitFeatured && !p.is_featured) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.sale_price ?? a.base_price;
        const priceB = b.sale_price ?? b.base_price;

        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'newest' || (queryFilter === 'new' && sortBy === 'popular')) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // default: popular (sales count)
        return b.sales_count - a.sales_count;
      });
  }, [
    products,
    querySearch,
    selectedCategory,
    selectedBrand,
    inStockOnly,
    priceRange,
    queryFilter,
    sortBy,
    subFilter,
    categories,
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSubFilter('');
    setInStockOnly(false);
    setPriceRange([0, 500000]);
    setSearchParams({});
  };

  return (
    <div className="max-w-site mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-hairline gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101519]">
            {querySearch
              ? `Hasil Pencarian: "${querySearch}"`
              : selectedCategory.trim()
              ? categories.find(
                  (c) => c.slug?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
                )?.name || 'Katalog Produk'
              : 'Semua Produk'}
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            Menampilkan <span className="font-bold text-[#101519]">{filteredProducts.length}</span> produk tersedia
          </p>
        </div>

        {/* Sort & Mobile Filter Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-hairline rounded-xl text-xs font-bold text-[#2D3033]"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Filter</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-body hidden sm:inline">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 bg-white border border-hairline rounded-xl text-xs font-semibold text-[#2D3033] focus:outline-none focus:border-primary"
            >
              <option value="popular">Paling Populer</option>
              <option value="newest">Produk Terbaru</option>
              <option value="price-low">Harga: Rendah ke Tinggi</option>
              <option value="price-high">Harga: Tinggi ke Rendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Category Chips for Mobile & Tablet */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-3 -mx-4 px-4 border-b border-hairline touch-scroll no-scrollbar">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            !selectedCategory.trim()
              ? 'bg-primary text-white shadow-xs'
              : 'bg-white text-body border border-hairline hover:bg-neutral-2'
          }`}
        >
          Semua
        </button>
        {categories.map((c) => {
          const isActive =
            Boolean(selectedCategory.trim()) &&
            selectedCategory.trim().toLowerCase() === c.slug?.trim().toLowerCase();
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-body border border-hairline hover:bg-neutral-2'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* Filter Sidebar (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white border border-hairline rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="text-sm font-extrabold text-[#101519] flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Filter Produk
              </span>
              <button
                onClick={handleResetFilters}
                className="text-xs text-primary font-bold hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2.5">
                Kategori
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                    !selectedCategory.trim()
                      ? 'bg-primary text-white font-bold'
                      : 'text-[#2D3033] hover:bg-neutral-2'
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((cat) => {
                  const isActive =
                    Boolean(selectedCategory.trim()) &&
                    selectedCategory.trim().toLowerCase() === cat.slug?.trim().toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors truncate ${
                        isActive
                          ? 'bg-primary text-white font-bold'
                          : 'text-[#2D3033] hover:bg-neutral-2'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-filter for Kitab */}
            {(selectedCategory.trim().toLowerCase() === 'kitab' || selectedCategory.trim().toLowerCase() === 'kitab-kuning') && (
              <div className="border-t border-hairline pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2.5">
                  Bidang Keilmuan Kitab
                </h4>
                <div className="space-y-1.5">
                  {['', 'Fikih', 'Nahwu', 'Hadits', 'Tafsir'].map((field) => (
                    <button
                      key={field}
                      onClick={() => setSubFilter(field)}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                        subFilter === field
                          ? 'bg-primary text-white font-bold'
                          : 'text-[#2D3033] hover:bg-neutral-2'
                      }`}
                    >
                      {field === '' ? 'Semua Bidang' : `Kitab ${field}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-filter for Pelajaran */}
            {selectedCategory.trim().toLowerCase() === 'buku-pelajaran' && (
              <div className="border-t border-hairline pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2.5">
                  Jenjang Pendidikan
                </h4>
                <div className="space-y-1.5">
                  {['', 'SD', 'SMP', 'SMA', 'Kelas 10'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSubFilter(lvl)}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                        subFilter === lvl
                          ? 'bg-primary text-white font-bold'
                          : 'text-[#2D3033] hover:bg-neutral-2'
                      }`}
                    >
                      {lvl === '' ? 'Semua Jenjang' : lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Brand & Author Filter */}
            {availableBrands.length > 0 && (
              <div className="border-t border-hairline pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2.5">
                  Merek & Penulis
                </h4>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedBrand('')}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                      !selectedBrand.trim()
                        ? 'bg-primary text-white font-bold'
                        : 'text-[#2D3033] hover:bg-neutral-2'
                    }`}
                  >
                    Semua Merek & Penulis
                  </button>
                  {availableBrands.map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => setSelectedBrand(b.slug)}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors truncate ${
                        selectedBrand.trim().toLowerCase() === b.slug.toLowerCase()
                          ? 'bg-primary text-white font-bold'
                          : 'text-[#2D3033] hover:bg-neutral-2'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Availability */}
            <div className="border-t border-hairline pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2.5">
                Ketersediaan
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#2D3033]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Hanya Tampilkan yang Ready Stock</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-hairline rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-neutral-2 rounded-full flex items-center justify-center mx-auto text-body">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-[#101519]">
                Tidak Ada Produk yang Sesuai
              </h3>
              <p className="text-xs sm:text-sm text-body max-w-md mx-auto">
                Coba ubah kata kunci pencarian atau sesuaikan pilihan filter kategori dan merek Anda.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all"
                >
                  Reset Semua Filter
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-4/5 max-w-xs bg-white h-full p-5 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="text-sm font-extrabold text-[#101519]">Filter Produk</span>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* Category */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2">Kategori</h4>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                    !selectedCategory.trim()
                      ? 'bg-primary text-white font-bold'
                      : 'text-[#2D3033] hover:bg-neutral-2'
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((c) => {
                  const isActive =
                    Boolean(selectedCategory.trim()) &&
                    selectedCategory.trim().toLowerCase() === c.slug?.trim().toLowerCase();
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCategory(c.slug);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors truncate ${
                        isActive
                          ? 'bg-primary text-white font-bold'
                          : 'text-[#2D3033] hover:bg-neutral-2'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Brand & Author */}
            {availableBrands.length > 0 && (
              <div className="pt-4 border-t border-hairline">
                <h4 className="text-xs font-bold uppercase tracking-wider text-body mb-2">Merek & Penulis</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedBrand('');
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                      !selectedBrand.trim()
                        ? 'bg-primary text-white font-bold'
                        : 'text-[#2D3033] hover:bg-neutral-2'
                    }`}
                  >
                    Semua Merek & Penulis
                  </button>
                  {availableBrands.map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => {
                        setSelectedBrand(b.slug);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors truncate ${
                        selectedBrand.trim().toLowerCase() === b.slug.toLowerCase()
                          ? 'bg-primary text-white font-bold'
                          : 'text-[#2D3033] hover:bg-neutral-2'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear button */}
            <div className="pt-4 border-t border-hairline">
              <button
                onClick={() => {
                  handleResetFilters();
                  setMobileFilterOpen(false);
                }}
                className="w-full py-2 bg-neutral-2 text-body font-bold text-xs rounded-xl"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
