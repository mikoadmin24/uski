import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  Building,
  MapPin,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { PaymentMethod, Address, OrderItem } from '@/types';
import { formatRupiah, generateOrderNumber } from '@/lib/utils';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscount, clearCart, appliedVoucher } = useCartStore();
  const { user, addresses } = useAuthStore();
  const { createOrder } = useOrderStore();
  const { adjustStock } = useProductStore();

  // Contact info
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone_number || '081298765432');

  // Address
  const primaryAddress = addresses.find((a) => a.is_primary) || addresses[0];
  const [streetAddress, setStreetAddress] = useState(primaryAddress?.street_address || 'Jl. Margonda Raya No. 102');
  const [district, setDistrict] = useState(primaryAddress?.district || 'Beji');
  const [city, setCity] = useState(primaryAddress?.city || 'Kota Depok');
  const [province, setProvince] = useState(primaryAddress?.province || 'Jawa Barat');
  const [postalCode, setPostalCode] = useState(primaryAddress?.postal_code || '16424');
  const [notes, setNotes] = useState('');

  // Shipping & Payment selection
  const [shippingMethod, setShippingMethod] = useState<{ id: string; name: string; fee: number }>({
    id: 'toko',
    name: 'Kurir Toko USKI (Pengantaran Langsung dari Toko)',
    fee: 10000,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('manual_qris');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const totalAmount = Math.max(0, subtotal - discount + shippingMethod.fee);

  if (items.length === 0) {
    return (
      <div className="max-w-site mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-extrabold text-[#101519]">Keranjang Belanja Anda Kosong</h2>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim() || !customerPhone.trim() || !streetAddress.trim() || !city.trim()) {
      setErrorMessage('Harap lengkapi semua data kontak dan alamat pengiriman.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Prepare Order Items
      const orderItems: OrderItem[] = items.map((item) => ({
        id: `oi-${Date.now()}-${Math.random()}`,
        order_id: '',
        product_id: item.product.id,
        product_name: item.product.name,
        variant_name: item.variant?.name,
        sku: item.variant?.sku || item.product.sku_master,
        price: item.selected_price,
        quantity: item.quantity,
        subtotal: item.selected_price * item.quantity,
        image_url: item.product.images[0],
      }));

      // 2. Shipping Address Object
      const orderAddress: Address = {
        id: `addr-ord-${Date.now()}`,
        user_id: user?.id || 'guest',
        recipient_name: customerName,
        phone_number: customerPhone,
        street_address: streetAddress,
        district,
        city,
        province,
        postal_code: postalCode,
        is_primary: true,
      };

      const orderNumber = generateOrderNumber();

      // 3. Atomically decrement inventory
      items.forEach((item) => {
        adjustStock(
          item.product.id,
          item.variant?.id,
          -item.quantity,
          'sale_out',
          `Pengurangan stok untuk pesanan ${orderNumber}`,
          customerName
        );
      });

      // 4. Create authoritative order in store
      const newOrder = createOrder({
        order_number: orderNumber,
        customer_id: user?.id,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        items: orderItems,
        subtotal,
        discount_amount: discount,
        shipping_fee: shippingMethod.fee,
        total_amount: totalAmount,
        voucher_code: appliedVoucher?.code,
        status: 'awaiting_payment',
        payment_method: paymentMethod,
        payment_status: 'pending',
        shipping_method: shippingMethod.name,
        shipping_address: orderAddress,
        notes,
      });

      // 5. Clear cart
      clearCart();

      // 6. Navigate to confirmation & payment instruction
      navigate(`/order-confirmation/${newOrder.order_number}`);
    } catch {
      setErrorMessage('Terjadi kendala saat memproses pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-site mx-auto px-4 py-6">
      <div className="pb-6 border-b border-hairline">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#101519]">
          Checkout & Pengiriman
        </h1>
        <p className="text-xs text-body mt-1">
          Lengkapi detail alamat dan pilih metode pembayaran untuk menyelesaikan pesanan Anda
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Form: Details, Shipping & Payment (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Customer Contact */}
          <div className="bg-white border border-hairline rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
              Informasi Kontak Pelanggan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp / HP Aktif *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-body block mb-1">Alamat Email (Untuk Bukti Tagihan / Invoice)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white border border-hairline rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
              Alamat Pengiriman Barang
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Alamat Lengkap / Nama Jalan & Nomor Rumah *</label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Contoh: Jl. Margonda Raya No. 102, RT 02/05, Patokan dekat Masjid"
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-body block mb-1">Kecamatan *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Kota / Kab *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Provinsi *</label>
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Catatan Tambahan untuk Kurir / Toko (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titipkan di satpam jika tidak ada orang di rumah"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 3. Shipping Method Selector */}
          <div className="bg-white border border-hairline rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
              Pilihan Jasa Ekspedisi & Logistik
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { id: 'toko', name: 'Kurir Toko USKI (Pengantaran Langsung dari Toko)', fee: 10000 },
                { id: 'jnt', name: 'J&T Express Reguler (2-3 Hari)', fee: 14000 },
                { id: 'sicepat', name: 'SiCepat Reguler (1-2 Hari)', fee: 16000 },
                { id: 'cargo', name: 'Kargo Sentral (Hemat untuk Buku & ATK Berat)', fee: 28000 },
                { id: 'pickup', name: 'Ambil Sendiri di Toko USKI STORE (Gratis)', fee: 0 },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setShippingMethod(opt)}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    shippingMethod.id === opt.id
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                      : 'border-hairline bg-white hover:border-body'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-bold text-[#101519] block">{opt.name}</span>
                      <span className="text-body text-[11px]">{opt.fee === 0 ? 'Bebas Ongkir' : formatRupiah(opt.fee)}</span>
                    </div>
                  </div>
                  {shippingMethod.id === opt.id && <Check className="w-4 h-4 text-primary" />}
                </label>
              ))}
            </div>
          </div>

          {/* 4. Payment Method Selector */}
          <div className="bg-white border border-hairline rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
              Metode Pembayaran Resmi
            </h3>

            <div className="space-y-3 text-xs">
              {/* QRIS */}
              <label
                onClick={() => setPaymentMethod('manual_qris')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'manual_qris'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-hairline hover:border-body'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block text-sm">QRIS Instant (Rekomendasi)</span>
                    <span className="text-body text-[11px]">Bisa scan via BCA, GoPay, OVO, Dana, ShopeePay, LinkAja</span>
                  </div>
                </div>
                {paymentMethod === 'manual_qris' && <Check className="w-4 h-4 text-primary" />}
              </label>

              {/* Bank Transfer */}
              <label
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-hairline hover:border-body'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block text-sm">Transfer Bank Manual</span>
                    <span className="text-body text-[11px]">Rekening resmi BCA, Mandiri, BSI, BRI dengan verifikasi bukti bayar</span>
                  </div>
                </div>
                {paymentMethod === 'bank_transfer' && <Check className="w-4 h-4 text-primary" />}
              </label>

              {/* Midtrans Gateway */}
              <label
                onClick={() => setPaymentMethod('midtrans_va')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'midtrans_va'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-hairline hover:border-body'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block text-sm">Payment Gateway (Midtrans)</span>
                    <span className="text-body text-[11px]">Virtual Account otomatis verifikasi & Kartu Kredit</span>
                  </div>
                </div>
                {paymentMethod === 'midtrans_va' && <Check className="w-4 h-4 text-primary" />}
              </label>

              {/* COD */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-hairline hover:border-body'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block text-sm">Bayar di Tempat (COD)</span>
                    <span className="text-body text-[11px]">Bayar tunai langsung saat barang diterima oleh kurir</span>
                  </div>
                </div>
                {paymentMethod === 'cod' && <Check className="w-4 h-4 text-primary" />}
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sticky Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-hairline rounded-3xl p-6 space-y-6 sticky top-24">
            <h3 className="text-base font-extrabold text-[#101519] border-b border-hairline pb-3">
              Rincian Pembayaran
            </h3>

            {/* Cart Items Recap */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.id} className="flex gap-2.5 items-center text-xs">
                  <img
                    src={it.product.images[0]}
                    alt={it.product.name}
                    className="w-10 h-12 object-cover rounded-lg border border-hairline shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#101519] truncate">{it.product.name}</p>
                    <p className="text-body text-[10px]">
                      {it.quantity} x {formatRupiah(it.selected_price)}
                    </p>
                  </div>
                  <span className="font-extrabold text-[#101519] shrink-0">
                    {formatRupiah(it.selected_price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs border-t border-hairline pt-4">
              <div className="flex justify-between text-body">
                <span>Subtotal ({items.length} Item)</span>
                <span className="font-bold text-[#101519]">{formatRupiah(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon Kupon ({appliedVoucher?.code})</span>
                  <span className="font-bold">- {formatRupiah(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-body">
                <span>Ongkos Kirim ({shippingMethod.name})</span>
                <span className="font-bold text-[#101519]">{formatRupiah(shippingMethod.fee)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t border-hairline pt-4 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-[#101519]">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-primary">{formatRupiah(totalAmount)}</span>
            </div>

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Buat Pesanan & Bayar'}</span>
            </button>

            <div className="text-[11px] text-body text-center space-y-1">
              <p className="flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Transaksi Terenkripsi & Terlindungi Server</span>
              </p>
              <p>Nomor pesanan resmi akan diterbitkan setelah konfirmasi.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
