import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Clock,
  ExternalLink,
  ShieldCheck,
  X,
  MessageSquare,
  AlertTriangle,
  ShoppingBag,
  User,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Order } from '@/types';

export const AdminPayments: React.FC = () => {
  const { orders, updatePaymentStatus } = useOrderStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  
  // Single Unified Modal State
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);

  // Inline Reject Form State inside Single Modal
  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Keep live reference to selected order if status changes
  const liveSelectedOrder = selectedPaymentOrder
    ? orders.find((o) => o.id === selectedPaymentOrder.id) || selectedPaymentOrder
    : null;

  const paymentOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const match =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q);
    const matchStatus = statusFilter === 'all' || o.payment_status === statusFilter;
    return match && matchStatus;
  });

  const handleApprove = (order: Order) => {
    updatePaymentStatus(order.id, 'verified', user?.full_name || 'Admin Toko USKI');
    setIsRejectFormOpen(false);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedOrder) return;

    updatePaymentStatus(
      liveSelectedOrder.id,
      'rejected',
      user?.full_name || 'Admin Toko USKI',
      rejectionReason || 'Nominal transfer tidak sesuai atau mutasi tidak ditemukan di rekening'
    );

    setIsRejectFormOpen(false);
    setRejectionReason('');
  };

  const quickReasons = [
    'Mutasi rekening belum ditemukan / dana belum masuk',
    'Nominal transfer kurang dari total tagihan',
    'Bukti transfer buram / struk tidak terbaca jelas',
    'Indikasi struk palsu atau tanggal tidak valid',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Verifikasi Bukti Pembayaran
          </h1>
          <p className="text-xs text-body mt-1">
            Klik baris transaksi untuk membuka popup detail verifikasi struk transfer, QRIS, dan pencocokan nominal
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: `Semua Transaksi (${orders.length})` },
            {
              id: 'pending',
              label: `Perlu Verifikasi (${orders.filter((o) => o.payment_status === 'pending').length})`,
              highlight: true,
            },
            {
              id: 'verified',
              label: `Lunas Sah (${orders.filter((o) => o.payment_status === 'verified').length})`,
            },
            {
              id: 'rejected',
              label: `Ditolak (${orders.filter((o) => o.payment_status === 'rejected').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : tab.highlight && statusFilter !== tab.id
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-white text-body border border-hairline hover:bg-neutral-2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Cari no. order, nama, atau no. HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary shadow-xs"
          />
          <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Verification Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-neutral-2/40 border-b border-hairline text-xs text-body flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <Eye className="w-4 h-4" />
            Tips: Klik salah satu baris transaksi untuk membuka Satu Popup Verifikasi lengkap
          </span>
          <span className="text-[11px] text-body hidden sm:inline">
            Menampilkan {paymentOrders.length} transaksi
          </span>
        </div>
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left min-w-[740px]">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Nominal Tagihan</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Bukti Transfer</th>
                <th className="py-3 px-4 text-center">Status Bayar</th>
                <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {paymentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-body">
                    Tidak ada transaksi bukti pembayaran pada filter ini.
                  </td>
                </tr>
              ) : (
                paymentOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => {
                      setSelectedPaymentOrder(ord);
                      setIsRejectFormOpen(false);
                    }}
                    className="hover:bg-primary/5 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-primary group-hover:underline">
                      {ord.order_number}
                      <span className="block font-normal text-body text-[10px]">
                        {formatDate(ord.created_at)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#101519] block">{ord.customer_name}</span>
                      <span className="text-body text-[11px]">{ord.customer_phone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#101519]">
                      {formatRupiah(ord.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-body uppercase">
                      {ord.payment_method.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {ord.payment?.proof_image_url ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-bold text-[11px]">
                          <img
                            src={ord.payment.proof_image_url}
                            alt="Bukti"
                            className="w-5 h-5 rounded object-cover border border-primary/20"
                          />
                          <span>Lihat Struk</span>
                        </div>
                      ) : (
                        <span className="text-body italic text-[11px]">Belum diunggah</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.payment_status === 'verified'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : ord.payment_status === 'rejected'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ord.payment_status === 'verified'
                          ? 'LUNAS (SAH)'
                          : ord.payment_status === 'rejected'
                          ? 'DITOLAK'
                          : 'MENUNGGU VERIFIKASI'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPaymentOrder(ord);
                            setIsRejectFormOpen(false);
                          }}
                          className="px-3 py-1 bg-primary text-white hover:bg-primary-hover rounded-lg font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Periksa</span>
                        </button>
                        {ord.payment_status !== 'verified' && (
                          <button
                            onClick={() => handleApprove(ord)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                            title="Verifikasi Lunas Cepat"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SATU POPUP LENGKAP: DETAIL VERIFIKASI PEMBAYARAN & PREVIEW STRUK BUKTI      */}
      {/* ========================================================================= */}
      {liveSelectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#101519] font-mono">
                      Verifikasi Pembayaran #{liveSelectedOrder.order_number}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        liveSelectedOrder.payment_status === 'verified'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : liveSelectedOrder.payment_status === 'rejected'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {liveSelectedOrder.payment_status}
                    </span>
                  </div>
                  <p className="text-xs text-body mt-0.5">
                    Metode: <strong className="uppercase text-[#101519]">{liveSelectedOrder.payment_method.replace('_', ' ')}</strong> • Total: <strong className="text-primary font-black">{formatRupiah(liveSelectedOrder.total_amount)}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPaymentOrder(null);
                  setIsRejectFormOpen(false);
                }}
                className="p-2 hover:bg-neutral-2 rounded-xl text-body hover:text-[#101519] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Kolom Kiri: Bukti Pembayaran / Struk Transfer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#101519] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Foto Struk / Bukti Transfer
                    </span>
                    {liveSelectedOrder.payment?.proof_image_url && (
                      <a
                        href={liveSelectedOrder.payment.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        <span>Buka Resolusi Penuh</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="rounded-2xl overflow-hidden bg-neutral-100 border border-hairline min-h-[300px] max-h-[460px] flex items-center justify-center p-2 relative group">
                    {liveSelectedOrder.payment?.proof_image_url ? (
                      <img
                        src={liveSelectedOrder.payment.proof_image_url}
                        alt="Bukti Transfer Pelanggan"
                        className="w-full h-auto max-h-[440px] object-contain rounded-xl shadow-xs"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2 text-body text-xs">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="font-bold text-[#101519]">Belum Mengunggah Bukti</p>
                        <p className="text-[11px]">Pelanggan belum mengunggah gambar bukti transfer untuk pesanan ini.</p>
                      </div>
                    )}
                  </div>

                  {liveSelectedOrder.payment?.proof_image_url && (
                    <p className="text-[11px] text-body text-center italic">
                      Periksa nama pengirim, bank pengirim, dan kecocokan nominal transfer sebelum verifikasi.
                    </p>
                  )}
                </div>

                {/* Kolom Kanan: Rincian Tagihan & Aksi Verifikasi */}
                <div className="space-y-4">
                  {/* Card Rincian Tagihan */}
                  <div className="bg-neutral-2/40 border border-hairline rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                      <span className="font-extrabold text-[#101519] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Data Verifikasi Tagihan
                      </span>
                      <span className="font-mono text-[10px] text-body">
                        {formatDate(liveSelectedOrder.created_at)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-hairline/80">
                        <span className="text-body font-medium">Nominal Wajib Transfer:</span>
                        <span className="text-base font-black text-primary">
                          {formatRupiah(liveSelectedOrder.total_amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-hairline/80">
                          <span className="text-[10px] text-body block">Nama Pembeli:</span>
                          <strong className="text-xs text-[#101519] block">{liveSelectedOrder.customer_name}</strong>
                          <span className="text-[10px] text-body font-mono">{liveSelectedOrder.customer_phone}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-hairline/80">
                          <span className="text-[10px] text-body block">Metode Pembayaran:</span>
                          <strong className="text-xs text-[#101519] block uppercase">{liveSelectedOrder.payment_method.replace('_', ' ')}</strong>
                          <span className="text-[10px] text-emerald-600 font-bold">Rekening Toko Resmi</span>
                        </div>
                      </div>

                      {/* Tombol WhatsApp Hubungi Pembeli */}
                      <a
                        href={`https://wa.me/${liveSelectedOrder.customer_phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20kak%20${encodeURIComponent(liveSelectedOrder.customer_name)},%20kami%20dari%20Admin%20USKI%20STORE%20ingin%20mengonfirmasi%20pembayaran%20pesanan%20${liveSelectedOrder.order_number}%20sebesar%20${encodeURIComponent(formatRupiah(liveSelectedOrder.total_amount))}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp Pembeli ({liveSelectedOrder.customer_phone})</span>
                      </a>
                    </div>
                  </div>

                  {/* Card Daftar Barang */}
                  <div className="bg-white border border-hairline rounded-2xl p-4 space-y-2 text-xs">
                    <span className="font-bold text-body block">Item Pesanan ({liveSelectedOrder.items.length} Barang):</span>
                    <div className="max-h-36 overflow-y-auto divide-y divide-hairline space-y-1">
                      {liveSelectedOrder.items.map((it) => (
                        <div key={it.id} className="py-1.5 flex justify-between items-center text-xs">
                          <span className="text-[#101519] font-medium truncate max-w-[200px]">
                            {it.product_name} <strong className="text-primary font-mono">({it.quantity}x)</strong>
                          </span>
                          <span className="font-bold text-[#101519]">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info Verifikasi Sebelumnya jika sudah ada */}
                  {liveSelectedOrder.payment?.verified_by && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1 text-emerald-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Pembayaran Telah Diverifikasi Sah</span>
                      </div>
                      <p className="text-[11px]">
                        Diverifikasi oleh <strong>{liveSelectedOrder.payment.verified_by}</strong> pada {liveSelectedOrder.payment.verified_at ? formatDate(liveSelectedOrder.payment.verified_at) : 'Hari ini'}.
                      </p>
                    </div>
                  )}

                  {/* Info Penolakan jika berstatus rejected */}
                  {liveSelectedOrder.payment_status === 'rejected' && liveSelectedOrder.payment?.rejection_reason && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1 text-rose-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Pembayaran Telah Ditolak</span>
                      </div>
                      <p className="text-[11px]">
                        Alasan: <em>{liveSelectedOrder.payment.rejection_reason}</em>
                      </p>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* AKSI VERIFIKASI (TERPADU DI SATU POPUP TANPA MODAL BERTUMPUK) */}
                  {/* ========================================================= */}
                  <div className="space-y-3 pt-2">
                    {/* Inline Form Penolakan */}
                    {isRejectFormOpen ? (
                      <form onSubmit={handleReject} className="bg-rose-50 border border-rose-300 rounded-2xl p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between font-extrabold text-rose-900">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Alasan Penolakan Pembayaran
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsRejectFormOpen(false)}
                            className="text-body hover:text-black"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Reason Pills */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-body font-semibold">Pilih Alasan Cepat:</span>
                          <div className="flex flex-wrap gap-1">
                            {quickReasons.map((qr) => (
                              <button
                                key={qr}
                                type="button"
                                onClick={() => setRejectionReason(qr)}
                                className="px-2 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded text-[10px] text-rose-900 font-semibold text-left transition-colors"
                              >
                                {qr}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          required
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Tuliskan catatan alasan penolakan untuk pelanggan..."
                          className="w-full p-2.5 bg-white border border-rose-200 rounded-xl font-medium focus:outline-none focus:border-rose-500"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsRejectFormOpen(false)}
                            className="px-3 py-1.5 bg-white border border-hairline rounded-xl font-bold text-body hover:bg-neutral-2"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors"
                          >
                            Kirim Penolakan
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Tombol Utama Verifikasi */
                      <div className="flex flex-col sm:flex-row gap-2">
                        {liveSelectedOrder.payment_status !== 'verified' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(liveSelectedOrder)}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Setujui & Tandai Lunas (Sah)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRejectFormOpen(true)}
                              className="px-4 py-2.5 bg-neutral-2 hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Tolak Bukti</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full py-2 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl text-center border border-emerald-300 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Status Lunas • Pesanan Siap / Sedang Diproses Gudang</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-hairline flex items-center justify-between text-xs">
              <span className="text-body font-mono">
                Order ID: {liveSelectedOrder.id}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPaymentOrder(null);
                  setIsRejectFormOpen(false);
                }}
                className="px-5 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold transition-colors"
              >
                Tutup Popup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};