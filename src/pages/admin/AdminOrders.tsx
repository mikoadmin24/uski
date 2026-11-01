import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Truck,
  Printer,
  ChevronDown,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Eye,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Check,
  Navigation,
  ShieldCheck,
  ArrowRight,
  BatteryCharging,
  Gauge,
  RefreshCw,
  Send,
  AlertCircle,
  PackageCheck,
  Receipt,
  User,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useCourierStore } from '@/store/courierStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { OrderStatus, Order, PaymentStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, updatePaymentStatus, updateShipmentTracking } = useOrderStore();
  const { couriers, assignDelivery, reassignDelivery } = useCourierStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Single Unified Modal State
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Assignment & Reassign States inside Single Modal
  const [assignCourierId, setAssignCourierId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignToCourierId, setReassignToCourierId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Manual Tracking Resi State inside Single Modal
  const [manualTrackingNo, setManualTrackingNo] = useState('');
  const [manualCourierName, setManualCourierName] = useState('J&T Express');

  // Quick Separate Modals for Print (Triggerable from table or detail modal)
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState<Order | null>(null);
  const [printShippingLabelOrder, setPrintShippingLabelOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Keep live reference to selected order if status/tracking changes
  const liveSelectedOrder = selectedOrderDetail
    ? orders.find((o) => o.id === selectedOrderDetail.id) || selectedOrderDetail
    : null;

  // Find courier currently assigned to this order
  const assignedCourier = liveSelectedOrder
    ? couriers.find(
        (c) =>
          c.active_delivery?.order_id === liveSelectedOrder.id ||
          c.active_delivery?.order_number === liveSelectedOrder.order_number
      )
    : null;

  // Handle assigning delivery to a store courier
  const handleAssignCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedOrder || !assignCourierId) return;

    const courier = couriers.find((c) => c.id === assignCourierId);
    if (!courier) return;

    const trackingNumber = `USKI-TOKO-${liveSelectedOrder.order_number.replace(/[^0-9]/g, '').slice(-4) || '88'}`;
    const courierLabel = `Kurir Toko USKI - ${courier.name} (${courier.vehicle_plate})`;

    const deliveryPayload = {
      order_id: liveSelectedOrder.id,
      order_number: liveSelectedOrder.order_number,
      recipient_name: liveSelectedOrder.shipping_address.recipient_name,
      recipient_phone: liveSelectedOrder.shipping_address.phone_number,
      destination_address: `${liveSelectedOrder.shipping_address.street_address}, ${liveSelectedOrder.shipping_address.district || ''}, ${liveSelectedOrder.shipping_address.city}`,
      destination_coords: { lat: 0, lng: 0 },
      eta_minutes: 0,
      distance_km: 0,
      delivery_notes: assignNotes || liveSelectedOrder.notes || 'Hati-hati dalam pengantaran',
      status: 'assigned' as const,
    };

    assignDelivery(assignCourierId, deliveryPayload);

    updateShipmentTracking(
      liveSelectedOrder.id,
      trackingNumber,
      courierLabel
    );

    // Direct write to Supabase orders & couriers tables
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const nowIso = new Date().toISOString();
      const primaryOrderUpdates = {
        courier_id: assignCourierId,
        courier_name: courier.name,
        tracking_number: trackingNumber,
        order_status: 'shipped',
        status: 'shipped',
        dispatched_at: nowIso,
        updated_at: nowIso,
      };

      Promise.resolve(
        client
          .from('orders')
          .update(primaryOrderUpdates)
          .eq('id', liveSelectedOrder.id)
      )
        .then(({ error }) => {
          if (error && error.code === 'PGRST204') {
            return client
              .from('orders')
              .update({
                status: 'shipped',
                courier_name: courier.name,
                tracking_number: trackingNumber,
                updated_at: nowIso,
              })
              .eq('id', liveSelectedOrder.id);
          }
        })
        .catch((err: any) => console.error('Failed to sync order assignment to Supabase:', err));

      Promise.resolve(
        client
          .from('couriers')
          .update({
            status: 'delivering',
            active_delivery: deliveryPayload,
            updated_at: nowIso,
          })
          .eq('id', assignCourierId)
      ).catch((err: any) => console.error('Failed to sync courier status to Supabase:', err));
    }

    setAssignCourierId('');
    setAssignNotes('');
  };

  // Handle reassigning delivery to another store courier
  const handleReassignCourier = (currentCourierId: string) => {
    if (!liveSelectedOrder || !reassignToCourierId) return;

    const targetCourier = couriers.find((c) => c.id === reassignToCourierId);
    if (!targetCourier) return;

    reassignDelivery(
      liveSelectedOrder.id,
      currentCourierId,
      reassignToCourierId,
      reassignReason || 'Pengalihan penugasan kurir oleh Admin Toko'
    );

    updateShipmentTracking(
      liveSelectedOrder.id,
      liveSelectedOrder.shipment?.tracking_number || `USKI-TOKO-${liveSelectedOrder.order_number.slice(-4)}`,
      `Kurir Toko USKI - ${targetCourier.name} (${targetCourier.vehicle_plate})`
    );

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const nowIso = new Date().toISOString();
      Promise.resolve(
        client
          .from('orders')
          .update({
            courier_id: reassignToCourierId,
            courier_name: targetCourier.name,
            updated_at: nowIso,
          })
          .eq('id', liveSelectedOrder.id)
      )
        .then(({ error }) => {
          if (error && error.code === 'PGRST204') {
            return client
              .from('orders')
              .update({
                courier_name: targetCourier.name,
                updated_at: nowIso,
              })
              .eq('id', liveSelectedOrder.id);
          }
        })
        .catch((err: any) => console.error('Failed to sync reassigned order to Supabase:', err));
    }

    setIsReassigning(false);
    setReassignToCourierId('');
    setReassignReason('');
  };

  // Handle manual resi input for 3rd party expedition
  const handleSaveManualResi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveSelectedOrder || !manualTrackingNo.trim()) return;

    updateShipmentTracking(
      liveSelectedOrder.id,
      manualTrackingNo.trim().toUpperCase(),
      manualCourierName || liveSelectedOrder.shipping_method || 'Ekspedisi Reguler'
    );

    updateOrderStatus(liveSelectedOrder.id, 'shipped');
    setManualTrackingNo('');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'awaiting_payment':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-300">Menunggu Bayar</span>;
      case 'awaiting_verification':
        return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold border border-yellow-300">Verifikasi Pembayaran</span>;
      case 'processing':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-300">Sedang Dikemas</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-300">Sedang Dikirim</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold border border-green-300">Selesai Diterima</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold border border-rose-300">Dibatalkan</span>;
      default:
        return <span className="px-2.5 py-1 bg-neutral-2 text-body rounded-lg text-xs font-bold border border-hairline">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Manajemen Pesanan & Penugasan Kurir
          </h1>
          <p className="text-xs text-body mt-1">
            Klik salah satu pesanan untuk membuka detail terpadu, penugasan kurir toko real-time, dan cetak invoice/resi
          </p>
        </div>
      </div>

      {/* Quick Status Pill Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `Semua Pesanan (${orders.length})` },
          {
            id: 'processing',
            label: `Perlu Dikemas / Packing (${orders.filter((o) => o.status === 'processing').length})`,
            highlight: true,
          },
          {
            id: 'awaiting_payment',
            label: `Menunggu Bayar (${orders.filter((o) => o.status === 'awaiting_payment').length})`,
          },
          {
            id: 'shipped',
            label: `Sedang Dikirim (${orders.filter((o) => o.status === 'shipped').length})`,
          },
          {
            id: 'delivered',
            label: `Selesai (${orders.filter((o) => o.status === 'delivered').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-hairline rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nomor order, nama pelanggan, atau no. telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
        >
          <option value="all">Semua Status Pesanan</option>
          <option value="awaiting_payment">Menunggu Pembayaran</option>
          <option value="awaiting_verification">Menunggu Verifikasi</option>
          <option value="processing">Sedang Diproses / Dikemas</option>
          <option value="shipped">Sedang Dikirim (In Transit)</option>
          <option value="delivered">Pesanan Selesai</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="px-4 py-2 bg-neutral-2/40 border-b border-hairline text-xs text-body flex items-center justify-between font-medium">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <Eye className="w-4 h-4" />
            Tips: Klik baris pesanan atau tombol &quot;Detail & Kurir&quot; untuk membuka popup terpadu
          </span>
          <span className="text-[11px] text-body hidden sm:inline">
            Menampilkan {filteredOrders.length} pesanan
          </span>
        </div>
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left min-w-[760px]">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Pesanan</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Status Order</th>
                <th className="py-3 px-4 text-center">Kurir / Logistik</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredOrders.map((ord) => {
                // Check if this order is actively handled by a store courier
                const ordCourier = couriers.find(
                  (c) =>
                    c.active_delivery?.order_id === ord.id ||
                    c.active_delivery?.order_number === ord.order_number
                );

                return (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrderDetail(ord)}
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
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-body uppercase">{ord.payment_method.replace('_', ' ')}</span>
                      {ord.payment_status === 'verified' && (
                        <span className="block text-[10px] text-emerald-600 font-bold">● Lunas</span>
                      )}
                      {ord.payment_status === 'pending' && (
                        <span className="block text-[10px] text-amber-600 font-bold">● Menunggu</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          ord.status === 'awaiting_verification'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : ord.status === 'processing'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : ord.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : ord.status === 'delivered'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-neutral-2 text-body border-hairline'
                        }`}
                      >
                        <option value="awaiting_payment">Menunggu Pembayaran</option>
                        <option value="awaiting_verification">Menunggu Verifikasi</option>
                        <option value="processing">Sedang Dikemas (Processing)</option>
                        <option value="shipped">Sedang Dikirim (Shipped)</option>
                        <option value="delivered">Pesanan Selesai (Delivered)</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {ordCourier ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded font-bold text-[11px]">
                            <Truck className="w-3 h-3" />
                            {ordCourier.name.split(' ')[0]} ({ordCourier.vehicle_plate.split(' ')[0]})
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Sedang Diantar Toko
                          </span>
                        </div>
                      ) : ord.shipment?.tracking_number ? (
                        <div className="font-mono">
                          <span className="font-bold text-primary block">{ord.shipment.tracking_number}</span>
                          <span className="text-[10px] text-body">{ord.shipment.courier_name || ord.shipping_method}</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-neutral-2 text-body rounded text-[10px] font-bold">
                          Belum Ada Kurir / Resi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedOrderDetail(ord)}
                          title="Buka Satu Modal Detail Lengkap & Kurir"
                          className="px-2.5 py-1 bg-primary text-white hover:bg-primary-hover rounded-lg font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderDetail(null);
                            setPrintShippingLabelOrder(null);
                            setPrintInvoiceOrder(ord);
                          }}
                          title="Cetak Faktur / Invoice"
                          className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrderDetail(null);
                            setPrintInvoiceOrder(null);
                            setPrintShippingLabelOrder(ord);
                          }}
                          title="Cetak Label Resi Thermal (100x150mm)"
                          className="p-1.5 hover:text-green-600 text-body hover:bg-neutral-2 rounded-lg transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SATU POPUP LENGKAP: DETAIL PESANAN, STATUS & DETAIL PENUGASAN KURIR TOKO */}
      {/* ========================================================================= */}
      {liveSelectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Modal Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-[#101519] font-mono">
                      #{liveSelectedOrder.order_number}
                    </h2>
                    {getStatusBadge(liveSelectedOrder.status)}
                  </div>
                  <p className="text-xs text-body mt-0.5 truncate">
                    Dibuat pada {formatDate(liveSelectedOrder.created_at)} • Pemesan: <span className="font-bold text-[#101519]">{liveSelectedOrder.customer_name}</span>
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = liveSelectedOrder;
                    setSelectedOrderDetail(null);
                    setPrintShippingLabelOrder(null);
                    setPrintInvoiceOrder(ord);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-neutral-2 hover:bg-primary hover:text-white rounded-xl text-xs font-bold text-body flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ord = liveSelectedOrder;
                    setSelectedOrderDetail(null);
                    setPrintInvoiceOrder(null);
                    setPrintShippingLabelOrder(ord);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-neutral-2 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-body flex items-center gap-1.5 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Label Thermal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderDetail(null);
                    setIsReassigning(false);
                  }}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 hover:bg-neutral-2 rounded-xl text-body hover:text-[#101519] transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1">

              {/* Status Updater Bar */}
              <div className="bg-neutral-2/40 border border-hairline rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-body">Ubah Status Pesanan:</span>
                  <select
                    value={liveSelectedOrder.status}
                    onChange={(e) => updateOrderStatus(liveSelectedOrder.id, e.target.value as OrderStatus)}
                    className="h-8 px-3 bg-white border border-hairline rounded-lg font-bold text-primary focus:outline-none focus:border-primary shadow-xs"
                  >
                    <option value="awaiting_payment">Menunggu Pembayaran</option>
                    <option value="awaiting_verification">Menunggu Verifikasi Pembayaran</option>
                    <option value="processing">Sedang Diproses / Dikemas</option>
                    <option value="shipped">Sedang Dikirim (Shipped)</option>
                    <option value="delivered">Pesanan Selesai (Delivered)</option>
                    <option value="cancelled">Batalkan Pesanan</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-body font-semibold">Status Pembayaran:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    liveSelectedOrder.payment_status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {liveSelectedOrder.payment_status} ({liveSelectedOrder.payment_method})
                  </span>
                  {liveSelectedOrder.payment_status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => updatePaymentStatus(liveSelectedOrder.id, 'verified', 'Admin USKI')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                    >
                      Tandai Lunas
                    </button>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BAGIAN 1: KOTAK DETAIL KURIR YANG DITUGASKAN (REAL-TIME GPS & DISPATCH)  */}
              {/* ========================================================================= */}
              <div className="bg-white border-2 border-primary/20 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#101519] flex items-center gap-2">
                        <span>Penugasan & Detail Kurir Pengiriman</span>
                        {assignedCourier ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            Kurir Aktif Ditugaskan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold rounded-full">
                            Belum Ada Kurir Ditugaskan
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-body">
                        {assignedCourier
                          ? 'Kurir toko sedang ditugaskan menjalankan pengantaran pesanan ini'
                          : 'Pilih kurir toko USKI atau masukkan nomor resi pihak ketiga untuk pengiriman pesanan'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* KONDISI A: KURIR SUDAH DITUGASKAN */}
                {assignedCourier ? (
                  <div className="space-y-4">
                    {/* Courier Identity Card */}
                    <div className="bg-neutral-2/50 border border-hairline rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img
                            src={assignedCourier.avatar_url}
                            alt={assignedCourier.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-[#101519]">{assignedCourier.name}</h4>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                              {assignedCourier.vehicle_type === 'motorcycle' ? 'Motor' : 'Mobil Van'}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-semibold text-body mt-0.5">
                            {assignedCourier.vehicle_plate}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`https://wa.me/${assignedCourier.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(assignedCourier.name)},%20update%20pengiriman%20pesanan%20${liveSelectedOrder.order_number}%20bagaimana%20ya?`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Hubungi WhatsApp ({assignedCourier.phone})</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Practical Delivery Metrics */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="bg-white border border-hairline px-3 py-2 rounded-xl text-center min-w-[90px]">
                          <span className="text-[10px] text-body block font-medium">Mulai Antar</span>
                          <span className="font-black text-sm text-[#101519]">
                            {assignedCourier.active_delivery?.started_at || '-'}
                          </span>
                        </div>
                        <div className="bg-white border border-hairline px-3 py-2 rounded-xl text-center min-w-[90px]">
                          <span className="text-[10px] text-body block font-medium">Estimasi Tiba</span>
                          <span className="font-black text-sm text-primary">
                            {assignedCourier.active_delivery?.eta_minutes ? `~${assignedCourier.active_delivery.eta_minutes} Menit` : '-'}
                          </span>
                        </div>
                        <div className="bg-white border border-hairline px-3 py-2 rounded-xl text-center min-w-[90px]">
                          <span className="text-[10px] text-body block font-medium">Jarak Tempuh</span>
                          <span className="font-black text-sm text-[#101519]">
                            {assignedCourier.active_delivery?.distance_km ? `${assignedCourier.active_delivery.distance_km} km` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Progress & Destination Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Destination Box */}
                      <div className="bg-neutral-2/40 border border-hairline rounded-2xl p-3.5 space-y-2">
                        <span className="font-bold text-[#101519] flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary" />
                          Tujuan Pengantaran Paket
                        </span>
                        <p className="font-semibold text-xs text-[#101519] leading-relaxed bg-white p-2.5 rounded-xl border border-hairline/60">
                          {assignedCourier.active_delivery?.destination_address || `${liveSelectedOrder.shipping_address.street_address}, ${liveSelectedOrder.shipping_address.city}`}
                        </p>
                        {assignedCourier.active_delivery?.delivery_notes && (
                          <p className="text-[11px] text-body italic">
                            Catatan Kurir: {assignedCourier.active_delivery.delivery_notes}
                          </p>
                        )}
                      </div>

                      {/* Delivery Status & Progress */}
                      <div className="bg-neutral-2/40 border border-hairline rounded-2xl p-3.5 space-y-2.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-[#101519]">Progres Pengantaran</span>
                            <span className="font-extrabold text-primary">
                              {assignedCourier.active_delivery?.progress_pct || 0}%
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${assignedCourier.active_delivery?.progress_pct || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-body">Status Tahapan:</span>
                          <span className="px-2 py-0.5 rounded font-bold text-xs bg-purple-100 text-purple-900 border border-purple-200 uppercase">
                            {assignedCourier.active_delivery?.status.replace('_', ' ') || 'Sedang Diantar'}
                          </span>
                        </div>

                        {/* Reassign Button Toggle */}
                        <div className="pt-2 border-t border-hairline flex items-center justify-between">
                          <span className="text-[11px] text-body">Butuh ganti kurir?</span>
                          <button
                            type="button"
                            onClick={() => setIsReassigning(!isReassigning)}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-2 text-rose-600 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{isReassigning ? 'Tutup Reassign' : 'Alihkan ke Kurir Lain'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Form Reassign Kurir (jika di-klik) */}
                    {isReassigning && (
                      <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Alihkan Pesanan #{liveSelectedOrder.order_number} ke Kurir Lain (Reassign)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-body block mb-1">Pilih Kurir Baru Pengganti:</label>
                            <select
                              value={reassignToCourierId}
                              onChange={(e) => setReassignToCourierId(e.target.value)}
                              className="w-full h-9 px-3 bg-white border border-hairline rounded-xl font-semibold"
                            >
                              <option value="">-- Pilih Kurir Standby --</option>
                              {couriers
                                .filter((c) => c.id !== assignedCourier.id)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.vehicle_plate}) - {c.status === 'available' ? 'Standby (Siap)' : 'Sedang Kirim'}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-body block mb-1">Alasan Pengalihan Tugas:</label>
                            <input
                              type="text"
                              placeholder="Contoh: Kendaraan mogok / rute lebih dekat kurir lain"
                              value={reassignReason}
                              onChange={(e) => setReassignReason(e.target.value)}
                              className="w-full h-9 px-3 bg-white border border-hairline rounded-xl font-semibold"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsReassigning(false)}
                            className="px-3 py-1.5 bg-white border border-hairline rounded-xl font-bold text-body hover:bg-neutral-2"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={!reassignToCourierId}
                            onClick={() => handleReassignCourier(assignedCourier.id)}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
                          >
                            Konfirmasi Alihkan Kurir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* KONDISI B: BELUM DITUGASKAN KURIR -> FORM PENUGASAN CEPAT */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Form Penugasan Kurir Toko USKI */}
                      <form onSubmit={handleAssignCourier} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3 text-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-primary">
                          <UserCheck className="w-4 h-4" />
                          <span>Tugaskan ke Kurir Internal Toko USKI</span>
                        </div>
                        <p className="text-[11px] text-body">
                          Paket akan diantar langsung oleh kurir toko dan terlacak GPS real-time.
                        </p>

                        <div>
                          <label className="font-bold text-body block mb-1">Pilih Kurir Toko yang Tersedia:</label>
                          <select
                            required
                            value={assignCourierId}
                            onChange={(e) => setAssignCourierId(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-hairline rounded-xl font-semibold"
                          >
                            <option value="">-- Pilih Kurir --</option>
                            {couriers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} • {c.vehicle_plate} [{c.status === 'available' ? 'Siap / Standby' : 'Sedang Mengantar'}]
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-body block mb-1">Catatan Pengantaran (Opsional):</label>
                          <input
                            type="text"
                            placeholder="Contoh: Titip di satpam / barang pecah belah"
                            value={assignNotes}
                            onChange={(e) => setAssignNotes(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-hairline rounded-xl font-semibold"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!assignCourierId}
                          className="w-full py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Tugaskan Kurir Sekarang</span>
                        </button>
                      </form>

                      {/* Form Input Resi Ekspedisi Pihak Ketiga (J&T / SiCepat / dll) */}
                      <form onSubmit={handleSaveManualResi} className="bg-neutral-2/40 border border-hairline rounded-2xl p-4 space-y-3 text-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-[#101519]">
                          <Truck className="w-4 h-4" />
                          <span>Atau Kirim via Ekspedisi Pihak Ketiga</span>
                        </div>
                        <p className="text-[11px] text-body">
                          Gunakan ini jika pesanan dikirim lewat J&T, SiCepat, Sentral Kargo, atau kurir lain.
                        </p>

                        <div>
                          <label className="font-bold text-body block mb-1">Nama Jasa Ekspedisi:</label>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {['J&T Express', 'SiCepat', 'Sentral Kargo', 'JNE'].map((exp) => (
                              <button
                                key={exp}
                                type="button"
                                onClick={() => setManualCourierName(exp)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  manualCourierName === exp ? 'bg-primary text-white' : 'bg-white border border-hairline text-body'
                                }`}
                              >
                                {exp}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={manualCourierName}
                            onChange={(e) => setManualCourierName(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-hairline rounded-xl font-semibold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-body block mb-1">Nomor Resi Pelacakan:</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: JNT-9821921029"
                            value={manualTrackingNo}
                            onChange={(e) => setManualTrackingNo(e.target.value)}
                            className="w-full h-9 px-3 bg-white border border-hairline rounded-xl font-mono font-bold uppercase"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!manualTrackingNo.trim()}
                          className="w-full py-2 bg-neutral-900 hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Simpan Resi Ekspedisi</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* BAGIAN 2: DETAIL ITEM BARANG & RINCIAN HARGA                              */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Kolom Kiri 2/3: Item Pesanan */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="border border-hairline rounded-3xl p-5 bg-white shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                      <h3 className="font-extrabold text-sm text-[#101519] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-primary" />
                        <span>Daftar Barang yang Dipesan ({liveSelectedOrder.items.length} Item)</span>
                      </h3>
                      <span className="text-xs text-body font-mono">
                        SKU Terdaftar
                      </span>
                    </div>

                    <div className="divide-y divide-hairline">
                      {liveSelectedOrder.items.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                              alt={item.product_name}
                              className="w-12 h-12 rounded-xl object-cover border border-hairline flex-shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-[#101519] line-clamp-1">{item.product_name}</h4>
                              <div className="flex items-center gap-2 text-[11px] text-body mt-0.5">
                                {item.variant_name && (
                                  <span className="px-2 py-0.5 bg-neutral-2 rounded text-[#101519] font-medium">
                                    {item.variant_name}
                                  </span>
                                )}
                                <span className="font-mono text-[10px]">SKU: {item.sku}</span>
                              </div>
                              <span className="text-body font-medium text-[11px]">
                                {item.quantity} x {formatRupiah(item.price)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 font-extrabold text-sm text-[#101519]">
                            {formatRupiah(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Rincian Perhitungan Biaya */}
                    <div className="border-t border-hairline pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-body">
                        <span>Subtotal Produk:</span>
                        <span className="font-semibold text-[#101519]">{formatRupiah(liveSelectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-body">
                        <span>Ongkos Kirim ({liveSelectedOrder.shipping_method}):</span>
                        <span className="font-semibold text-[#101519]">{formatRupiah(liveSelectedOrder.shipping_fee)}</span>
                      </div>
                      {liveSelectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Diskon Voucher ({liveSelectedOrder.voucher_code || 'PROMO'}):</span>
                          <span>-{formatRupiah(liveSelectedOrder.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-hairline pt-2 text-base font-extrabold text-primary">
                        <span>Total Pembayaran:</span>
                        <span>{formatRupiah(liveSelectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan 1/3: Alamat & Penerima + Pembayaran */}
                <div className="space-y-4">
                  {/* Card Alamat Penerima */}
                  <div className="border border-hairline rounded-3xl p-5 bg-white shadow-xs space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-extrabold text-[#101519] border-b border-hairline pb-2.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Alamat Tujuan Pengiriman</span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-sm text-[#101519]">
                        {liveSelectedOrder.shipping_address.recipient_name}
                      </p>
                      <p className="text-body font-mono text-[11px] flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>{liveSelectedOrder.shipping_address.phone_number}</span>
                      </p>
                      <p className="text-[#101519] leading-relaxed pt-1">
                        {liveSelectedOrder.shipping_address.street_address}
                        {liveSelectedOrder.shipping_address.district && `, Kec. ${liveSelectedOrder.shipping_address.district}`}
                        {`, ${liveSelectedOrder.shipping_address.city}`}
                        {liveSelectedOrder.shipping_address.province && `, ${liveSelectedOrder.shipping_address.province}`}
                        {liveSelectedOrder.shipping_address.postal_code && ` (${liveSelectedOrder.shipping_address.postal_code})`}
                      </p>
                    </div>

                    {liveSelectedOrder.notes && (
                      <div className="p-2.5 bg-neutral-2/60 rounded-xl border border-hairline/80 text-[11px]">
                        <strong className="text-body block">Catatan Pembeli:</strong>
                        <p className="italic text-[#101519]">{liveSelectedOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Info Pembayaran & Resi */}
                  <div className="border border-hairline rounded-3xl p-5 bg-white shadow-xs space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-extrabold text-[#101519] border-b border-hairline pb-2.5">
                      <Receipt className="w-4 h-4 text-primary" />
                      <span>Informasi Pembayaran</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-body">Metode:</span>
                        <span className="font-bold text-[#101519] uppercase">{liveSelectedOrder.payment_method.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-body">Status:</span>
                        <span className="font-bold text-emerald-600 uppercase">{liveSelectedOrder.payment_status}</span>
                      </div>
                      {liveSelectedOrder.shipment?.tracking_number && (
                        <div className="flex justify-between border-t border-hairline pt-1.5">
                          <span className="text-body">No. Resi:</span>
                          <span className="font-mono font-bold text-primary">{liveSelectedOrder.shipment.tracking_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-t border-hairline flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="text-xs text-body text-center sm:text-left">
                Order ID: <span className="font-mono">{liveSelectedOrder.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold text-xs transition-colors text-center"
                >
                  Tutup Popup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ord = liveSelectedOrder;
                    setSelectedOrderDetail(null);
                    setPrintInvoiceOrder(null);
                    setPrintShippingLabelOrder(ord);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Label Thermal</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {printInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg sm:max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-hairline touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <span className="text-xl font-extrabold text-primary">USKI STORE</span>
                <span className="text-xs text-body block">Faktur & Surat Jalan Resmi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="font-mono font-bold text-sm">{printInvoiceOrder.order_number}</span>
                  <span className="text-xs text-body block">{formatDate(printInvoiceOrder.created_at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintInvoiceOrder(null)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recipient info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div>
                <span className="font-bold text-body block">Penerima:</span>
                <p className="font-bold text-[#101519]">{printInvoiceOrder.shipping_address.recipient_name}</p>
                <p className="text-body">{printInvoiceOrder.shipping_address.phone_number}</p>
                <p className="text-body">{printInvoiceOrder.shipping_address.street_address}, {printInvoiceOrder.shipping_address.city}</p>
              </div>
              <div className="sm:text-right">
                <span className="font-bold text-body block">Metode Pembayaran:</span>
                <p className="font-bold text-[#101519] uppercase">{printInvoiceOrder.payment_method}</p>
                <span className="font-bold text-body block mt-2">Logistik:</span>
                <p className="font-bold text-primary">{printInvoiceOrder.shipping_method}</p>
              </div>
            </div>

            {/* Table of items */}
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full min-w-[320px] text-xs text-left">
                <thead>
                  <tr className="border-b border-hairline text-body font-bold">
                    <th className="py-2">Item Barang</th>
                    <th className="py-2 text-center">Jumlah</th>
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

            {/* Total calculation */}
            <div className="space-y-1.5 text-xs max-w-xs ml-auto border-t border-hairline pt-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(printInvoiceOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span>{formatRupiah(printInvoiceOrder.shipping_fee)}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-1 text-sm font-extrabold text-primary">
                <span>Total Tagihan:</span>
                <span>{formatRupiah(printInvoiceOrder.total_amount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const ord = printInvoiceOrder;
                  setPrintInvoiceOrder(null);
                  setSelectedOrderDetail(ord);
                }}
                className="px-4 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] font-bold text-xs rounded-xl transition-colors"
              >
                Kembali ke Detail
              </button>
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
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Thermal Shipping Label (100x150 mm) Modal */}
      {printShippingLabelOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl print:m-0 print:p-0 print:border-none print:shadow-none touch-scroll border border-hairline">
            {/* Header Controls (hidden on print) */}
            <div className="flex items-center justify-between border-b border-hairline pb-2 print:hidden">
              <span className="text-xs font-bold text-body">Label Thermal (100x150 mm)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = printShippingLabelOrder;
                    setPrintShippingLabelOrder(null);
                    setSelectedOrderDetail(ord);
                  }}
                  className="px-3 py-1.5 bg-neutral-2 hover:bg-neutral-3 text-[#101519] font-bold text-xs rounded-lg transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak Label</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintShippingLabelOrder(null)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 bg-neutral-2 hover:bg-neutral-3 text-body hover:text-[#101519] rounded-lg transition-colors touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Label Card Body (Thermal 100x150mm format) */}
            <div className="border-2 border-black p-4 space-y-3 font-sans text-black">
              {/* Top Banner: Courier & Logistics Name */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase text-primary">USKI STORE</h4>
                  <p className="text-[10px] font-bold">EKSPEDISI: {printShippingLabelOrder.shipment?.courier_name || printShippingLabelOrder.shipping_method}</p>
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

              {/* Recipient (Penerima) */}
              <div className="border-b-2 border-black pb-2 space-y-0.5 text-xs">
                <span className="font-bold uppercase text-[10px] text-gray-600 block">PENERIMA:</span>
                <p className="font-extrabold text-sm text-black">{printShippingLabelOrder.shipping_address.recipient_name}</p>
                <p className="font-bold text-xs">{printShippingLabelOrder.shipping_address.phone_number}</p>
                <p className="text-[11px] leading-snug">
                  {printShippingLabelOrder.shipping_address.street_address}, {printShippingLabelOrder.shipping_address.district}, {printShippingLabelOrder.shipping_address.city}, {printShippingLabelOrder.shipping_address.province} ({printShippingLabelOrder.shipping_address.postal_code})
                </p>
              </div>

              {/* Sender (Pengirim) */}
              <div className="border-b border-black pb-2 space-y-0.5 text-[11px]">
                <span className="font-bold uppercase text-[9px] text-gray-600 block">PENGIRIM:</span>
                <p className="font-bold">USKI STORE (0859-6724-9718)</p>
                <p className="text-[10px] text-gray-700">Jl. Margonda Raya No. 102, Depok, Jawa Barat</p>
              </div>

              {/* Package Content & Notes */}
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