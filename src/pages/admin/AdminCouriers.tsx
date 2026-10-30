import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  History,
  X,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  UserCheck,
  Send,
  Eye,
  Check,
  Filter,
  Package,
} from 'lucide-react';
import { useCourierStore } from '@/store/courierStore';
import { useOrderStore } from '@/store/orderStore';
import { Courier } from '@/types';
import { formatDate } from '@/lib/utils';
import { dbService, supabase, isSupabaseConfigured } from '@/lib/supabase';

export const AdminCouriers: React.FC = () => {
  const {
    couriers,
    reassignDelivery,
    toggleCourierStatus,
    addCourier,
    updateCourier,
    setCouriersFromSupabase,
  } = useCourierStore();
  const { orders } = useOrderStore();

  // Active Tab: 'fleet' (Manajemen Kurir) | 'history' (Histori & Bukti Serah Terima)
  const [activeTab, setActiveTab] = useState<'fleet' | 'history'>('fleet');

  // Search & Filter Kurir
  const [courierSearch, setCourierSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'delivering' | 'off_duty'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);

  // Form States for Add / Edit Courier
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formVehicleType, setFormVehicleType] = useState<'motorcycle' | 'van'>('motorcycle');
  const [formPlate, setFormPlate] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  // Modal: Reassign Courier
  const [reassignSourceCourier, setReassignSourceCourier] = useState<Courier | null>(null);
  const [targetCourierId, setTargetCourierId] = useState('');
  const [reassignReason, setReassignReason] = useState('Pengalihan rute pengiriman / kendala kurir');

  // Tab 2: Simple History & Delivery Proof Filter States
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('all'); // 'all' or 'YYYY-MM-DD'
  const [historyFilterCourier, setHistoryFilterCourier] = useState<string>('all');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('all');
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<any | null>(null);
  const [deliveryRecords, setDeliveryRecords] = useState<any[]>([]);

  // 1. Fetch Couriers live from Supabase
  useEffect(() => {
    dbService.couriers.getAll().then((data) => {
      if (data && data.length > 0) {
        setCouriersFromSupabase(data);
      }
    }).catch((err) => console.error('Failed to fetch couriers from Supabase:', err));
  }, [setCouriersFromSupabase]);

  // 2. Fetch Live Delivery Proofs & Completed Deliveries from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchDeliveryHistory = async () => {
      try {
        const proofs = await dbService.deliveryProofs.getAll().catch(() => null);
        const liveRecords: any[] = [];

        if (proofs && Array.isArray(proofs) && proofs.length > 0) {
          for (const p of proofs) {
            const ord = orders.find((o) => o.id === p.order_id);
            const cour = couriers.find((c) => c.id === p.courier_id);
            const dateObj = p.delivered_at || p.created_at ? new Date(p.delivered_at || p.created_at!) : new Date();
            const dateIso = dateObj.toISOString().split('T')[0];
            const dateDisplay = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
            const timeDisplay = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

            liveRecords.push({
              id: p.id || `proof-${p.order_id}`,
              order_id: p.order_id,
              order_number: ord?.order_number || `ORD-${p.order_id.slice(-6)}`,
              date_iso: dateIso,
              date_display: dateDisplay,
              time_display: timeDisplay,
              courier_id: p.courier_id,
              courier_name: cour?.name || ord?.shipment?.courier_name || 'Kurir Toko USKI',
              courier_plate: cour?.vehicle_plate || 'Armada Toko',
              recipient_name: p.recipient_name || ord?.shipping_address?.recipient_name || 'Penerima Paket',
              recipient_phone: ord?.shipping_address?.phone_number || '-',
              destination_address: ord?.shipping_address ? `${ord.shipping_address.street_address}, ${ord.shipping_address.city}` : 'Alamat Pengiriman',
              status: 'success',
              status_label: 'Sukses Diserahterimakan',
              package_summary: ord?.items ? ord.items.map((it: any) => `${it.quantity}x ${it.product_name}`).join(', ') : 'Paket Pesanan Pelanggan',
              proof_photo: p.proof_photo_url,
              proof_signature_url: p.signature_url,
              proof_signature_name: p.recipient_name,
              received_by_note: p.delivery_notes,
            });
          }
        }

        // Also merge delivered orders from orderStore that might not be in delivery_proofs
        const deliveredOrders = orders.filter((o) => o.status === 'delivered');
        for (const ord of deliveredOrders) {
          if (!liveRecords.some((r) => r.order_id === ord.id || r.order_number === ord.order_number)) {
            const cour = couriers.find((c) => c.name === ord.shipment?.courier_name || (c.active_delivery?.order_id === ord.id));
            const dateObj = ord.updated_at ? new Date(ord.updated_at) : new Date();
            const dateIso = dateObj.toISOString().split('T')[0];
            const dateDisplay = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
            const timeDisplay = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

            liveRecords.push({
              id: `ord-${ord.id}`,
              order_id: ord.id,
              order_number: ord.order_number,
              date_iso: dateIso,
              date_display: dateDisplay,
              time_display: timeDisplay,
              courier_id: cour?.id,
              courier_name: cour?.name || ord.shipment?.courier_name || 'Kurir Toko USKI',
              courier_plate: cour?.vehicle_plate || 'Armada Toko',
              recipient_name: (ord as any).delivery_recipient_name || ord.shipping_address?.recipient_name || ord.customer_name,
              recipient_phone: ord.shipping_address?.phone_number || ord.customer_phone,
              destination_address: ord.shipping_address ? `${ord.shipping_address.street_address}, ${ord.shipping_address.city}` : 'Alamat Pelanggan',
              status: 'success',
              status_label: 'Sukses Diserahterimakan',
              package_summary: ord.items ? ord.items.map((it: any) => `${it.quantity}x ${it.product_name}`).join(', ') : 'Paket Pesanan Pelanggan',
              proof_photo: (ord as any).delivery_proof_url || (ord as any).proof_of_payment_url,
              proof_signature_url: (ord as any).delivery_signature_url,
              proof_signature_name: (ord as any).delivery_recipient_name || ord.shipping_address?.recipient_name,
              received_by_note: (ord as any).delivery_notes || ord.notes,
            });
          }
        }

        if (isMounted) {
          setDeliveryRecords(liveRecords);
        }
      } catch (err) {
        console.error('Error fetching live delivery history:', err);
      }
    };

    fetchDeliveryHistory();
  }, [orders, couriers]);

  // Filter Historical Deliveries
  const filteredHistoryRecords = deliveryRecords.filter((rec) => {
    const matchDate = historyFilterDate === 'all' || rec.date_iso === historyFilterDate;
    const matchCourier = historyFilterCourier === 'all' || rec.courier_id === historyFilterCourier;
    const matchStatus = historyFilterStatus === 'all' || rec.status === historyFilterStatus;
    return matchDate && matchCourier && matchStatus;
  });

  // Filter Couriers in Tab 1
  const filteredCouriers = couriers.filter((c) => {
    const q = courierSearch.toLowerCase();
    const matchQuery =
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.vehicle_plate.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && c.status === 'available') ||
      (statusFilter === 'delivering' && c.status === 'delivering') ||
      (statusFilter === 'off_duty' && c.status === 'off_duty');
    return matchQuery && matchStatus;
  });

  // Handlers for Add / Edit Courier
  const handleOpenAdd = () => {
    setSelectedDetailRecord(null);
    setEditingCourier(null);
    setReassignSourceCourier(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormVehicleType('motorcycle');
    setFormPlate('');
    setFormAvatar('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Courier) => {
    setSelectedDetailRecord(null);
    setShowAddModal(false);
    setReassignSourceCourier(null);
    setEditingCourier(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormVehicleType(c.vehicle_type);
    setFormPlate(c.vehicle_plate);
    setFormAvatar(c.avatar_url || '');
  };

  const handleSaveCourier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formPlate.trim()) return;

    if (editingCourier) {
      updateCourier(editingCourier.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}@uskistore.id`,
        vehicle_type: formVehicleType,
        vehicle_plate: formPlate.trim(),
        avatar_url: formAvatar.trim() || editingCourier.avatar_url,
      });
      setEditingCourier(null);
    } else {
      addCourier({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}@uskistore.id`,
        vehicle_type: formVehicleType,
        vehicle_plate: formPlate.trim(),
        avatar_url: formAvatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      });
      setShowAddModal(false);
    }
  };

  // Status Off-Duty Handler
  const handleSetOffDuty = (courierId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'off_duty' || currentStatus === 'offline' ? 'available' : 'off_duty';
    toggleCourierStatus(courierId, newStatus);
  };

  // Reassign Handler
  const handleOpenReassignModal = (courier: Courier) => {
    setSelectedDetailRecord(null);
    setShowAddModal(false);
    setEditingCourier(null);
    setReassignSourceCourier(courier);
    const availableCouriers = couriers.filter(
      (c) => c.id !== courier.id && c.status === 'available' && !c.active_delivery
    );
    setTargetCourierId(availableCouriers[0]?.id || '');
    setReassignReason('Pengalihan rute pengiriman / kendala kurir');
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignSourceCourier || !reassignSourceCourier.active_delivery || !targetCourierId) return;

    const targetCourier = couriers.find((c) => c.id === targetCourierId);
    if (!targetCourier || targetCourier.status !== 'available' || targetCourier.active_delivery) {
      alert('Kurir pengganti tidak tersedia atau sedang mengantar pesanan lain.');
      return;
    }

    const orderId = reassignSourceCourier.active_delivery.order_id;
    const sourceId = reassignSourceCourier.id;

    const deliveryTransfer = {
      ...reassignSourceCourier.active_delivery,
      status: 'assigned' as const,
      reassigned_from: reassignSourceCourier.name,
      reassign_reason: reassignReason,
    };

    reassignDelivery(
      orderId,
      sourceId,
      targetCourierId,
      reassignReason
    );

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const nowIso = new Date().toISOString();
      Promise.resolve(
        client
          .from('couriers')
          .update({
            status: 'idle',
            active_delivery: null,
            updated_at: nowIso,
          })
          .eq('id', sourceId)
      ).catch((err: any) => console.error('Failed to release source courier in Supabase:', err));

      Promise.resolve(
        client
          .from('couriers')
          .update({
            status: 'delivering',
            active_delivery: deliveryTransfer,
            updated_at: nowIso,
          })
          .eq('id', targetCourierId)
      ).catch((err: any) => console.error('Failed to assign target courier in Supabase:', err));

      Promise.resolve(
        client
          .from('orders')
          .update({
            courier_id: targetCourierId,
            courier_name: targetCourier?.name,
            updated_at: nowIso,
          })
          .eq('id', orderId)
      )
        .then(({ error }) => {
          if (error && error.code === 'PGRST204') {
            return client
              .from('orders')
              .update({
                courier_name: targetCourier?.name,
                updated_at: nowIso,
              })
              .eq('id', orderId);
          }
        })
        .catch((err: any) => console.error('Failed to update order courier in Supabase:', err));
    }

    setReassignSourceCourier(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#101519]">
              Manajemen Armada Kurir Toko
            </h1>
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
              {couriers.length} Kurir Toko USKI
            </span>
          </div>
          <p className="text-xs text-body mt-1">
            Kelola data staf kurir internal, status armada siap antar, dan histori serah terima paket pelanggan
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Kurir Baru</span>
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-body block">Total Kurir Toko</span>
          <div className="text-2xl font-black text-[#101519] mt-0.5">{couriers.length} Orang</div>
          <span className="text-[10px] text-body block mt-0.5">Armada resmi toko</span>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-body block">Sedang Mengantar</span>
          <div className="text-2xl font-black text-primary mt-0.5">
            {couriers.filter((c) => c.status === 'delivering').length} Kurir
          </div>
          <span className="text-[10px] text-amber-600 font-bold block mt-0.5">● Sedang dalam perjalanan</span>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-body block">Kurir Standby (Siap)</span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">
            {couriers.filter((c) => c.status === 'available').length} Kurir
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">● Siap kirim order baru</span>
        </div>
        <div className="bg-white border border-hairline rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-body block">Selesai Diantar Hari Ini</span>
          <div className="text-2xl font-black text-[#101519] mt-0.5">
            {couriers.reduce((sum, c) => sum + c.total_delivered_today, 0)} Paket
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">✅ Berhasil diterima</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-hairline overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 py-3 px-4 font-extrabold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'border-primary text-primary'
              : 'border-transparent text-body hover:text-[#101519]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>1. Daftar Kurir Toko & Armada ({couriers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-4 font-extrabold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-body hover:text-[#101519]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>2. Histori Pengiriman & Bukti Serah Terima</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR KURIR TOKO & ARMADA                                         */}
      {/* ========================================================================= */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-hairline rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: `Semua Kurir (${couriers.length})` },
                { id: 'available', label: `Standby (${couriers.filter((c) => c.status === 'available').length})` },
                { id: 'delivering', label: `Sedang Kirim (${couriers.filter((c) => c.status === 'delivering').length})` },
                { id: 'off_duty', label: `Libur / Nonaktif (${couriers.filter((c) => c.status === 'off_duty').length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-neutral-2 text-body hover:bg-neutral-3'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <input
                type="text"
                placeholder="Cari nama, no. HP, atau plat motor..."
                value={courierSearch}
                onChange={(e) => setCourierSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
              />
              <Search className="w-4 h-4 text-body absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Courier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCouriers.map((c) => {
              const delivery = c.active_delivery;

              return (
                <div
                  key={c.id}
                  className="bg-white border border-hairline rounded-3xl p-5 space-y-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header Kurir */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar_url}
                          alt={c.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-hairline shadow-xs"
                        />
                        <div>
                          <h3 className="font-extrabold text-sm text-[#101519]">{c.name}</h3>
                          <span className="text-[11px] font-mono font-semibold text-body block">
                            {c.vehicle_plate}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md inline-block mt-0.5">
                            {c.vehicle_type === 'motorcycle' ? '🛵 Sepeda Motor' : '🚐 Mobil Van'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          c.status === 'delivering'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : c.status === 'available'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-neutral-2 text-body border border-hairline'
                        }`}
                      >
                        {c.status === 'delivering' ? 'Mengantar' : c.status === 'available' ? 'Standby (Siap)' : 'Libur'}
                      </span>
                    </div>

                    {/* Informasi Tugas Aktif Kurir */}
                    {delivery ? (
                      <div className="p-3 bg-neutral-2/50 rounded-2xl border border-hairline space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-body">Sedang Mengantar:</span>
                          <span className="font-mono font-black text-primary">#{delivery.order_number}</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#101519]">{delivery.recipient_name}</p>
                          <p className="text-[11px] text-body line-clamp-2 mt-0.5">
                            {delivery.destination_address}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-body pt-1 border-t border-hairline">
                          <span>Estimasi: <strong>~{delivery.eta_minutes} Menit</strong></span>
                          <span>Jarak: <strong>{delivery.distance_km} km</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center text-xs text-emerald-800">
                        <span className="font-bold block">Standby di Gudang</span>
                        <span className="text-[11px] text-emerald-700">Siap menerima order pengantaran dari admin</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-body px-1">
                      <span>Total Selesai Hari Ini:</span>
                      <strong className="text-[#101519] font-bold">{c.total_delivered_today} Paket</strong>
                    </div>
                  </div>

                  {/* Tombol Aksi Kurir */}
                  <div className="pt-3 border-t border-hairline flex flex-wrap gap-2 text-xs">
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(c.name)},%20ini%20Admin%20USKI%20STORE.`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="px-3 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors border border-hairline"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {delivery && (
                      <button
                        type="button"
                        onClick={() => handleOpenReassignModal(c)}
                        title="Alihkan pesanan ke kurir lain"
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors border border-blue-200"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Alihkan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSetOffDuty(c.id, c.status)}
                      className={`px-2.5 py-2 rounded-xl font-bold text-[11px] border transition-colors ${
                        c.status === 'off_duty'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-body hover:text-black'
                      }`}
                    >
                      {c.status === 'off_duty' ? 'Aktifkan' : 'Set Libur'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTORI PENGIRIMAN & BUKTI SERAH TERIMA (SIMPEL & ADA TANGGAL)      */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Quick Date & Status Filter Bar */}
          <div className="bg-white border border-hairline rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-extrabold text-[#101519] block text-sm">
                  Filter Histori & Bukti Pengiriman
                </span>
                <span className="text-body text-[11px]">
                  Cek laporan pengantaran berdasarkan tanggal, nama kurir, atau status serah terima
                </span>
              </div>

              {/* Tanggal Cepat (Quick Date Tabs) */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: '2026-10-30', label: 'Hari Ini (30 Okt)' },
                  { id: '2026-10-29', label: 'Kemarin (29 Okt)' },
                  { id: 'all', label: 'Semua Tanggal' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setHistoryFilterDate(d.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                      historyFilterDate === d.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-neutral-2 text-body hover:bg-neutral-3'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Dropdowns & Date Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-hairline text-xs">
              <div className="flex items-center gap-2 bg-neutral-2 px-3 py-1 rounded-xl border border-hairline">
                <Calendar className="w-4 h-4 text-body shrink-0" />
                <span className="text-body font-semibold shrink-0">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={historyFilterDate === 'all' ? '' : historyFilterDate}
                  onChange={(e) => setHistoryFilterDate(e.target.value || 'all')}
                  className="bg-transparent font-bold text-[#101519] focus:outline-none w-full"
                />
              </div>

              <select
                value={historyFilterCourier}
                onChange={(e) => setHistoryFilterCourier(e.target.value)}
                className="h-9 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
              >
                <option value="all">Semua Kurir</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.vehicle_plate})
                  </option>
                ))}
              </select>

              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                className="h-9 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
              >
                <option value="all">Semua Status Serah Terima</option>
                <option value="success">✅ Sukses Diterima</option>
                <option value="failed">❌ Gagal Antar / Jadwal Ulang</option>
              </select>
            </div>
          </div>

          {/* Lightweight History Table */}
          <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tanggal & Jam</th>
                    <th className="py-3 px-4">No. Pesanan</th>
                    <th className="py-3 px-4">Kurir yang Mengantar</th>
                    <th className="py-3 px-4">Penerima & Alamat</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Bukti Serah Terima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredHistoryRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-body">
                        Tidak ada catatan pengantaran pada tanggal atau filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedDetailRecord(rec)}
                        className="hover:bg-primary/5 cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#101519]">
                          {rec.date_display}
                          <span className="block text-body font-mono text-[10px]">{rec.time_display}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-primary group-hover:underline">
                          #{rec.order_number}
                          <span className="block text-body font-normal text-[10px] truncate max-w-[150px]">
                            {rec.package_summary}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#101519] block">{rec.courier_name}</span>
                          <span className="text-[10px] text-body font-mono">{rec.courier_plate}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#101519] block">{rec.recipient_name}</span>
                          <span className="text-[11px] text-body line-clamp-1">{rec.destination_address}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              rec.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {rec.status === 'success' ? '✅ Selesai Diterima' : '❌ Gagal Antar'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedDetailRecord(rec)}
                            className="px-3 py-1 bg-primary text-white hover:bg-primary-hover rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-xs transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Bukti</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIGHTBOX BUKTI SERAH TERIMA & TANDA TANGAN (POPUP SATU RINGAN)      */}
      {/* ========================================================================= */}
      {selectedDetailRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#101519]">
                  Bukti Serah Terima #{selectedDetailRecord.order_number}
                </h3>
                <p className="text-xs text-body mt-0.5">
                  {selectedDetailRecord.date_display} • {selectedDetailRecord.time_display}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailRecord(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 hover:bg-neutral-2 rounded-xl text-body hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs flex-1">
              
              {/* Foto Bukti Serah Terima */}
              {selectedDetailRecord.proof_photo ? (
                <div className="space-y-1">
                  <span className="font-bold text-body block">Foto Bukti Penyerahan Barang di Lokasi:</span>
                  <div className="rounded-2xl overflow-hidden bg-neutral-100 border border-hairline max-h-72 flex items-center justify-center">
                    <img
                      src={selectedDetailRecord.proof_photo}
                      alt="Bukti Serah Terima"
                      className="w-full h-auto max-h-72 object-cover rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Laporan Gagal Antar</span>
                  </div>
                  <p>Alasan: <strong>{selectedDetailRecord.failed_reason}</strong></p>
                  <p className="text-[11px] italic">{selectedDetailRecord.failed_notes}</p>
                </div>
              )}

              {/* Data Penerima & Tanda Tangan */}
              {selectedDetailRecord.proof_signature_name && (
                <div className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-body font-semibold">Nama Penerima Paket:</span>
                    <strong className="text-[#101519]">{selectedDetailRecord.proof_signature_name}</strong>
                  </div>
                  {selectedDetailRecord.received_by_note && (
                    <div className="border-t border-hairline pt-2 text-[11px]">
                      <span className="text-body font-semibold block">Catatan Penerimaan:</span>
                      <p className="italic text-[#101519]">{selectedDetailRecord.received_by_note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tanda Tangan Digital Penerima */}
              {(selectedDetailRecord.proof_signature_url || selectedDetailRecord.signature_url) && (
                <div className="space-y-1">
                  <span className="font-bold text-body block">Tanda Tangan Digital Penerima:</span>
                  <div className="rounded-2xl overflow-hidden bg-white border border-hairline p-3 flex items-center justify-center max-h-40">
                    <img
                      src={selectedDetailRecord.proof_signature_url || selectedDetailRecord.signature_url}
                      alt="Tanda Tangan Digital"
                      className="max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Info Pengiriman */}
              <div className="space-y-1.5 border-t border-hairline pt-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-body">Kurir yang Bertugas:</span>
                  <strong className="text-[#101519]">{selectedDetailRecord.courier_name} ({selectedDetailRecord.courier_plate})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-body">Tujuan Alamat:</span>
                  <span className="text-[#101519] text-right max-w-xs">{selectedDetailRecord.destination_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body">Isi Paket:</span>
                  <span className="text-[#101519] font-medium">{selectedDetailRecord.package_summary}</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-3 border-t border-hairline flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailRecord(null)}
                className="px-5 py-2 bg-neutral-2 hover:bg-neutral-3 text-[#101519] rounded-xl font-bold text-xs transition-colors"
              >
                Tutup Popup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH KURIR BARU                                                 */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <form
            onSubmit={handleSaveCourier}
            className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-hairline text-xs touch-scroll"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-base text-[#101519] flex items-center gap-1.5">
                <Truck className="w-5 h-5 text-primary" />
                <span>Tambah Kurir Toko Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-body block mb-1">Nama Lengkap Kurir *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812-3456-7890"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold font-mono focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-body block mb-1">Tipe Kendaraan</label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="motorcycle">🛵 Sepeda Motor</option>
                    <option value="van">🚐 Mobil Blind Van</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Plat Nomor Kendaraan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 1234 XYZ"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold uppercase focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Foto / Avatar URL (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-xs"
              >
                Simpan Kurir
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT DATA KURIR                                                    */}
      {/* ========================================================================= */}
      {editingCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <form
            onSubmit={handleSaveCourier}
            className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-hairline text-xs touch-scroll"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-base text-[#101519] flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-primary" />
                <span>Edit Kurir: {editingCourier.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCourier(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-body block mb-1">Nama Lengkap Kurir *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold font-mono focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-body block mb-1">Tipe Kendaraan</label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="motorcycle">🛵 Sepeda Motor</option>
                    <option value="van">🚐 Mobil Blind Van</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Plat Nomor *</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold uppercase focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCourier(null)}
                className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REASSIGN / ALIHKAN TUGAS KE KURIR LAIN                             */}
      {/* ========================================================================= */}
      {reassignSourceCourier && reassignSourceCourier.active_delivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <form
            onSubmit={handleReassignSubmit}
            className="bg-white rounded-xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl border border-hairline text-xs touch-scroll"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-[#101519]">
                  Alihkan Tugas Kurir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignSourceCourier(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <div className="p-3 bg-neutral-2/50 rounded-2xl border border-hairline space-y-1">
              <span className="text-[10px] text-body block font-bold">Pesanan yang Dialihkan:</span>
              <strong className="font-mono text-primary text-xs block">
                #{reassignSourceCourier.active_delivery.order_number}
              </strong>
              <p className="text-[#101519]">{reassignSourceCourier.active_delivery.recipient_name}</p>
              <span className="text-[10px] text-body block">Kurir Asal: <strong>{reassignSourceCourier.name}</strong></span>
            </div>

            <div>
              <label className="font-bold text-body block mb-1">Pilih Kurir Baru Pengganti *</label>
              <select
                required
                value={targetCourierId}
                onChange={(e) => setTargetCourierId(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
              >
                <option value="">-- Pilih Kurir --</option>
                {couriers
                  .filter((c) => c.id !== reassignSourceCourier.id && c.status === 'available' && !c.active_delivery)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.vehicle_plate}) - Standby
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-body block mb-1">Alasan Pengalihan *</label>
              <input
                type="text"
                required
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="pt-2 border-t border-hairline flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignSourceCourier(null)}
                className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!targetCourierId}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
              >
                Konfirmasi Alihkan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};