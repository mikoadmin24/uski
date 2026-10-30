import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductSection } from '@/components/home/ProductSection';
import { BulkOrderBanner } from '@/components/home/BulkOrderBanner';
import { useProductStore } from '@/store/productStore';

export const HomePage: React.FC = () => {
  const { products } = useProductStore();

  const featuredProducts = products.filter((p) => p.is_featured);
  const bestSellers = products.filter((p) => p.is_best_seller);
  const newArrivals = products.filter((p) => p.is_new_arrival);
  const discountProducts = products.filter((p) => Boolean(p.sale_price && p.sale_price < p.base_price));

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
