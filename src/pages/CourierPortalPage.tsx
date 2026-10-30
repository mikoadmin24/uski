import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Camera,
  X,
  Truck,
  PackageCheck,
  XCircle,
  FileText,
  User,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCourierStore } from '@/store/courierStore';
import { useOrderStore } from '@/store/orderStore';
import { uploadFileToStorage } from '@/lib/supabase';
import { DigitalSignaturePad } from '@/components/courier/DigitalSignaturePad';

const FAILED_REASONS = [
  'Rumah Kosong / Penerima Tidak Ada di Lokasi',
  'Alamat Tidak Ditemukan / Tidak Jelas',
  'Penerima Menolak Menerima Paket',
  'Nomor HP Tidak Aktif / Tidak Bisa Dihubungi',
  'Kendala Cuaca Ekstrem / Banjir',
  'Kendaraan Mengalami Kerusakan Teknis / Mogok',
  'Permintaan Penerima Minta Jadwal Ulang',
];

export const CourierPortalPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    couriers,
    completeDelivery,
    updateDeliveryStatus,
    failDelivery,
  } = useCourierStore();
  const { orders } = useOrderStore();
  const navigate = useNavigate();

  // Find courier profile matching logged-in user or default to first courier
  const currentCourier =
    couriers.find((c) => c.email === user?.email || c.name.includes(user?.full_name || '')) ||
    couriers[0];

  // Complete delivery modal / form
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [recipientNameInput, setRecipientNameInput] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Failed delivery modal / form
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedReason, setFailedReason] = useState(FAILED_REASONS[0]);
  const [failedNotes, setFailedNotes] = useState('');
  const [isSubmittingFailed, setIsSubmittingFailed] = useState(false);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Ukuran file bukti maksimal 8MB.');
        return;
      }
      setSelectedProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourier.active_delivery) return;

    if (!proofPhotoPreview) {
      alert('Wajib mengunggah foto bukti serah terima paket!');
      return;
    }

    if (!signatureDataUrl) {
      alert('Penerima wajib membubuhkan tanda tangan digital pada kotak yang disediakan!');
      return;
    }

    setIsSubmittingDelivery(true);
    let finalProofUrl = proofPhotoPreview || '';
    let finalSignatureUrl = signatureDataUrl || '';

    // 1. Upload proof photo to bucket 'delivery-proofs' in subfolder 'proofs'
    if (selectedProofFile) {
      try {
        const cloudUrl = await uploadFileToStorage(selectedProofFile, 'delivery-proofs', 'proofs');
        if (cloudUrl) {
          finalProofUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('Upload proof photo to Supabase Storage failed, using local preview fallback', err);
      }
    } else if (proofPhotoPreview && proofPhotoPreview.startsWith('data:')) {
      try {
        const cloudUrl = await uploadFileToStorage(proofPhotoPreview, 'delivery-proofs', 'proofs');
        if (cloudUrl) {
          finalProofUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('Upload base64 proof photo to storage failed:', err);
      }
    }

    // 2. Upload digital signature to bucket 'delivery-proofs' in subfolder 'signatures'
    if (signatureDataUrl) {
      try {
        const sigUrl = await uploadFileToStorage(signatureDataUrl, 'delivery-proofs', 'signatures');
        if (sigUrl) {
          finalSignatureUrl = sigUrl;
        }
      } catch (err) {
        console.warn('Upload digital signature to Supabase Storage failed, using dataUrl fallback', err);
      }
    }

    completeDelivery(
      currentCourier.id,
      finalProofUrl,
      finalSignatureUrl,
      `${recipientNameInput ? `Diterima oleh: ${recipientNameInput}. ` : ''}${deliveryNotes}`
    );

    // Native haptic feedback for mobile devices (iPhone/Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setIsSubmittingDelivery(false);
    setShowCompleteModal(false);
    setProofPhotoPreview(null);
    setSignatureDataUrl(null);
    setSelectedProofFile(null);
    setRecipientNameInput('');
    setDeliveryNotes('');
    alert('Alhamdulillah! Status paket berhasil diselesaikan (DELIVERED) dengan bukti foto & tanda tangan.');
  };

  const handleFailDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourier.active_delivery) return;

    setIsSubmittingFailed(true);
    failDelivery(currentCourier.id, failedReason, failedNotes);

    setIsSubmittingFailed(false);
    setShowFailedModal(false);
    setFailedNotes('');
    alert(`Laporan gagal antar telah dicatat ke Admin: "${failedReason}". Status kurir kembali standby.`);
  };

  const activeDelivery = currentCourier.active_delivery;
  const deliveryStatus = activeDelivery?.status || 'assigned';

  // Find matching order in store to get items details
  const matchingOrder = activeDelivery
    ? orders.find(
        (o) =>
          o.id === activeDelivery.order_id ||
          o.order_number === activeDelivery.order_number
      )
    : null;

  return (
    <div className="min-h-[100dvh] bg-[#F4F6F8] font-urbanist text-[#101519] pb-[calc(3rem+env(safe-area-inset-bottom,0px))] touch-scroll">
      {/* Mobile Top Header Bar */}
      <header className="bg-white border-b border-hairline px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-[#101519] leading-tight">
                PORTAL KURIR TOKO USKI
              </h1>
              <p className="text-[11px] text-body">
                {currentCourier.name} • <span className="font-mono font-semibold">{currentCourier.vehicle_plate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/orders"
              className="px-2.5 py-1 bg-neutral-2 hover:bg-neutral-1 text-[#101519] rounded-lg text-[10px] font-bold border border-hairline"
            >
              Admin Pesanan
            </Link>
            <Link
              to="/"
              className="px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold"
            >
              Ke Toko
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* PROFIL KURIR & STATUS TUGAS (BERSIH TANPA KARTU GPS) */}
        <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-[#101519] text-sm">{currentCourier.name}</h2>
                <p className="text-xs text-body font-mono">{currentCourier.vehicle_plate}</p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeDelivery
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {activeDelivery ? 'Sedang Mengantar Paket' : 'Standby / Siap Antar'}
            </span>
          </div>

          <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs">
            <span className="text-body">Paket Sukses Hari Ini:</span>
            <strong className="text-emerald-700 font-bold">
              {currentCourier.total_delivered_today} Paket Terkirim
            </strong>
          </div>
        </div>

        {/* ACTIVE DELIVERY CARD WITH STEP-BY-STEP PROGRESSION */}
        {activeDelivery ? (
          <div className="bg-white border border-hairline rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-body">
                  Tugas Pengantaran Paket
                </span>
                <h2 className="text-base font-extrabold text-primary font-mono">
                  #{activeDelivery.order_number}
                </h2>
              </div>

              {/* Current Lifecycle Status Pill */}
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                  deliveryStatus === 'assigned'
                    ? 'bg-blue-100 text-blue-800'
                    : deliveryStatus === 'pickup'
                    ? 'bg-purple-100 text-purple-800'
                    : deliveryStatus === 'on_delivery'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {deliveryStatus === 'assigned' && '1. Menunggu Pickup'}
                {deliveryStatus === 'pickup' && '2. Sudah Di-Pickup'}
                {deliveryStatus === 'on_delivery' && '3. Dalam Perjalanan'}
                {deliveryStatus === 'delivered' && 'Selesai'}
              </span>
            </div>

            {/* Step-by-Step Delivery Tracker UI */}
            <div className="p-3 bg-neutral-2/40 rounded-2xl border border-hairline">
              <span className="text-[10px] font-bold text-body block mb-2 uppercase tracking-wider">
                Tahapan Pengantaran
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                <div
                  className={`p-2 rounded-xl transition-all ${
                    deliveryStatus === 'assigned' || deliveryStatus === 'pickup' || deliveryStatus === 'on_delivery'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-neutral-2 text-body'
                  }`}
                >
                  <span>1. Pickup Toko</span>
                </div>
                <div
                  className={`p-2 rounded-xl transition-all ${
                    deliveryStatus === 'pickup' || deliveryStatus === 'on_delivery'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-neutral-2 text-body'
                  }`}
                >
                  <span>2. Di Jalan</span>
                </div>
                <div
                  className={`p-2 rounded-xl transition-all ${
                    deliveryStatus === 'on_delivery'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-2 text-body'
                  }`}
                >
                  <span>3. Tiba & Serah</span>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2.5 text-xs bg-neutral-2/30 p-3.5 rounded-2xl border border-hairline">
              <div>
                <span className="text-body text-[11px] block">Nama Penerima:</span>
                <h3 className="text-sm font-extrabold text-[#101519]">
                  {activeDelivery.recipient_name}
                </h3>
              </div>

              <div>
                <span className="text-body text-[11px] block">Alamat Tujuan Pengantaran:</span>
                <p className="font-bold text-[#101519] leading-relaxed">
                  {activeDelivery.destination_address}
                </p>
              </div>

              {activeDelivery.delivery_notes && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Catatan Pesanan:</strong> {activeDelivery.delivery_notes}
                </div>
              )}
            </div>

            {/* Order Items Summary (if available) */}
            {matchingOrder && matchingOrder.items.length > 0 && (
              <div className="p-3 bg-neutral-2/30 rounded-2xl border border-hairline text-xs space-y-1.5">
                <span className="font-bold text-[#101519] flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  <span>Daftar Barang ({matchingOrder.items.length} Item):</span>
                </span>
                <ul className="divide-y divide-hairline">
                  {matchingOrder.items.map((it) => (
                    <li key={it.id} className="py-1.5 flex justify-between">
                      <span className="text-[#101519] truncate pr-2">{it.product_name}</span>
                      <strong className="text-body font-mono shrink-0">{it.quantity}x</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Actions (Maps & WA) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  activeDelivery.destination_address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-xs transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Buka Google Maps</span>
              </a>

              <a
                href={`https://wa.me/${activeDelivery.recipient_phone.replace(/[^0-9]/g, '')}?text=Halo%20kak%20${encodeURIComponent(
                  activeDelivery.recipient_name
                )},%20saya%20kurir%20toko%20USKI%20sedang%20mengantar%20paket%20Anda.`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-xs transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Pembeli</span>
              </a>
            </div>

            {/* ACTION BUTTONS BASED ON LIFECYCLE */}
            <div className="pt-2 space-y-2">
              {deliveryStatus === 'assigned' && (
                <button
                  type="button"
                  onClick={() => updateDeliveryStatus(currentCourier.id, 'pickup')}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>1. Ambil Paket di Toko (Pickup)</span>
                </button>
              )}

              {deliveryStatus === 'pickup' && (
                <button
                  type="button"
                  onClick={() => updateDeliveryStatus(currentCourier.id, 'on_delivery')}
                  className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  <span>2. Mulai Pengantaran ke Alamat</span>
                </button>
              )}

              {deliveryStatus === 'on_delivery' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(true)}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>3. Selesaikan & Foto Serah Terima</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFailedModal(true)}
                    className="w-full h-10 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Laporkan Gagal Antar / Jadwal Ulang</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-hairline rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-base text-[#101519]">
              Semua Pengantaran Selesai!
            </h3>
            <p className="text-xs text-body">
              Anda sedang standby di toko. Tugas pengantaran baru akan otomatis muncul di layar ini begitu ditugaskan oleh admin.
            </p>
          </div>
        )}

        {/* Courier Summary Card */}
        <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs text-xs space-y-2">
          <div className="flex justify-between items-center text-body">
            <span>Status Kurir:</span>
            <strong className="text-[#101519]">
              {activeDelivery ? 'Sedang Bertugas' : 'Siap Bertugas'}
            </strong>
          </div>
          <div className="flex justify-between items-center text-body">
            <span>Selesai Diantar Hari Ini:</span>
            <strong className="text-emerald-700">
              {currentCourier.total_delivered_today} Paket
            </strong>
          </div>
        </div>
      </main>

      {/* COMPLETE DELIVERY MODAL WITH PHOTO AND SIGNATURE PAD */}
      {showCompleteModal && activeDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#101519]">
                  Konfirmasi Serah Terima Paket
                </h3>
                <p className="text-[11px] text-body">
                  Pesanan #{activeDelivery.order_number} • {activeDelivery.recipient_name}
                </p>
              </div>
              <button onClick={() => setShowCompleteModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleFinishDelivery} className="space-y-4 text-xs">
              {/* Photo Proof */}
              <div>
                <label className="font-bold text-body block mb-1">
                  1. Foto Bukti Serah Terima Paket (Wajib) *
                </label>
                {proofPhotoPreview ? (
                  <div className="relative border border-hairline rounded-2xl overflow-hidden mb-2">
                    <img
                      src={proofPhotoPreview}
                      alt="Bukti Serah Terima"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProofPhotoPreview(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-5 cursor-pointer bg-neutral-2/40 hover:bg-neutral-2/80 transition-all text-center">
                    <Camera className="w-7 h-7 text-primary mb-1" />
                    <span className="font-bold text-xs text-[#101519]">
                      Ambil Foto / Pilih dari Galeri HP
                    </span>
                    <span className="text-[10px] text-body mt-0.5">
                      Foto paket diterima atau foto depan rumah pembeli
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Digital Signature Pad */}
              <div>
                <label className="font-bold text-body block mb-1">
                  2. Tanda Tangan Digital Penerima (Wajib) *
                </label>
                <DigitalSignaturePad onSignatureChange={setSignatureDataUrl} height={130} />
              </div>

              {/* Recipient Name */}
              <div>
                <label className="font-bold text-body block mb-1">
                  3. Nama Penerima Paket *
                </label>
                <input
                  type="text"
                  required
                  value={recipientNameInput}
                  onChange={(e) => setRecipientNameInput(e.target.value)}
                  placeholder="Contoh: Diterima langsung oleh Kak Budi (Ybs)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              {/* Additional Delivery Notes */}
              <div>
                <label className="font-bold text-body block mb-1">
                  4. Catatan Serah Terima (Opsional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Contoh: Paket diletakkan di teras atas izin pembeli"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDelivery}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isSubmittingDelivery ? (
                    <span>Menyimpan Bukti...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kirim Bukti Serah Terima</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAILED DELIVERY MODAL */}
      {showFailedModal && activeDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Laporan Gagal Antar
                </h3>
              </div>
              <button onClick={() => setShowFailedModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleFailDeliverySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">
                  Pilih Alasan Kendala Pengantaran:
                </label>
                <select
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                >
                  {FAILED_REASONS.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Catatan Tambahan untuk Admin Toko:
                </label>
                <textarea
                  rows={3}
                  value={failedNotes}
                  onChange={(e) => setFailedNotes(e.target.value)}
                  placeholder="Contoh: Sudah ditelepon 3x tidak diangkat, pagar rumah terkunci rapat."
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFailedModal(false)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFailed}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isSubmittingFailed ? 'Menyimpan...' : 'Kirim Laporan Gagal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
