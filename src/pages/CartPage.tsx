import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Check, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatRupiah } from '@/lib/utils';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    appliedVoucher,
    removeVoucher,
    getSubtotal,
    getDiscount,
    getTotal,
  } = useCartStore();

  const [voucherInput, setVoucherInput] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;

    const res = useCartStore.getState().applyVoucher(voucherInput);
    setVoucherMsg({ text: res.message, isError: !res.success });
    if (res.success) {
      setVoucherInput('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-site mx-auto px-4 py-16">
        <div className="bg-white border border-hairline rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 bg-neutral-2 rounded-full flex items-center justify-center mx-auto text-body">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-extrabold text-[#101519]">Keranjang Belanja Anda Kosong</h2>
          <p className="text-xs sm:text-sm text-body">
            Belum ada buku atau alat tulis yang ditambahkan ke keranjang belanja Anda.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm"
            >
              <span>Mulai Belanja Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-site mx-auto px-4 py-6">
      <div className="flex items-center justify-between pb-6 border-b border-hairline">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#101519]">
          Keranjang Belanja ({items.length} Item)
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-badge-text hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Kosongkan Keranjang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-hairline rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center justify-between shadow-xs"
            >
              {/* Product Thumbnail & Details */}
              <div className="flex gap-3 sm:gap-4 items-center flex-1 min-w-0">
                <img
                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                  alt={item.product.name}
                  className="w-14 h-18 sm:w-20 sm:h-24 object-cover rounded-xl border border-hairline shrink-0"
                />
                <div className="min-w-0 space-y-0.5 sm:space-y-1">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-body truncate">
                    {item.product.author || item.product.brand?.name || 'USKI Store'}
                  </p>
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="text-xs sm:text-sm font-bold text-[#101519] hover:text-primary transition-colors line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  {item.variant && (
                    <span className="inline-block px-1.5 py-0.5 bg-neutral-2 text-[9px] sm:text-[10px] font-bold text-body rounded">
                      Varian: {item.variant.name}
                    </span>
                  )}
                  <p className="text-xs sm:text-sm font-extrabold text-primary">
                    {formatRupiah(item.selected_price)}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Total (responsive layout on mobile) */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline/60">
                <div className="flex items-center border border-hairline rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-neutral-2 text-body"
                    aria-label="Kurang kuantitas"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#101519]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-neutral-2 text-body"
                    aria-label="Tambah kuantitas"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-0 text-right">
                  <span className="text-xs sm:text-sm font-extrabold text-[#101519] block">
                    {formatRupiah(item.selected_price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[11px] text-body hover:text-red-500 inline-block font-semibold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-hairline rounded-3xl p-6 space-y-6 sticky top-24">
            <h3 className="text-base font-extrabold text-[#101519] border-b border-hairline pb-3">
              Ringkasan Pesanan
            </h3>

            {/* Voucher input form */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Kupon / Kode Promo
              </label>

              {appliedVoucher ? (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-primary block">{appliedVoucher.code}</span>
                    <span className="text-body text-[11px]">{appliedVoucher.description}</span>
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Lepas
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Kode promo (e.g. HEMATATK)"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="flex-1 h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs uppercase font-bold focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-4 h-10 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all"
                  >
                    Pakai
                  </button>
                </form>
              )}

              {voucherMsg && (
                <p className={`text-[11px] flex items-center gap-1 mt-1 ${voucherMsg.isError ? 'text-red-500' : 'text-green-600'}`}>
                  {voucherMsg.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
                  {voucherMsg.text}
                </p>
              )}
            </div>

            {/* Summary lines */}
            <div className="space-y-2.5 text-xs sm:text-sm border-t border-hairline pt-4">
              <div className="flex justify-between text-body">
                <span>Subtotal Produk</span>
                <span className="font-bold text-[#101519]">{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon Kupon</span>
                  <span className="font-bold">- {formatRupiah(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-body">
                <span>Ongkos Kirim</span>
                <span className="italic text-[11px]">Dihitung saat checkout</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t border-hairline pt-4 flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#101519]">Total Estimasi</span>
              <span className="text-xl font-extrabold text-primary">{formatRupiah(total)}</span>
            </div>

            {/* Proceed to Checkout CTA */}
            <div className="space-y-2">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Lanjut ke Checkout Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-body text-center">
              Perhitungan harga final dan stok diverifikasi langsung secara aman di server.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="lg:hidden fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-hairline px-4 py-2.5 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3 max-w-site mx-auto">
          <div>
            <span className="text-[10px] text-body block leading-tight">Total Belanja:</span>
            <span className="text-base font-extrabold text-primary leading-tight">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="flex-1 max-w-[200px] h-10 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
