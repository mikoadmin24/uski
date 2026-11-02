import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ProductCard } from '@/components/common/ProductCard';
import { ArrowRight } from 'lucide-react';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  badge?: string;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  subtitle,
  products,
  viewAllLink,
  badge,
}) => {
  if (products.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 border-b border-hairline last:border-none">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          {badge && (
            <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded mb-1">
              {badge}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101519]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-body mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Product Cards Row (Scrollable on mobile, fluid grid on desktop) */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible touch-scroll">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-[155px] sm:w-auto shrink-0 sm:shrink" />
        ))}
      </div>
    </section>
  );
};
