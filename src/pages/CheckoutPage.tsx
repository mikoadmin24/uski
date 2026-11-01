import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  QrCode,
  Building,
  Check,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Scale,
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

  // 1. Logika Berat & Ongkos Kirim Otomatis (Rp 10.000 per 1 kg)
  const totalWeightGrams = items.reduce((acc, it) => acc + (it.product.weight_grams || 350) * it.quantity, 0);
  const totalWeightKg = Math.max(1, Math.ceil(totalWeightGrams / 1000));
  const kurirTokoOngkir = totalWeightKg * 10000;

  // Hanya 2 Opsi Jasa Kirim: Kurir Toko USKI vs Ambil Sendiri di Toko
  const [shippingType, setShippingType] = useState<'toko' | 'pickup'>('toko');

  const activeShippingFee = shippingType === 'toko' ? kurirTokoOngkir : 0;
  const activeShippingName = shippingType === 'toko'
    ? `Kurir Toko USKI (${totalWeightKg} kg × Rp 10.000/kg)`
    : 'Ambil Sendiri di Toko USKI STORE (Gratis)';

  // Direct Indonesian Payment Method (No External Payment Gateway)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('manual_qris');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const totalAmount = Math.max(0, subtotal - discount + activeShippingFee);

  if (items.length === 0) {
    return (
      <div className="max-w-site mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-neutral-2 rounded-2xl flex items-center justify-center mx-auto text-body">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-[#101519]">Keranjang Belanja Anda Kosong</h2>
        <p className="text-xs text-body">Silakan pilih buku, kitab, atau ATK dari katalog terlebih dahulu.</p>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm">
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
      setErrorMessage('Harap lengkapi nama, nomor WhatsApp aktif, dan alamat pengiriman.');
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
        shipping_fee: activeShippingFee,
        total_amount: totalAmount,
        voucher_code: appliedVoucher?.code,
        status: 'awaiting_payment',
        payment_method: paymentMethod,
        payment_status: 'pending',
        shipping_method: activeShippingName,
        shipping_address: orderAddress,
        notes,
      });

      // 5. Generate formatted WhatsApp message
      const paymentMethodLabels: Record<string, string> = {
        manual_qris: 'QRIS Instant (BCA / GoPay / OVO / Dana / ShopeePay / LinkAja)',
        bank_transfer: 'Transfer Bank Manual (BCA / BSI / Mandiri)',
        cod: 'Bayar di Tempat (COD Tunai)',
      };

      const waText = 
`*KONFIRMASI PESANAN - USKI STORE*
Halo Admin USKI Store, saya ingin konfirmasi pesanan baru:

*No. Pesanan:* ${orderNumber}
*Nama Pemesan:* ${customerName}
*No. WhatsApp:* ${customerPhone}
*Alamat Kirim:* ${streetAddress}, Kec. ${district}, ${city}, ${province} ${postalCode ? `(${postalCode})` : ''}
${notes ? `*Catatan Khusus:* ${notes}\n` : ''}
*Daftar Produk:*
${orderItems.map((it, idx) => `${idx + 1}. ${it.product_name}${it.variant_name ? ` (${it.variant_name})` : ''} x${it.quantity} = ${formatRupiah(it.subtotal)}`).join('\n')}

----------------------------------
*Subtotal Produk:* ${formatRupiah(subtotal)}
${discount > 0 ? `*Diskon Kupon (${appliedVoucher?.code}):* -${formatRupiah(discount)}\n` : ''}*Ongkos Kirim:* ${formatRupiah(activeShippingFee)} (${activeShippingName})
*TOTAL TAGIHAN:* ${formatRupiah(totalAmount)}
*Metode Bayar:* ${paymentMethodLabels[paymentMethod] || paymentMethod}
----------------------------------
Mohon segera diproses ya kak. Terima kasih!`;

      const targetWaNumber = '6285967249718';
      const waUrl = `https://wa.me/${targetWaNumber}?text=${encodeURIComponent(waText)}`;

      // 6. Clear Cart
      clearCart();

      // 7. Open WhatsApp directly and navigate to Order Confirmation
      try {
        window.open(waUrl, '_blank');
      } catch {
        // Pop-up blocked fallback
      }

      navigate(`/order-confirmation/${newOrder.order_number}`);
    } catch {
      setErrorMessage('Terjadi kendala saat memproses pesanan. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-site mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 lg:pb-10">
      {/* Page Header */}
      <div className="pb-4 sm:pb-6 border-b border-hairline">
        <div className="flex items-center gap-2 text-xs text-body mb-1">
          <Link to="/cart" className="hover:text-primary transition-colors">Keranjang</Link>
          <ArrowRight className="w-3 h-3 text-hairline" />
          <span className="font-bold text-[#101519]">Checkout Langsung</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101519]">
          Pemesanan & Alamat Pengiriman
        </h1>
        <p className="text-xs text-body mt-0.5">
          Pesanan diteruskan langsung ke WhatsApp CS resmi USKI Store untuk diproses tanpa ribet
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left Form: Details, Shipping & Payment (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* 1. Customer Contact */}
          <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
              Informasi Pemesan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp / HP Aktif *</label>
                <input
                  type="tel"
                  required
                  placeholder="08xxxxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-body block mb-1">Alamat Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
              Alamat Lengkap Pengiriman
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Alamat Jalan / Gedung / Patokan Rumah *</label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Contoh: Jl. Margonda Raya No. 102, RT 02/05, dekat Masjid Al-Falah"
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold text-[#101519] focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                <label className="font-bold text-body block mb-1">Catatan Tambahan untuk Toko (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titipkan di pos satpam bila tidak ada orang"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 3. Shipping Method Selector: Hanya Kurir Toko & Ambil Sendiri */}
          <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                Pilihan Pengiriman
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <Scale className="w-3.5 h-3.5" />
                <span>
                  Berat Paket: {totalWeightGrams >= 1000 ? `${(totalWeightGrams / 1000).toFixed(1)} kg (${totalWeightKg} kg)` : `${totalWeightGrams} gram (Dihitung 1 kg)`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Pilihan A: Kurir Toko USKI */}
              <label
                onClick={() => setShippingType('toko')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all min-h-[58px] touch-manipulation ${
                  shippingType === 'toko'
                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary shadow-xs'
                    : 'border-hairline bg-white hover:border-body'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block text-xs sm:text-sm">Kurir Toko USKI</span>
                    <span className="text-body text-[11px] block">Tarif otomatis: Rp 10.000 / kg</span>
                    <span className="font-extrabold text-primary text-xs mt-0.5 block">{formatRupiah(kurirTokoOngkir)} ({totalWeightKg} kg)</span>
                  </div>
                </div>
                {shippingType === 'toko' && <Check className="w-4 h-4 text-primary shrink-0" />}
              </label>

              {/* Pilihan B: Ambil Sendiri di Toko */}
              <label
                onClick={() => setShippingType('pickup')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all min-h-[58px] touch-manipulation ${
                  shippingType === 'pickup'
                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary shadow-xs'
                    : 'border-hairline bg-white hover:border-body'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block text-xs sm:text-sm">Ambil Sendiri di Toko</span>
                    <span className="text-body text-[11px] block">Datang langsung ke toko USKI STORE</span>
                    <span className="font-extrabold text-emerald-600 text-xs mt-0.5 block">Gratis (Bebas Ongkir)</span>
                  </div>
                </div>
                {shippingType === 'pickup' && <Check className="w-4 h-4 text-primary shrink-0" />}
              </label>
            </div>
          </div>

          {/* 4. Payment Method Selector */}
          <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#101519] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
                Pilihan Cara Pembayaran
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                Langsung via WA
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* QRIS */}
              <label
                onClick={() => setPaymentMethod('manual_qris')}
                className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all min-h-[52px] touch-manipulation ${
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
                    <span className="font-bold text-[#101519] block text-xs sm:text-sm">QRIS Instant (BCA / E-Wallet)</span>
                    <span className="text-body text-[11px]">Scan praktis via BCA Mobile, GoPay, OVO, Dana, ShopeePay</span>
                  </div>
                </div>
                {paymentMethod === 'manual_qris' && <Check className="w-4 h-4 text-primary shrink-0" />}
              </label>

              {/* Bank Transfer */}
              <label
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all min-h-[52px] touch-manipulation ${
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
                    <span className="font-bold text-[#101519] block text-xs sm:text-sm">Transfer Rekening Bank Toko</span>
                    <span className="text-body text-[11px]">Rekening resmi BCA, Mandiri, atau BSI USKI Store</span>
                  </div>
                </div>
                {paymentMethod === 'bank_transfer' && <Check className="w-4 h-4 text-primary shrink-0" />}
              </label>

              {/* COD */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all min-h-[52px] touch-manipulation ${
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
                    <span className="font-bold text-[#101519] block text-xs sm:text-sm">Bayar di Tempat (COD Tunai)</span>
                    <span className="text-body text-[11px]">Serahkan uang pas langsung saat pesanan diantarkan ke alamat</span>
                  </div>
                </div>
                {paymentMethod === 'cod' && <Check className="w-4 h-4 text-primary shrink-0" />}
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sticky Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-5 sticky top-24 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#101519] border-b border-hairline pb-3">
              Ringkasan Pesanan ({items.length} Macam)
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
                <span>Subtotal Produk</span>
                <span className="font-bold text-[#101519]">{formatRupiah(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Kupon ({appliedVoucher?.code})</span>
                  <span className="font-bold">- {formatRupiah(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-body">
                <span>Ongkos Kirim ({activeShippingName})</span>
                <span className="font-bold text-[#101519]">
                  {activeShippingFee === 0 ? 'Gratis' : formatRupiah(activeShippingFee)}
                </span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="border-t border-hairline pt-4 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-[#101519]">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-primary">{formatRupiah(totalAmount)}</span>
            </div>

            {/* Submit Order Button (Desktop/Tablet) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 touch-manipulation"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Pesan Sekarang via WhatsApp'}</span>
            </button>

            <div className="text-[11px] text-body text-center space-y-1">
              <p className="flex items-center justify-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Langsung Chat Admin • Bebas Biaya Admin</span>
              </p>
              <p className="text-[10px] text-body">
                Sistem akan membuat nomor order resmi dan langsung membuka WhatsApp dengan rincian yang harus dibayarkan.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Floating Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-hairline p-3 z-40 shadow-xl">
          <div className="flex items-center justify-between gap-3 max-w-site mx-auto">
            <div>
              <span className="text-[10px] text-body block">Total Bayar:</span>
              <span className="text-base font-extrabold text-primary">{formatRupiah(totalAmount)}</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm touch-manipulation disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>{isSubmitting ? 'Memproses...' : 'Pesan via WhatsApp'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
