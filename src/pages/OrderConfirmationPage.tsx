import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Upload,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building,
  QrCode,
  FileCheck,
  X,
  ZoomIn,
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
        <Link to="/" className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl">
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
      // simulate realistic proof url
      const sampleProof = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800';
      uploadPaymentProof(order.id, sampleProof);
    } else {
      uploadPaymentProof(order.id, proofFile);
    }
    setUploadSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-x-hidden w-full">
      {/* Top Banner Alert */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#101519]">
          Pesanan Berhasil Dibuat!
        </h1>
        <p className="text-xs sm:text-sm text-body">
          Nomor Pesanan: <span className="font-mono font-bold text-primary">{order.order_number}</span>
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Status: {order.status === 'awaiting_verification' ? 'Menunggu Verifikasi Admin' : 'Menunggu Pembayaran'}</span>
        </div>
      </div>

      {/* Payment Instructions Card */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#101519]">Instruksi Pembayaran</h2>
            <p className="text-xs text-body">Silakan selesaikan pembayaran sebelum batas waktu 24 jam</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-body block">Total Tagihan:</span>
            <span className="text-xl font-extrabold text-primary">{formatRupiah(order.total_amount)}</span>
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
                className="w-48 h-48 mx-auto object-contain"
              />
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-primary group-hover:underline">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Klik untuk Memperbesar QRIS</span>
              </div>
              <p className="text-[10px] text-body mt-0.5">NMID: ID1020268892100 (USKI STORE)</p>
            </div>
            <p className="text-xs text-[#2D3033] max-w-md mx-auto">
              Buka aplikasi BCA Mobile, GoPay, OVO, Dana, LinkAja, atau ShopeePay Anda, lalu scan QRIS resmi di atas dan transfer tepat sebesar <strong className="text-primary">{formatRupiah(order.total_amount)}</strong>.
            </p>
          </div>
        )}

        {/* Bank Transfer Details if Bank Transfer */}
        {order.payment_method === 'bank_transfer' && (
          <div className="space-y-4">
            <p className="text-xs text-body">
              Pilih salah satu nomor rekening resmi toko USKI STORE berikut untuk melakukan transfer:
            </p>

            <div className="space-y-3">
              {[
                { bank: 'BCA', number: '7120982311', name: 'USKI STORE OFFICIAL' },
                { bank: 'Bank Syariah Indonesia (BSI)', number: '7190023412', name: 'USKI STORE OFFICIAL' },
                { bank: 'Mandiri', number: '1570008892123', name: 'USKI STORE OFFICIAL' },
              ].map((acc) => (
                <div
                  key={acc.number}
                  className="p-4 bg-neutral-2/60 rounded-2xl border border-hairline flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-primary block">{acc.bank}</span>
                    <span className="font-mono text-base font-extrabold text-[#101519]">{acc.number}</span>
                    <span className="text-xs text-body block">a.n {acc.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(acc.number)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-hairline hover:border-primary rounded-xl text-xs font-bold text-[#101519] shadow-sm transition-all min-h-[40px] touch-manipulation shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                    <span>{copiedAccount === acc.number ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Midtrans Simulation notice */}
        {order.payment_method === 'midtrans_va' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
            <p className="font-bold">Payment Gateway Midtrans Terhubung</p>
            <p>
              Nomor Virtual Account telah dibuat. Setelah transfer, status transaksi akan diperbarui secara otomatis via webhook server terverifikasi.
            </p>
          </div>
        )}

        {/* COD notice */}
        {order.payment_method === 'cod' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <p className="font-bold">Pembayaran Tunai di Tempat (COD)</p>
            <p>Siapkan uang pas sebesar {formatRupiah(order.total_amount)} untuk diserahkan kepada kurir saat pesanan tiba.</p>
          </div>
        )}

        {/* Form Upload Bukti Pembayaran */}
        {order.payment_method !== 'cod' && (
          <div className="pt-6 border-t border-hairline space-y-4">
            <h3 className="text-sm font-extrabold text-[#101519] flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Unggah Bukti Pembayaran
            </h3>

            {order.payment?.proof_image_url || uploadSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-xs text-green-800">
                <FileCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold">Bukti Pembayaran Berhasil Diunggah!</p>
                  <p>Staf kami sedang memeriksa mutasi bank Anda. Status pesanan akan otomatis berubah setelah diverifikasi.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSimulateUpload} className="space-y-3">
                <div className="border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-6 text-center space-y-2 bg-neutral-2/30">
                  <Upload className="w-8 h-8 text-body mx-auto" />
                  <p className="text-xs font-semibold text-[#101519]">
                    Pilih foto struk transfer ATM, screenshot m-banking atau resi QRIS
                  </p>
                  <p className="text-[11px] text-body">Format: JPG, PNG, atau PDF (Maks. 5MB)</p>
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
                  className="w-full min-h-[44px] py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Upload className="w-4 h-4" />
                  <span>Kirim Bukti Pembayaran</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Order Summary & Delivery Address */}
      <div className="bg-white border border-hairline rounded-3xl p-6 space-y-4 text-xs">
        <h3 className="text-sm font-extrabold text-[#101519] border-b border-hairline pb-2">
          Detail Pengiriman
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-body block">Penerima:</span>
            <span className="font-bold text-[#101519]">{order.shipping_address.recipient_name} ({order.shipping_address.phone_number})</span>
            <span className="text-body block mt-1">{order.shipping_address.street_address}, {order.shipping_address.city}, {order.shipping_address.province}</span>
          </div>
          <div>
            <span className="text-body block">Ekspedisi Pilihan:</span>
            <span className="font-bold text-[#101519]">{order.shipping_method}</span>
            <span className="text-body block mt-1">Tanggal Pesanan: {formatDate(order.created_at)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/track-order?ref=${order.order_number}`}
            className="text-primary font-bold hover:underline"
          >
            Lacak Pesanan Ini
          </Link>
          <Link
            to="/"
            className="min-h-[40px] px-5 py-2.5 bg-neutral-2 hover:bg-neutral-3 text-[#2D3033] font-bold rounded-xl transition-colors inline-flex items-center touch-manipulation"
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
                Total Pembayaran: <strong className="text-primary">{formatRupiah(order.total_amount)}</strong>
              </p>
            </div>
            <p className="text-xs text-body leading-relaxed">
              Scan barcode di atas menggunakan aplikasi e-wallet atau mobile banking apa pun yang mendukung QRIS nasional.
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
