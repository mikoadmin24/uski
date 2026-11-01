import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductSection } from '@/components/home/ProductSection';
import { BulkOrderBanner } from '@/components/home/BulkOrderBanner';
import { useProductStore } from '@/store/productStore';

export const HomePage: React.FC = () => {
  const { products } = useProductStore();

  // Baseline: Filter out deactivated products from storefront
  const activeProducts = React.useMemo(
    () => products.filter((p) => p.is_active !== false),
    [products]
  );

  // 1. Best Sellers: Explicit badges first, supplemented up to 8 with highest sales & rating
  const bestSellers = React.useMemo(() => {
    const explicit = activeProducts.filter((p) => Boolean(p.is_best_seller));
    if (explicit.length >= 8) {
      return explicit.slice(0, 8);
    }
    const explicitIds = new Set(explicit.map((p) => p.id));
    const supplemental = [...activeProducts]
      .filter((p) => !explicitIds.has(p.id))
      .sort((a, b) => {
        const salesDiff = (b.sales_count ?? 0) - (a.sales_count ?? 0);
        if (salesDiff !== 0) return salesDiff;
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.reviews_count ?? 0) - (a.reviews_count ?? 0);
      });
    return [...explicit, ...supplemental].slice(0, 8);
  }, [activeProducts]);

  // 2. Discount Products: Active products with real discount, sorted by highest percentage off
  const discountProducts = React.useMemo(() => {
    return [...activeProducts]
      .filter((p) => Boolean(p.sale_price && p.sale_price < p.base_price))
      .sort((a, b) => {
        const discA = ((a.base_price - (a.sale_price ?? a.base_price)) / a.base_price);
        const discB = ((b.base_price - (b.sale_price ?? b.base_price)) / b.base_price);
        return discB - discA;
      })
      .slice(0, 8);
  }, [activeProducts]);

  // 3. Featured Products: Explicit badges first, supplemented up to 8 with high-stock & high-rating items
  const featuredProducts = React.useMemo(() => {
    const explicit = activeProducts.filter((p) => Boolean(p.is_featured));
    if (explicit.length >= 8) {
      return explicit.slice(0, 8);
    }
    const explicitIds = new Set(explicit.map((p) => p.id));
    const supplemental = [...activeProducts]
      .filter((p) => !explicitIds.has(p.id))
      .sort((a, b) => {
        const inStockA = a.stock_quantity > 0 ? 1 : 0;
        const inStockB = b.stock_quantity > 0 ? 1 : 0;
        if (inStockB !== inStockA) return inStockB - inStockA;
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0);
      });
    return [...explicit, ...supplemental].slice(0, 8);
  }, [activeProducts]);

  // 4. New Arrivals: Explicit badges first, supplemented up to 8 with newest created products
  const newArrivals = React.useMemo(() => {
    const explicit = activeProducts.filter((p) => Boolean(p.is_new_arrival));
    if (explicit.length >= 8) {
      return explicit.slice(0, 8);
    }
    const explicitIds = new Set(explicit.map((p) => p.id));
    const supplemental = [...activeProducts]
      .filter((p) => !explicitIds.has(p.id))
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return b.id.localeCompare(a.id);
      });
    return [...explicit, ...supplemental].slice(0, 8);
  }, [activeProducts]);

  return (
    <div className="max-w-site mx-auto px-4 py-4 sm:py-6">
      {/* Hero Banner Carousel */}
      <HeroBanner />

      {/* Categories Grid */}
      <CategoryGrid />

      {/* Best Seller Section */}
      <ProductSection
        badge="POPULER & TERLARIS"
        title="Buku & ATK Pilihan Terlaris"
        subtitle="Produk yang paling banyak dipesan oleh pelanggan dan instansi"
        products={bestSellers}
        viewAllLink="/products?filter=best-seller"
      />

      {/* Special RFQ Custom & Bulk Order Banner */}
      <BulkOrderBanner />

      {/* Promo & Diskon Spesial Section */}
      <ProductSection
        badge="HEMAT HINGGA 25%"
        title="Penawaran Diskon Spesial"
        subtitle="Dapatkan potongan harga langsung untuk berbagai judul buku & alat tulis"
        products={discountProducts}
        viewAllLink="/products?filter=discount"
      />

      {/* Featured Products Section */}
      <ProductSection
        badge="REKOMENDASI TOKO"
        title="Koleksi Unggulan USKI"
        subtitle="Kurasi buku sastra, kitab fikih pesantren, dan stationery esensial"
        products={featuredProducts}
        viewAllLink="/products?filter=featured"
      />

      {/* New Arrivals Section */}
      <ProductSection
        badge="RILISAN TERBARU"
        title="Produk Terbaru Minggu Ini"
        subtitle="Buku pelajaran kurikulum terbaru dan perlengkapan sekolah terkini"
        products={newArrivals}
        viewAllLink="/products?filter=new"
      />
    </div>
  );
};
