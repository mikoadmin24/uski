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
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Order } from '@/types';

export const AdminPayments: React.FC = () => {
  const { orders, updatePaymentStatus } = useOrderStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<Order | null>(null);

  const paymentOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const match =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q);
    return match;
  });

  const handleApprove = (order: Order) => {
    updatePaymentStatus(order.id, 'verified', user?.full_name || 'Admin Toko');
    setSelectedProofOrder(null);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal) return;

    updatePaymentStatus(
      showRejectModal.id,
      'rejected',
      user?.full_name || 'Admin Toko',
      rejectionReason || 'Nominal transfer tidak sesuai / mutasi tidak ditemukan'
    );

    setShowRejectModal(null);
    setRejectionReason('');
    setSelectedProofOrder(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#101519]">
          Verifikasi Bukti Pembayaran
        </h1>
        <p className="text-xs text-body mt-1">
          Periksa keaslian bukti transfer bank dan QRIS sebelum pesanan diproses oleh gudang
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-hairline rounded-2xl p-4 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nomor order atau nama pengirim..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Verification Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
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
              {paymentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-neutral-2/20">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
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
                      <button
                        onClick={() => setSelectedProofOrder(ord)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    ) : (
                      <span className="text-body italic text-[11px]">Belum diunggah</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ord.payment_status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : ord.payment_status === 'rejected'
                          ? 'bg-red-100 text-badge-text'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {ord.payment_status !== 'verified' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(ord)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[11px] transition-all"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => setShowRejectModal(ord)}
                          className="px-2.5 py-1 bg-neutral-2 hover:bg-red-50 text-body hover:text-red-600 rounded-lg font-bold text-[11px] transition-all"
                        >
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="text-green-600 font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sah
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Preview Modal */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#101519]">
                  Bukti Pembayaran: {selectedProofOrder.order_number}
                </h3>
                <span className="text-xs text-body">
                  Nominal Tagihan: {formatRupiah(selectedProofOrder.total_amount)}
                </span>
              </div>
              <button onClick={() => setSelectedProofOrder(null)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/5 border border-hairline max-h-96 flex items-center justify-center">
              <img
                src={selectedProofOrder.payment?.proof_image_url}
                alt="Bukti Transfer"
                className="max-h-96 w-auto object-contain"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setShowRejectModal(selectedProofOrder)}
                className="px-4 py-2 bg-neutral-2 hover:bg-red-50 text-body hover:text-red-600 font-bold text-xs rounded-xl"
              >
                Tolak Bukti Ini
              </button>
              <button
                onClick={() => handleApprove(selectedProofOrder)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl"
              >
                Setujui Pembayaran Sah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReject}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-sm text-[#101519]">
                Tolak Pembayaran: {showRejectModal.order_number}
              </h3>
              <button onClick={() => setShowRejectModal(null)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <div>
              <label className="font-bold text-body block mb-1">
                Alasan Penolakan (Akan Terlihat oleh Pelanggan) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Bukti buram / mutasi rekening tidak masuk / nominal kurang..."
                className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-badge-text text-white font-bold rounded-xl"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
