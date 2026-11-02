import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Check,
  ShieldCheck,
  Truck,
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingCart,
  ChevronRight,
  Package,
  X,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { formatRupiah } from '@/lib/utils';
import { ProductCard } from '@/components/common/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getProductBySlug, products } = useProductStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const product = getProductBySlug(slug || '');

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [addedToast, setAddedToast] = useState<boolean>(false);

  // Reviews state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [customerReviews, setCustomerReviews] = useState<{ name: string; rating: number; comment: string; date: string }[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewComment) return;

    setCustomerReviews([
      {
        name: reviewerName,
        rating: newRating,
        comment: reviewComment,
        date: 'Baru saja',
      },
      ...customerReviews,
    ]);

    setShowReviewModal(false);
    setReviewerName('');
    setReviewComment('');
    setNewRating(5);
  };

  // Set initial image
  React.useEffect(() => {
    if (product?.images && product.images.length > 0) {
      setSelectedImage(product.images[0]);
    }
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-site mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-[#101519]">Produk Tidak Ditemukan</h2>
        <p className="text-body text-sm">Produk yang Anda cari mungkin sudah dipindahkan atau dihapus.</p>
        <Link
          to="/products"
          className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  // Selected variant computation
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const currentPrice = selectedVariant?.price_override ?? (product.sale_price ?? product.base_price);
  const maxStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const hasDiscount = Boolean(product.sale_price && product.sale_price < product.base_price);
  const discountPercentage = product.discount_percentage ?? (
    hasDiscount && product.base_price > 0
      ? Math.round(((product.base_price - (product.sale_price || product.base_price)) / product.base_price) * 100)
      : undefined
  );

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant);
    navigate('/checkout');
  };

  const relatedProducts = products
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-site mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-body mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap touch-scroll no-scrollbar">
        <Link to="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to="/products" className="hover:text-primary">Katalog</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[#101519] font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-8">
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/5] bg-neutral-2 rounded-2xl overflow-hidden border border-hairline relative">
            <img
              src={selectedImage || product.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && discountPercentage && (
              <span className="absolute top-3 left-3 bg-[#F8E7E9] text-[#B91126] text-xs font-extrabold px-2 py-0.5 rounded shadow-sm">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {Boolean(product?.images && product.images.length > 1) && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img ? 'border-primary shadow-sm' : 'border-hairline opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Purchase Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            {/* Author / Brand & Category */}
            <div className="flex items-center justify-between text-xs text-body">
              <span className="font-semibold text-primary">
                {product.author ? `Penulis: ${product.author}` : product.brand ? `Merek: ${product.brand.name}` : 'USKI Store'}
              </span>
              <div className="flex items-center gap-2">
                <button title="Wishlist" className="p-1 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <button title="Share" className="p-1 hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#101519] leading-tight">
              {product.name}
            </h1>

            {/* Rating & Identifiers */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-body pt-1 border-b border-hairline pb-3">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{(Number(product.rating) || 5.0).toFixed(1)}</span>
                <span className="text-body font-normal">({product.reviews_count ?? 0} ulasan)</span>
              </div>
              <span>•</span>
              <span>Terjual {product.sales_count ?? 0}</span>
              <span>•</span>
              <span className="font-mono text-[11px]">SKU: {selectedVariant?.sku || product.sku_master}</span>
              {product.isbn && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">ISBN: {product.isbn}</span>
                </>
              )}
            </div>

            {/* Price block */}
            <div className="py-2 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary">
                {formatRupiah(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-body line-through">
                  {formatRupiah(product.base_price)}
                </span>
              )}
            </div>

            {/* Variant Selector if available */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-body block">
                  Pilihan Varian:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-hairline bg-white text-[#2D3033] hover:border-body'
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 pt-3">
              <label className="text-xs font-bold uppercase tracking-wider text-body block">
                Jumlah Pembelian:
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-hairline rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center hover:bg-neutral-2 text-body disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-[#101519]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className="w-9 h-9 flex items-center justify-center hover:bg-neutral-2 text-body disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-body">
                  <span>Tersedia: </span>
                  <span className="font-bold text-[#101519]">{maxStock} pcs</span>
                </div>
              </div>
            </div>

            {/* Notification alert on added */}
            {addedToast && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-green-600" />
                <span>Berhasil ditambahkan ke keranjang belanja!</span>
              </div>
            )}

            {/* CTAs */}
            <div className="pt-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={maxStock === 0}
                  className="flex-1 h-12 border-2 border-primary text-primary hover:bg-primary/5 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Keranjang</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={maxStock === 0}
                  className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <span>Beli Sekarang</span>
                </button>
              </div>
            </div>

            {/* Bulk RFQ prompt */}
            <div className="p-3 bg-neutral-2 rounded-xl text-xs text-body flex items-center justify-between mt-2">
              <span>Butuh produk ini dalam jumlah banyak atau request edisi khusus?</span>
              <Link to="/bulk-order" className="font-bold text-primary hover:underline shrink-0 ml-2">
                Pesan Request Kustom
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="pt-4 border-t border-hairline grid grid-cols-2 gap-3 text-xs text-body">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Garansi 100% Produk Original</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary shrink-0" />
              <span>Bisa Dikirim Kargo / Ekspedisi Cepat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specs, Reviews */}
      <div className="mt-8 bg-white border border-hairline rounded-3xl p-6 sm:p-8">
        <div className="flex border-b border-hairline gap-8 text-sm font-bold">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'desc'
                ? 'border-primary text-primary'
                : 'border-transparent text-body hover:text-[#101519]'
            }`}
          >
            Deskripsi Produk
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'specs'
                ? 'border-primary text-primary'
                : 'border-transparent text-body hover:text-[#101519]'
            }`}
          >
            Spesifikasi Teknis
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-body hover:text-[#101519]'
            }`}
          >
            Ulasan Pembeli ({product.reviews_count})
          </button>
        </div>

        <div className="pt-6">
          {activeTab === 'desc' && (
            <div className="text-sm text-[#2D3033] leading-relaxed space-y-4 max-w-3xl">
              <p>{product.description}</p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-xl">
              <table className="w-full text-xs sm:text-sm">
                <tbody>
                  {Object.entries(product.specifications || {}).map(([key, value]) => (
                    <tr key={key} className="border-b border-hairline last:border-none">
                      <td className="py-2.5 font-bold text-body w-40">{key}</td>
                      <td className="py-2.5 text-[#101519]">{value}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-hairline">
                    <td className="py-2.5 font-bold text-body">Berat Kemasan</td>
                    <td className="py-2.5 text-[#101519]">{product.weight_grams} gram</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-neutral-2/60 rounded-2xl border border-hairline">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-extrabold text-primary">
                    {(Number(product.rating) || 5.0).toFixed(1)}
                  </div>
                  <div className="text-xs text-body">
                    <div className="flex gap-0.5 text-amber-500 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span>Berdasarkan {(product.reviews_count ?? 0) + customerReviews.length} ulasan terverifikasi pembeli</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all self-start sm:self-center"
                >
                  + Tulis Ulasan Pembeli
                </button>
              </div>

              {/* Review List */}
              <div className="space-y-3">
                {customerReviews.map((rev, idx) => (
                  <div key={idx} className="border border-hairline rounded-2xl p-4 space-y-1.5 bg-white">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#101519]">{rev.name} (Pembeli Terverifikasi)</span>
                      <span className="text-body text-[11px]">{rev.date}</span>
                    </div>
                    <div className="flex gap-0.5 text-amber-500 text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-[#2D3033] leading-relaxed">{rev.comment}</p>
                  </div>
                ))}

                <div className="border border-hairline rounded-2xl p-4 space-y-1.5 bg-white">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#101519]">M. Rizky (Pembeli Terverifikasi)</span>
                    <span className="text-body text-[11px]">2 hari yang lalu</span>
                  </div>
                  <div className="flex gap-0.5 text-amber-500 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-[#2D3033]">
                    Kualitas barang sangat bagus, original, packing rapi menggunakan bubble wrap tebal. Pengiriman cepat sampai.
                  </p>
                </div>
              </div>

              {/* Review Modal */}
              {showReviewModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                      <h3 className="font-extrabold text-sm text-[#101519]">Tulis Ulasan untuk {product.name}</h3>
                      <button onClick={() => setShowReviewModal(false)} className="p-1 rounded-lg hover:bg-neutral-2 text-body">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="font-bold text-body block mb-1.5">Rating Bintang</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewRating(star)}
                              className="p-1 transition-transform"
                            >
                              <Star className={`w-6 h-6 ${star <= newRating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-neutral-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-body block mb-1">Nama Pembeli *</label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="Nama lengkap atau inisial"
                          className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-body block mb-1">Ulasan & Kesan *</label>
                        <textarea
                          rows={3}
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Bagikan pengalaman Anda tentang kualitas buku/ATK ini..."
                          className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewModal(false)}
                          className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark"
                        >
                          Kirim Ulasan
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-extrabold text-[#101519]">Produk Terkait Lainnya</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Native Sticky Action Bar (Gramedia / E-commerce App Style for iPhone & Android) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-hairline/80 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-body font-semibold leading-tight">Total Belanja</p>
            <p className="text-base font-extrabold text-primary truncate leading-tight">
              {formatRupiah(currentPrice * quantity)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={maxStock === 0}
            className="px-3.5 h-11 border-2 border-primary text-primary hover:bg-primary/5 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Keranjang</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={maxStock === 0}
            className="flex-1 h-11 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            <span>Beli Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
