import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Upload,
  Clock,
  ArrowRight,
  QrCode,
  FileCheck,
  X,
  ZoomIn,
  MessageSquare,
  Building,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { getOrderByNumber, uploadPaymentProof } = useOrderStore();

  const order = getOrderByNumber(orderNumber || '');

  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  if (!order) {
    return (
      <div className="max-w-site mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-extrabold text-[#101519]">Pesanan Tidak Ditemukan</h2>
        <Link to="/" className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      const sampleProof = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800';
      uploadPaymentProof(order.id, sampleProof);
    } else {
      uploadPaymentProof(order.id, proofFile);
    }
    setUploadSuccess(true);
  };

  // Generate WhatsApp message and URL for direct conversation
  const paymentMethodLabels: Record<string, string> = {
    manual_qris: 'QRIS Instant (BCA / GoPay / OVO / Dana / ShopeePay / LinkAja)',
    bank_transfer: 'Transfer Bank Manual (BCA / BSI / Mandiri)',
    cod: 'Bayar di Tempat (COD Tunai)',
  };

  const waText = 
`*KONFIRMASI PESANAN - USKI STORE*
Halo Admin USKI Store, saya ingin konfirmasi pesanan:

*No. Pesanan:* ${order.order_number}
*Nama Pemesan:* ${order.customer_name}
*No. WhatsApp:* ${order.customer_phone}
*Alamat Kirim:* ${order.shipping_address.street_address}, ${order.shipping_address.city}
${order.notes ? `*Catatan:* ${order.notes}\n` : ''}
*Daftar Produk:*
${order.items.map((it, idx) => `${idx + 1}. ${it.product_name}${it.variant_name ? ` (${it.variant_name})` : ''} x${it.quantity} = ${formatRupiah(it.subtotal)}`).join('\n')}

*Total Tagihan:* ${formatRupiah(order.total_amount)}
*Pilihan Bayar:* ${paymentMethodLabels[order.payment_method] || order.payment_method}

Mohon bantu proses konfirmasi pesanan saya. Terima kasih!`;

  const waUrl = `https://wa.me/6285967249718?text=${encodeURIComponent(waText)}`;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-5 sm:space-y-6 overflow-x-hidden w-full">
      {/* Top Banner Alert */}
      <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 sm:w-14 h-12 sm:h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 sm:w-8 h-7 sm:h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#101519]">
          Pesanan Berhasil Dicatat!
        </h1>
        <p className="text-xs sm:text-sm text-body">
          Nomor Pesanan: <span className="font-mono font-bold text-primary">{order.order_number}</span>
        </p>

        {/* WhatsApp Direct Action Button */}
        <div className="pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl inline-flex items-center justify-center gap-2 shadow-sm transition-all touch-manipulation"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Chat CS USKI Store via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
          <p className="text-[11px] text-body mt-2">
            Klik tombol hijau di atas jika WhatsApp belum terbuka secara otomatis.
          </p>
        </div>
      </div>

      {/* Payment Instructions Card */}
      <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#101519]">Instruksi Pembayaran</h2>
            <p className="text-xs text-body">
              Metode: <strong className="text-[#101519]">{paymentMethodLabels[order.payment_method] || order.payment_method}</strong>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] text-body block">Total Tagihan:</span>
            <span className="text-lg sm:text-xl font-extrabold text-primary">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>

        {/* QRIS Display if QRIS */}
        {order.payment_method === 'manual_qris' && (
          <div className="space-y-4 text-center">
            <div
              onClick={() => setShowQrModal(true)}
              className="inline-block p-4 bg-white border-2 border-hairline rounded-2xl shadow-sm cursor-pointer hover:border-primary transition-all group"
            >
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020101021126570014ID.LINKAJA.WWW01189360091100215000000215204581253033605802ID5910USKI%20STORE6005DEPOK62070703A016304"
                alt="QRIS Toko USKI STORE"
                className="w-44 h-44 sm:w-48 sm:h-48 mx-auto object-contain"
              />
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-primary group-hover:underline">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Klik untuk Memperbesar QRIS</span>
              </div>
              <p className="text-[10px] text-body mt-0.5">NMID: ID1020268892100 (USKI STORE)</p>
            </div>
            <p className="text-xs text-[#2D3033] max-w-md mx-auto">
              Scan barcode QRIS di atas melalui BCA Mobile, GoPay, OVO, Dana, LinkAja, atau ShopeePay dan bayar tepat sebesar <strong className="text-primary">{formatRupiah(order.total_amount)}</strong>.
            </p>
          </div>
        )}

        {/* Bank Transfer Details if Bank Transfer */}
        {order.payment_method === 'bank_transfer' && (
          <div className="space-y-4">
            <p className="text-xs text-body">
              Silakan transfer ke salah satu rekening bank resmi USKI STORE:
            </p>

            <div className="space-y-2.5">
              {[
                { bank: 'BCA', number: '7120982311', name: 'USKI STORE OFFICIAL' },
                { bank: 'Bank Syariah Indonesia (BSI)', number: '7190023412', name: 'USKI STORE OFFICIAL' },
                { bank: 'Mandiri', number: '1570008892123', name: 'USKI STORE OFFICIAL' },
              ].map((acc) => (
                <div
                  key={acc.number}
                  className="p-3.5 sm:p-4 bg-neutral-2/60 rounded-2xl border border-hairline flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-primary block">{acc.bank}</span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-[#101519]">{acc.number}</span>
                    <span className="text-[11px] text-body block">a.n {acc.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.number)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-hairline hover:border-primary rounded-xl text-xs font-bold text-[#101519] shadow-xs transition-all min-h-[40px] touch-manipulation shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                    <span>{copiedAccount === acc.number ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COD notice */}
        {order.payment_method === 'cod' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Pembayaran Tunai di Tempat (COD)</span>
            </p>
            <p>Siapkan uang pas sejumlah <strong className="text-amber-900">{formatRupiah(order.total_amount)}</strong> saat kurir mengantarkan paket ke alamat Anda.</p>
          </div>
        )}

        {/* Form Upload Bukti Pembayaran (Optional/Alternative) */}
        {order.payment_method !== 'cod' && (
          <div className="pt-5 border-t border-hairline space-y-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#101519] flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Kirim Bukti Transfer (Opsional via Website atau WA)
            </h3>

            {order.payment?.proof_image_url || uploadSuccess ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Bukti Pembayaran Tersimpan!</p>
                  <p className="text-[11px]">CS kami akan memverifikasi mutasi bank dan memproses pesanan Anda.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSimulateUpload} className="space-y-2.5">
                <div className="border border-dashed border-hairline hover:border-primary rounded-xl p-4 text-center space-y-1.5 bg-neutral-2/30">
                  <p className="text-xs font-semibold text-[#101519]">
                    Unggah struk ATM / screenshot m-banking di sini atau langsung kirimkan ke WhatsApp
                  </p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProofFile(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="text-xs text-body"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[42px] py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Upload className="w-4 h-4" />
                  <span>Simpan Bukti Pembayaran</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Order Summary & Delivery Address */}
      <div className="bg-white border border-hairline rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 text-xs shadow-xs">
        <h3 className="text-xs sm:text-sm font-extrabold text-[#101519] border-b border-hairline pb-2">
          Detail Pesanan & Pengiriman
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <span className="text-body block text-[11px]">Penerima:</span>
            <span className="font-bold text-[#101519]">{order.shipping_address.recipient_name} ({order.shipping_address.phone_number})</span>
            <span className="text-body block mt-0.5">{order.shipping_address.street_address}, {order.shipping_address.city}, {order.shipping_address.province}</span>
          </div>
          <div>
            <span className="text-body block text-[11px]">Ekspedisi / Pengiriman:</span>
            <span className="font-bold text-[#101519]">{order.shipping_method}</span>
            <span className="text-body block mt-0.5">Tanggal Pesanan: {formatDate(order.created_at)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/track-order?ref=${order.order_number}`}
            className="text-primary font-bold hover:underline py-1"
          >
            Lacak Pesanan Ini
          </Link>
          <Link
            to="/"
            className="min-h-[40px] px-4 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#2D3033] font-bold rounded-xl transition-colors inline-flex items-center touch-manipulation text-xs"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>

      {/* QRIS Enlarge Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl text-center max-h-[90vh] overflow-y-auto border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">QRIS USKI STORE</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-neutral-2/40 rounded-xl border border-hairline">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=00020101021126570014ID.LINKAJA.WWW01189360091100215000000215204581253033605802ID5910USKI%20STORE6005DEPOK62070703A016304"
                alt="QRIS USKI STORE Besar"
                className="w-64 h-64 mx-auto object-contain"
              />
              <p className="text-xs font-bold text-[#101519] mt-2">NMID: ID1020268892100 (USKI STORE)</p>
              <p className="text-[11px] text-body mt-1">
                Total Tagihan: <strong className="text-primary">{formatRupiah(order.total_amount)}</strong>
              </p>
            </div>
            <p className="text-xs text-body leading-relaxed">
              Scan barcode menggunakan aplikasi BCA Mobile, GoPay, OVO, Dana, LinkAja, atau ShopeePay.
            </p>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full min-h-[40px] py-2.5 bg-neutral-2 hover:bg-neutral-3 text-[#101519] font-bold text-xs rounded-xl transition-colors touch-manipulation"
            >
              Tutup QRIS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
