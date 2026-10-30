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
  Printer,
  X,
} from 'lucide-react';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const BulkOrderQuotationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();
  const { getRequestByReference, approveQuote, rejectQuote } = useCustomOrderStore();

  const req = getRequestByReference(reference || '');
  const [actionMsg, setActionMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showPrintQuotation, setShowPrintQuotation] = useState<boolean>(false);

  if (!req) {
    return (
      <div className="max-w-site mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-extrabold text-[#101519]">Tiket Pesan Request Tidak Ditemukan</h2>
        <p className="text-xs text-body">Periksa kembali nomor referensi request Anda.</p>
        <Link to="/bulk-order" className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl">
          Kembali ke Form Request
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
      setActionMsg({ text: err.message || 'Gagal memproses pesanan request', isError: true });
    }
  };

  const handleReject = () => {
    rejectQuote(req.id, 'Dibatalkan oleh pemohon');
    setActionMsg({ text: 'Pesan request ini telah dibatalkan.', isError: false });
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
              <span className="font-extrabold text-[#101519]">Total Tagihan Resmi (Harga Pas):</span>
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
          <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPrintQuotation(true)}
              className="px-5 py-3.5 bg-neutral-2 hover:bg-neutral-1/40 text-[#101519] font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-hairline"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Cetak / Simpan PDF Faktur Request</span>
            </button>

            {req.status === 'quote_sent' && (
              <>
                <button
                  onClick={handleApprove}
                  className="flex-1 py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui & Buat Pesanan Resmi</span>
                </button>
                <button
                  onClick={handleReject}
                  className="px-6 py-3.5 bg-neutral-2 hover:bg-red-50 text-body hover:text-red-600 font-bold text-xs sm:text-sm rounded-xl transition-all"
                >
                  Batalkan Request
                </button>
              </>
            )}
          </div>

          {req.status === 'converted_to_order' && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <span>Pesan request ini telah disetujui dan telah dikonversi menjadi pesanan resmi.</span>
            </div>
          )}
        </div>
      ) : (
        /* If still waiting for admin quote */
        <div className="bg-white border border-hairline rounded-3xl p-8 text-center space-y-3">
          <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
          <h3 className="text-lg font-extrabold text-[#101519]">Request Sedang Ditinjau Tim Admin</h3>
          <p className="text-xs text-body max-w-md mx-auto">
            Daftar request kebutuhan Anda sedang diperiksa stoknya ke supplier penerbit & pabrik ATK. Anda akan menerima rincian pesanan resmi harga pas dari toko begitu siap.
          </p>
        </div>
      )}
      {/* Printable Official Quotation Modal */}
      {showPrintQuotation && quote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 max-h-[95vh] overflow-y-auto space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none shadow-2xl">
            {/* Header Controls (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-hairline pb-4 print:hidden">
              <span className="text-xs font-bold text-body">Tinjauan Lembar Penawaran Fisik</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintQuotation(false)}
                  className="px-3 py-2 bg-neutral-2 text-body font-bold text-xs rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Letterhead (Kop Surat) */}
            <div className="border-b-2 border-black pb-4 flex items-center justify-between gap-4">
              <img
                src="/logo.jpg"
                alt="USKI STORE Logo"
                className="w-14 h-14 object-contain shrink-0"
              />
              <div className="flex-1 text-center space-y-1">
                <h2 className="text-xl font-extrabold tracking-wider text-primary">USKI STORE OFFICIAL</h2>
                <p className="text-xs font-semibold text-[#101519]">
                  PUSAT DISTRIBUSI BUKU UMUM, PELAJARAN, AL-QUR'AN, KITAB & ATK INSTANSI
                </p>
                <p className="text-[11px] text-body">
                  Jl. Margonda Raya No. 102, Depok, Jawa Barat | WhatsApp: 0812-3456-7890 | Email: cs@uskistore.id
                </p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex justify-between items-start text-xs pt-2">
              <div>
                <p><strong>Kepada Yth:</strong> {req.customer_name}</p>
                <p><strong>Instansi:</strong> {req.institution_name || 'Perorangan'}</p>
                <p><strong>Alamat Tujuan:</strong> {req.shipping_address || 'Sesuai Pengajuan'}</p>
              </div>
              <div className="text-right">
                <p><strong>Nomor Quotation:</strong> <span className="font-mono">{quote.quote_number}</span></p>
                <p><strong>Tanggal Terbit:</strong> {formatDate(quote.created_at)}</p>
                <p><strong>Masa Berlaku:</strong> s.d {formatDate(quote.expires_at)}</p>
              </div>
            </div>

            <div className="text-center py-2">
              <h3 className="font-extrabold text-sm underline tracking-wide">
                FAKTUR RINCIAN PESANAN REQUEST KHUSUS (RESMI HARGA PAS)
              </h3>
              <p className="text-xs text-body italic mt-0.5">Perihal: {req.title}</p>
            </div>

            {/* Items table */}
            <table className="w-full text-xs text-left border border-black/20">
              <thead className="bg-neutral-2/80 font-bold border-b border-black/20">
                <tr>
                  <th className="p-2.5 border-r border-black/20 text-center w-8">No</th>
                  <th className="p-2.5 border-r border-black/20">Uraian Kebutuhan & Spesifikasi</th>
                  <th className="p-2.5 border-r border-black/20 text-center w-16">Vol</th>
                  <th className="p-2.5 border-r border-black/20 text-right w-28">Harga Satuan</th>
                  <th className="p-2.5 text-right w-32">Total Harga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {quote.items.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="p-2.5 border-r border-black/10 text-center">{idx + 1}</td>
                    <td className="p-2.5 border-r border-black/10 font-medium">{it.description}</td>
                    <td className="p-2.5 border-r border-black/10 text-center">{it.quantity}</td>
                    <td className="p-2.5 border-r border-black/10 text-right">{formatRupiah(it.unit_price)}</td>
                    <td className="p-2.5 text-right font-bold">{formatRupiah(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals calculation */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-1.5 border border-black/20 p-3 rounded-lg bg-neutral-2/30">
                <div className="flex justify-between">
                  <span>Subtotal Barang:</span>
                  <span className="font-bold">{formatRupiah(quote.subtotal)}</span>
                </div>
                {quote.additional_services_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Biaya Jasa Cetak:</span>
                    <span className="font-bold">{formatRupiah(quote.additional_services_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Ongkos Kirim Kargo/Kurir:</span>
                  <span className="font-bold">{formatRupiah(quote.shipping_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-black/20 pt-1.5 font-extrabold text-sm text-primary">
                  <span>Grand Total:</span>
                  <span>{formatRupiah(quote.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Signature Area */}
            <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-hairline">
              <div className="space-y-1">
                <p className="font-bold">Ketentuan & Pembayaran:</p>
                <p className="text-[11px] text-body">1. Pembayaran melalui rekening resmi USKI STORE.</p>
                <p className="text-[11px] text-body">2. Estimasi pengerjaan / pengiriman: {quote.lead_time_days} hari kerja.</p>
                <p className="text-[11px] text-body">3. Harga sudah termasuk packing standar aman.</p>
              </div>

              <div className="text-center space-y-12">
                <p>Depok, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br /><strong>USKI STORE OFFICIAL</strong></p>
                <div className="border-b border-black w-40 mx-auto" />
                <p className="text-[11px] text-body -mt-10">(Divisi Pengadaan & Penjualan)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
