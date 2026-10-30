import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Calendar,
  Truck,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const BulkOrderQuotationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();
  const { getRequestByReference, approveQuote, rejectQuote } = useCustomOrderStore();

  const req = getRequestByReference(reference || '');
  const [actionMsg, setActionMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!req) {
    return (
      <div className="max-w-site mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-extrabold text-[#101519]">Tiket Penawaran Tidak Ditemukan</h2>
        <p className="text-xs text-body">Periksa kembali nomor referensi RFQ Anda.</p>
        <Link to="/bulk-order" className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl">
          Kembali ke Form Custom
        </Link>
      </div>
    );
  }

  const quote = req.quote;

  const handleApprove = () => {
    try {
      const orderNumber = approveQuote(req.id);
      navigate(`/order-confirmation/${orderNumber}`);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Gagal memproses penawaran', isError: true });
    }
  };

  const handleReject = () => {
    rejectQuote(req.id, 'Ditolak oleh pemohon');
    setActionMsg({ text: 'Penawaran ini telah ditolak.', isError: false });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-hairline gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-primary">{req.reference_number}</span>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                {req.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#101519] mt-1">{req.title}</h1>
          </div>
          <div className="text-xs text-body">
            <span>Dibuat: </span>
            <span className="font-bold text-[#101519]">{formatDate(req.created_at)}</span>
          </div>
        </div>

        {/* Customer & Institution Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#2D3033]">
          <div>
            <span className="text-body block">Pemohon:</span>
            <span className="font-bold text-[#101519]">{req.customer_name}</span>
            <span className="text-body block">{req.customer_phone}</span>
          </div>
          <div>
            <span className="text-body block">Instansi:</span>
            <span className="font-bold text-[#101519]">{req.institution_name || 'Perorangan'}</span>
            <span className="text-body block">{req.category}</span>
          </div>
          <div>
            <span className="text-body block">Kuantitas Permintaan:</span>
            <span className="font-bold text-primary text-sm">{req.quantity} pcs / unit</span>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          actionMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {actionMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Official Quotation Card (if issued by admin) */}
      {quote ? (
        <div className="bg-white border-2 border-primary/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-hairline gap-2">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-primary block">
                Surat Penawaran Resmi Toko (Quotation)
              </span>
              <h2 className="text-lg font-extrabold text-[#101519]">
                Nomor: {quote.quote_number}
              </h2>
            </div>
            <div className="text-xs text-body">
              <span>Masa Berlaku s.d: </span>
              <span className="font-bold text-badge-text">{formatDate(quote.expires_at)}</span>
            </div>
          </div>

          {/* Quotation Item Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-hairline text-body text-left">
                  <th className="py-2.5 font-bold">Rincian Barang & Layanan Custom</th>
                  <th className="py-2.5 font-bold text-center">Jumlah</th>
                  <th className="py-2.5 font-bold text-right">Harga Satuan</th>
                  <th className="py-2.5 font-bold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((it) => (
                  <tr key={it.id} className="border-b border-hairline">
                    <td className="py-3 font-semibold text-[#101519]">{it.description}</td>
                    <td className="py-3 text-center">{it.quantity}</td>
                    <td className="py-3 text-right">{formatRupiah(it.unit_price)}</td>
                    <td className="py-3 text-right font-bold text-[#101519]">{formatRupiah(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="space-y-2 text-xs pt-2 max-w-xs ml-auto">
            <div className="flex justify-between text-body">
              <span>Subtotal Barang:</span>
              <span className="font-bold text-[#101519]">{formatRupiah(quote.subtotal)}</span>
            </div>
            {quote.additional_services_fee > 0 && (
              <div className="flex justify-between text-body">
                <span>Biaya Jasa Cetak / Khusus:</span>
                <span className="font-bold text-[#101519]">{formatRupiah(quote.additional_services_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-body">
              <span>Ongkos Kirim Kargo / Kurir:</span>
              <span className="font-bold text-[#101519]">{formatRupiah(quote.shipping_fee)}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-2 text-sm">
              <span className="font-extrabold text-[#101519]">Total Penawaran:</span>
              <span className="font-extrabold text-primary text-base">{formatRupiah(quote.grand_total)}</span>
            </div>
          </div>

          {quote.admin_notes && (
            <div className="p-4 bg-neutral-2 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-[#101519] block">Catatan Tambahan dari Admin USKI:</span>
              <p className="text-body leading-relaxed">{quote.admin_notes}</p>
            </div>
          )}

          {/* Approval Action Buttons if pending customer action */}
          {req.status === 'quote_sent' && (
            <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleApprove}
                className="flex-1 py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Penawaran & Buat Pesanan Resmi</span>
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-3.5 bg-neutral-2 hover:bg-red-50 text-body hover:text-red-600 font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                Tolak Penawaran
              </button>
            </div>
          )}

          {req.status === 'converted_to_order' && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <span>Penawaran ini telah disetujui dan telah dikonversi menjadi pesanan resmi.</span>
            </div>
          )}
        </div>
      ) : (
        /* If still waiting for admin quote */
        <div className="bg-white border border-hairline rounded-3xl p-8 text-center space-y-3">
          <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
          <h3 className="text-lg font-extrabold text-[#101519]">Sedang Ditinjau Tim Admin</h3>
          <p className="text-xs text-body max-w-md mx-auto">
            Daftar pengajuan kebutuhan Anda sedang diperiksa ke supplier penerbit & pabrik ATK. Anda akan menerima notifikasi begitu surat penawaran harga selesai dibuat.
          </p>
        </div>
      )}
    </div>
  );
};
