import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const addToCart = useCartStore((state) => state.addToCart);

  const displayPrice = product.sale_price ?? product.base_price;
  const hasDiscount = Boolean(product.sale_price && product.sale_price < product.base_price);
  const discountPercentage = product.discount_percentage ?? (
    hasDiscount && product.base_price > 0
      ? Math.round(((product.base_price - (product.sale_price || product.base_price)) / product.base_price) * 100)
      : undefined
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="w-[160px] sm:w-[190px] h-[310px] sm:h-[330px] bg-white border border-hairline rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-primary transition-all duration-200 shrink-0 relative">
      <Link to={`/products/${product.slug}`} className="flex flex-col h-full">
        {/* Product Image (Edge to Edge) */}
        <div className="relative w-full h-[160px] sm:h-[180px] bg-neutral-2 overflow-hidden shrink-0">
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Discount Badge */}
          {hasDiscount && discountPercentage && (
            <div className="absolute top-2 left-2 bg-[#F8E7E9] text-[#B91126] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              {discountPercentage}% OFF
            </div>
          )}

          {/* Stock Indicator if Low */}
          {product.stock_quantity <= product.min_stock_alert && product.stock_quantity > 0 && (
            <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              Sisa {product.stock_quantity}
            </div>
          )}

          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
              Stok Habis
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
          <div>
            {/* Author or Brand */}
            <p className="text-[11px] font-medium text-body truncate">
              {product.author || product.brand?.name || 'USKI Store'}
            </p>

            {/* Title */}
            <h3 className="text-xs sm:text-sm font-bold text-[#101519] line-clamp-2 leading-snug mt-0.5 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="pt-2">
            {/* Price section */}
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold text-[#0060AE]">
                {formatRupiah(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-body line-through -mt-0.5">
                  {formatRupiah(product.base_price)}
                </span>
              )}
            </div>

            {/* Rating and Sales */}
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-body">
              <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                <Star className="w-3 h-3 fill-amber-500" />
                <span>{(Number(product.rating) || 5.0).toFixed(1)}</span>
              </div>
              <span>Terjual {product.sales_count ?? 0}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Add Button */}
      {product.stock_quantity > 0 && (
        <button
          onClick={handleQuickAdd}
          title="Tambah ke Keranjang"
          className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-white border border-hairline hover:bg-primary hover:text-white hover:border-primary text-primary flex items-center justify-center transition-all shadow-sm opacity-90 group-hover:opacity-100"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
