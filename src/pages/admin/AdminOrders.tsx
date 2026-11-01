import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  Printer,
  X,
  Eye,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Package,
  Store,
  Check,
  Send,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { OrderStatus, Order } from '@/types';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, updateShipmentTracking } = useOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Simple tracking/delivery note inside detail modal
  const [trackingNote, setTrackingNote] = useState('');

  // Quick modals for printing
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState<Order | null>(null);
  const [printShippingLabelOrder, setPrintShippingLabelOrder] = useState<Order | null>(null);

  // Statistics counters
  const totalOrders = orders.length;
  const processingOrders = orders.filter((o) => o.status === 'processing').length;
  const shippingOrders = orders.filter((o) => o.status === 'shipped' || o.status === 'ready_for_pickup').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Keep live reference if selected order is modified
  const liveSelectedOrder = selectedOrderDetail
    ? orders.find((o) => o.id === selectedOrderDetail.id) || selectedOrderDetail
    : null;

  const handleSaveTrackingNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedOrder || !trackingNote.trim()) return;

    updateShipmentTracking(
      liveSelectedOrder.id,
      trackingNote.trim().toUpperCase(),
      liveSelectedOrder.shipping_method || 'Kurir Toko USKI'
    );
    setTrackingNote('');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'awaiting_payment':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-300">Menunggu Bayar</span>;
      case 'awaiting_verification':
        return <span className="px-2.5 py-1 bg-yellow-50 text-yellow-800 rounded-lg text-xs font-bold border border-yellow-300">Verifikasi Pembayaran</span>;
      case 'processing':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-bold border border-blue-300">Sedang Dikemas</span>;
      case 'ready_for_pickup':
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold border border-indigo-300">Siap Diambil di Toko</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg text-xs font-bold border border-purple-300">Sedang Dikirim</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">Selesai</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-lg text-xs font-bold border border-rose-300">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-1 bg-neutral-2 text-body rounded-lg text-xs font-bold border border-hairline">{status}</span>;
    }
  };

  const getWhatsAppLink = (phone: string, customerName: string, orderNumber: string, totalAmount: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    const text = `Halo Kak ${customerName}, kami dari USKI STORE mengonfirmasi pesanan Anda #${orderNumber} total ${formatRupiah(totalAmount)}. Apakah ada yang bisa kami bantu?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Simple Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Manajemen Pesanan
          </h1>
          <p className="text-xs text-body mt-1">
            Pantau dan kelola pesanan masuk via WhatsApp, konfirmasi pembayaran, serta cetak faktur & label pengiriman.
          </p>
        </div>
      </div>

      {/* 4 Simple Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-hairline rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-body font-semibold">Total Pesanan</span>
            <p className="text-2xl font-extrabold text-[#101519] mt-0.5">{totalOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-2 text-[#101519] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-amber-700 font-semibold">Perlu Dikemas</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-0.5">{processingOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-purple-700 font-semibold">Sedang Dikirim</span>
            <p className="text-2xl font-extrabold text-purple-700 mt-0.5">{shippingOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-emerald-700 font-semibold">Pesanan Selesai</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{deliveredOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `Semua Pesanan (${totalOrders})` },
          { id: 'awaiting_payment', label: `Menunggu Bayar (${orders.filter((o) => o.status === 'awaiting_payment').length})` },
          { id: 'processing', label: `Perlu Dikemas (${processingOrders})`, highlight: processingOrders > 0 },
          { id: 'shipped', label: `Sedang Dikirim (${orders.filter((o) => o.status === 'shipped').length})` },
          { id: 'ready_for_pickup', label: `Siap Diambil (${orders.filter((o) => o.status === 'ready_for_pickup').length})` },
          { id: 'delivered', label: `Selesai (${deliveredOrders})` },
          { id: 'cancelled', label: `Dibatalkan (${orders.filter((o) => o.status === 'cancelled').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-primary text-white shadow-xs'
                : tab.highlight
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                : 'bg-white text-body border border-hairline hover:bg-neutral-2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-hairline rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nomor order, nama pelanggan, atau nomor WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Clean Orders Table */}
      <div className="bg-white border border-hairline rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left min-w-[760px]">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Pesanan</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Pengiriman</th>
                <th className="py-3 px-4">Total & Pembayaran</th>
                <th className="py-3 px-4 text-center">Status Pesanan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-body">
                    Tidak ada pesanan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isAmbilDiToko = ord.shipping_method?.toLowerCase().includes('ambil');

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrderDetail(ord)}
                      className="hover:bg-primary/5 cursor-pointer transition-colors group"
                    >
                      {/* No Pesanan & Tanggal */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary group-hover:underline">
                        {ord.order_number}
                        <span className="block font-normal text-body text-[10px]">
                          {formatDate(ord.created_at)}
                        </span>
                      </td>

                      {/* Info Pelanggan & Chat WA */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <span className="font-bold text-[#101519] block">{ord.customer_name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={getWhatsAppLink(ord.customer_phone, ord.customer_name, ord.order_number, ord.total_amount)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA: {ord.customer_phone}</span>
                          </a>
                        </div>
                      </td>

                      {/* Jasa Pengiriman */}
                      <td className="py-3.5 px-4">
                        {isAmbilDiToko ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                            <Store className="w-3.5 h-3.5" />
                            Ambil di Toko (Gratis)
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200">
                              <Truck className="w-3.5 h-3.5" />
                              Kurir Toko USKI
                            </span>
                            {ord.shipment?.tracking_number && (
                              <span className="block font-mono text-[10px] text-body">
                                Catatan: {ord.shipment.tracking_number}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total & Status Pembayaran */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <span className="font-extrabold text-sm text-[#101519] block">
                          {formatRupiah(ord.total_amount)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {ord.payment_status === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">
                              <Check className="w-3 h-3" /> Lunas
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updatePaymentStatus(ord.id, 'verified', 'Admin')}
                              title="Klik untuk konfirmasi pembayaran lunas"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-bold border border-amber-300 transition-colors"
                            >
                              Tandai Lunas
                            </button>
                          )}
                          <span className="text-[10px] text-body uppercase font-medium">
                            {ord.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Status Pesanan Dropdown */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-hairline bg-white shadow-xs focus:outline-none focus:border-primary"
                        >
                          <option value="awaiting_payment">Menunggu Bayar</option>
                          <option value="processing">Sedang Dikemas</option>
                          <option value="ready_for_pickup">Siap Diambil di Toko</option>
                          <option value="shipped">Sedang Dikirim</option>
                          <option value="delivered">Pesanan Selesai</option>
                          <option value="cancelled">Dibatalkan</option>
                        </select>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrderDetail(ord)}
                            className="px-2.5 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => setPrintInvoiceOrder(ord)}
                            title="Cetak Faktur / Invoice"
                            className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-xl border border-hairline transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintShippingLabelOrder(ord)}
                            title="Cetak Label Resi Thermal"
                            className="p-1.5 hover:text-emerald-700 text-body hover:bg-neutral-2 rounded-xl border border-hairline transition-colors"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP DETAIL PESANAN YANG SEDERHANA, JELAS, & LENGKAP                     */}
      {/* ========================================================================= */}
      {liveSelectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white px-5 py-4 border-b border-hairline flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#101519] font-mono">
                      #{liveSelectedOrder.order_number}
                    </h2>
                    {getStatusBadge(liveSelectedOrder.status)}
                  </div>
                  <p className="text-xs text-body mt-0.5">
                    {formatDate(liveSelectedOrder.created_at)} • Pelanggan: <span className="font-bold text-[#101519]">{liveSelectedOrder.customer_name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintInvoiceOrder(liveSelectedOrder)}
                  className="px-3 py-1.5 bg-neutral-2 hover:bg-primary hover:text-white rounded-xl text-xs font-bold text-body flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak Faktur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintShippingLabelOrder(liveSelectedOrder)}
                  className="px-3 py-1.5 bg-neutral-2 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-body flex items-center gap-1.5 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Label Pengiriman</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 flex-1 text-xs">
              
              {/* Quick Status Bar */}
              <div className="bg-neutral-2/50 border border-hairline rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-body">Status Pesanan:</span>
                  <select
                    value={liveSelectedOrder.status}
                    onChange={(e) => updateOrderStatus(liveSelectedOrder.id, e.target.value as OrderStatus)}
                    className="h-8 px-3 bg-white border border-hairline rounded-xl font-bold text-primary focus:outline-none focus:border-primary shadow-xs"
                  >
                    <option value="awaiting_payment">Menunggu Pembayaran</option>
                    <option value="processing">Sedang Dikemas (Packing)</option>
                    <option value="ready_for_pickup">Siap Diambil di Toko</option>
                    <option value="shipped">Sedang Dikirim (Kurir Toko)</option>
                    <option value="delivered">Pesanan Selesai (Diterima)</option>
                    <option value="cancelled">Batalkan Pesanan</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-body">Pembayaran:</span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase ${
                    liveSelectedOrder.payment_status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {liveSelectedOrder.payment_status === 'verified' ? 'LUNAS' : 'MENUNGGU BAYAR'} ({liveSelectedOrder.payment_method})
                  </span>
                  {liveSelectedOrder.payment_status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => updatePaymentStatus(liveSelectedOrder.id, 'verified', 'Admin')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                    >
                      Konfirmasi Lunas
                    </button>
                  )}
                </div>
              </div>

              {/* Data Pelanggan & Info Pengiriman */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Info Pelanggan */}
                <div className="border border-hairline rounded-2xl p-4 bg-white space-y-2.5">
                  <div className="flex items-center justify-between border-b border-hairline pb-2">
                    <span className="font-extrabold text-[#101519] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      Data Pelanggan & Alamat
                    </span>
                    <a
                      href={getWhatsAppLink(
                        liveSelectedOrder.shipping_address.phone_number || liveSelectedOrder.customer_phone,
                        liveSelectedOrder.shipping_address.recipient_name || liveSelectedOrder.customer_name,
                        liveSelectedOrder.order_number,
                        liveSelectedOrder.total_amount
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp</span>
                    </a>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#101519]">
                      {liveSelectedOrder.shipping_address.recipient_name || liveSelectedOrder.customer_name}
                    </p>
                    <p className="text-body font-mono text-[11px]">
                      {liveSelectedOrder.shipping_address.phone_number || liveSelectedOrder.customer_phone}
                    </p>
                    <p className="text-[#101519] leading-relaxed pt-1.5">
                      {liveSelectedOrder.shipping_address.street_address}
                      {liveSelectedOrder.shipping_address.district && `, Kec. ${liveSelectedOrder.shipping_address.district}`}
                      {liveSelectedOrder.shipping_address.city && `, ${liveSelectedOrder.shipping_address.city}`}
                    </p>
                  </div>
                  {liveSelectedOrder.notes && (
                    <div className="p-2.5 bg-neutral-2/70 rounded-xl text-[11px] text-body">
                      <strong className="text-[#101519] block">Catatan Tambahan Pembeli:</strong>
                      <p className="italic">{liveSelectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Info Pengiriman Toko */}
                <div className="border border-hairline rounded-2xl p-4 bg-white space-y-3">
                  <div className="flex items-center gap-2 border-b border-hairline pb-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="font-extrabold text-[#101519]">Opsi Pengiriman & Catatan Resi</span>
                  </div>

                  <div className="p-3 bg-neutral-2/40 rounded-xl space-y-1">
                    <span className="text-body block text-[11px]">Metode yang dipilih:</span>
                    <p className="font-extrabold text-sm text-[#101519]">
                      {liveSelectedOrder.shipping_method}
                    </p>
                    <p className="text-xs text-body">
                      Ongkos Kirim: <strong className="text-[#101519]">{formatRupiah(liveSelectedOrder.shipping_fee)}</strong>
                    </p>
                  </div>

                  {/* Form Simpel Catatan Resi Toko */}
                  <form onSubmit={handleSaveTrackingNote} className="space-y-2 pt-1">
                    <label className="font-bold text-body block text-[11px]">
                      Keterangan Resi / Driver Pengantar:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: Kurir Toko USKI - Pak Budi"
                        value={trackingNote || liveSelectedOrder.shipment?.tracking_number || ''}
                        onChange={(e) => setTrackingNote(e.target.value)}
                        className="flex-1 h-9 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Rincian Produk yang Dipesan */}
              <div className="border border-hairline rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2">
                  <span className="font-extrabold text-[#101519] flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    Daftar Barang ({liveSelectedOrder.items.length} Item)
                  </span>
                </div>

                <div className="divide-y divide-hairline">
                  {liveSelectedOrder.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                          alt={item.product_name}
                          className="w-11 h-11 rounded-xl object-cover border border-hairline shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-[#101519]">{item.product_name}</h4>
                          <span className="text-body text-[11px] block mt-0.5">
                            {item.quantity} x {formatRupiah(item.price)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-extrabold text-sm text-[#101519] shrink-0">
                        {formatRupiah(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Perhitungan Biaya */}
                <div className="border-t border-hairline pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-body">
                    <span>Subtotal Produk:</span>
                    <span className="font-semibold text-[#101519]">{formatRupiah(liveSelectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span>Ongkos Kirim:</span>
                    <span className="font-semibold text-[#101519]">{formatRupiah(liveSelectedOrder.shipping_fee)}</span>
                  </div>
                  {liveSelectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Diskon Voucher ({liveSelectedOrder.voucher_code || 'PROMO'}):</span>
                      <span>-{formatRupiah(liveSelectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-hairline pt-2 text-base font-extrabold text-primary">
                    <span>Total Tagihan:</span>
                    <span>{formatRupiah(liveSelectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-5 py-3.5 border-t border-hairline flex items-center justify-between gap-3">
              <span className="text-[11px] text-body">
                Order ID: <span className="font-mono">{liveSelectedOrder.id}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-4 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold text-xs transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => setPrintInvoiceOrder(liveSelectedOrder)}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Faktur</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK FAKTUR / INVOICE RESMI                                        */}
      {/* ========================================================================= */}
      {printInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg sm:max-w-2xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <span className="text-xl font-extrabold text-primary">USKI STORE</span>
                <span className="text-xs text-body block">Faktur Penjualan Resmi</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-mono font-bold text-sm">#{printInvoiceOrder.order_number}</span>
                  <span className="text-xs text-body block">{formatDate(printInvoiceOrder.created_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintInvoiceOrder(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Info Pelanggan & Pengiriman */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-body block">Tujuan Pengiriman:</span>
                <p className="font-bold text-[#101519]">{printInvoiceOrder.shipping_address.recipient_name}</p>
                <p className="text-body">{printInvoiceOrder.shipping_address.phone_number}</p>
                <p className="text-body">{printInvoiceOrder.shipping_address.street_address}, {printInvoiceOrder.shipping_address.city}</p>
              </div>
              <div className="sm:text-right">
                <span className="font-bold text-body block">Metode Pembayaran:</span>
                <p className="font-bold text-[#101519] uppercase">{printInvoiceOrder.payment_method}</p>
                <span className="font-bold text-body block mt-2">Metode Pengiriman:</span>
                <p className="font-bold text-primary">{printInvoiceOrder.shipping_method}</p>
              </div>
            </div>

            {/* Tabel Item */}
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full min-w-[320px] text-xs text-left">
                <thead>
                  <tr className="border-b border-hairline text-body font-bold">
                    <th className="py-2">Item Barang</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Harga</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {printInvoiceOrder.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 font-bold text-[#101519]">{it.product_name}</td>
                      <td className="py-2.5 text-center">{it.quantity}</td>
                      <td className="py-2.5 text-right">{formatRupiah(it.price)}</td>
                      <td className="py-2.5 text-right font-bold">{formatRupiah(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Pembayaran */}
            <div className="space-y-1.5 text-xs max-w-xs ml-auto border-t border-hairline pt-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(printInvoiceOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span>{formatRupiah(printInvoiceOrder.shipping_fee)}</span>
              </div>
              {printInvoiceOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(printInvoiceOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-hairline pt-1 text-sm font-extrabold text-primary">
                <span>Total Tagihan:</span>
                <span>{formatRupiah(printInvoiceOrder.total_amount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPrintInvoiceOrder(null)}
                className="px-4 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] font-bold text-xs rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Faktur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK LABEL PENGIRIMAN (THERMAL 100x150 mm)                         */}
      {/* ========================================================================= */}
      {printShippingLabelOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-2 print:hidden">
              <span className="text-xs font-bold text-body">Label Pengiriman (Thermal)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintShippingLabelOrder(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-body hover:bg-neutral-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Label Card Body */}
            <div className="border-2 border-black p-4 space-y-3 font-sans text-black">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase text-primary">USKI STORE</h4>
                  <p className="text-[10px] font-bold">{printShippingLabelOrder.shipping_method}</p>
                </div>
                {printShippingLabelOrder.payment_method === 'cod' ? (
                  <div className="px-2 py-1 bg-black text-white font-black text-xs rounded">
                    COD: {formatRupiah(printShippingLabelOrder.total_amount)}
                  </div>
                ) : (
                  <div className="px-2 py-0.5 border border-black font-black text-[10px] uppercase">
                    NON-COD (LUNAS)
                  </div>
                )}
              </div>

              {/* Barcode Area */}
              <div className="text-center py-1 border-b-2 border-black space-y-0.5">
                <div className="font-mono tracking-widest text-lg font-black bg-neutral-100 py-1 border border-black/30">
                  ||| | |||| | ||||| |||
                </div>
                <p className="font-mono font-bold text-xs tracking-wider">
                  {printShippingLabelOrder.shipment?.tracking_number || printShippingLabelOrder.order_number}
                </p>
              </div>

              {/* Penerima */}
              <div className="border-b-2 border-black pb-2 space-y-0.5 text-xs">
                <span className="font-bold uppercase text-[10px] text-gray-600 block">PENERIMA:</span>
                <p className="font-extrabold text-sm text-black">{printShippingLabelOrder.shipping_address.recipient_name}</p>
                <p className="font-bold text-xs">{printShippingLabelOrder.shipping_address.phone_number}</p>
                <p className="text-[11px] leading-snug">
                  {printShippingLabelOrder.shipping_address.street_address}, {printShippingLabelOrder.shipping_address.district || ''}, {printShippingLabelOrder.shipping_address.city}
                </p>
              </div>

              {/* Pengirim */}
              <div className="border-b border-black pb-2 space-y-0.5 text-[11px]">
                <span className="font-bold uppercase text-[9px] text-gray-600 block">PENGIRIM:</span>
                <p className="font-bold">USKI STORE (0859-6724-9718)</p>
                <p className="text-[10px] text-gray-700">Margonda Raya, Depok</p>
              </div>

              {/* Isi Paket */}
              <div className="text-[10px] space-y-0.5">
                <p><strong>Isi Paket:</strong> {printShippingLabelOrder.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}</p>
                {printShippingLabelOrder.notes && (
                  <p className="italic text-gray-700"><strong>Catatan:</strong> {printShippingLabelOrder.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
