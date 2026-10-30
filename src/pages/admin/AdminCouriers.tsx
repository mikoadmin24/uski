import React, { useState } from 'react';
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

export const AdminCouriers: React.FC = () => {
  const {
    couriers,
    reassignDelivery,
    toggleCourierStatus,
    addCourier,
    updateCourier,
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
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('2026-10-30'); // 'all' or 'YYYY-MM-DD'
  const [historyFilterCourier, setHistoryFilterCourier] = useState<string>('all');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('all');
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<any | null>(null);

  // Historical Deliveries Log Data for Simple Human-Friendly Audit
  const allDeliveryRecords = [
    {
      id: 'deliv-rec-1',
      order_number: 'USKI-2026-0089',
      date_iso: '2026-10-30',
      date_display: 'Jumat, 30 Okt 2026',
      time_display: '10:45 WIB',
      courier_id: 'cour-1',
      courier_name: 'Bambang Supriyadi',
      courier_plate: 'B 4521 EXD (Honda Beat)',
      recipient_name: 'Budi Santoso',
      recipient_phone: '0812-9876-5432',
      destination_address: 'Jl. Margonda Raya No. 102, Beji, Kota Depok',
      status: 'success' as const,
      status_label: 'Sukses Diserahterimakan',
      package_summary: '2x Atomic Habits, 1x Binder Pastel',
      proof_photo: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=800',
      proof_signature_name: 'Budi Santoso',
      received_by_note: 'Diterima langsung oleh pembeli di depan pagar rumah dalam kondisi segel baik',
    },
    {
      id: 'deliv-rec-2',
      order_number: 'USKI-2026-0091',
      date_iso: '2026-10-30',
      date_display: 'Jumat, 30 Okt 2026',
      time_display: '11:20 WIB',
      courier_id: 'cour-3',
      courier_name: 'Agus Pratama',
      courier_plate: 'B 9022 UTR (Gran Max Van)',
      recipient_name: 'Yayasan Pendidikan Al-Hikmah (SIT Al-Hikmah)',
      recipient_phone: '0812-4455-6677',
      destination_address: 'Komp. Sekolah Islam Terpadu (SIT) Al-Hikmah, Jl. Menpor No. 05, RT 02/RW 03, Kel. Tugu, Kec. Cimanggis, Kota Depok, Jawa Barat 16951',
      status: 'success' as const,
      status_label: 'Sukses Diserahterimakan',
      package_summary: '20x Mushaf Al-Quran Cordova A5, 10x Box Joyko Gel Pen',
      proof_photo: 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?auto=format&fit=crop&q=80&w=800',
      proof_signature_name: 'Drs. H. Syarifuddin (Kepala TU)',
      received_by_note: 'Diserahkan langsung ke ruang Tata Usaha gedung SIT Al-Hikmah. Diterima lengkap.',
    },
    {
      id: 'deliv-rec-3',
      order_number: 'USKI-2026-0084',
      date_iso: '2026-10-29',
      date_display: 'Kamis, 29 Okt 2026',
      time_display: '14:15 WIB',
      courier_id: 'cour-1',
      courier_name: 'Bambang Supriyadi',
      courier_plate: 'B 4521 EXD (Honda Beat)',
      recipient_name: 'Siti Aminah',
      recipient_phone: '0857-9988-1122',
      destination_address: 'Jl. Merak No. 14, Sukmajaya, Depok',
      status: 'success' as const,
      status_label: 'Sukses Diserahterimakan',
      package_summary: '3x Buku Tulis Kiky, 1x Set Pensil Warna Faber-Castell',
      proof_photo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
      proof_signature_name: 'Siti Aminah',
      received_by_note: 'Diterima oleh Siti Aminah sendiri',
    },
    {
      id: 'deliv-rec-4',
      order_number: 'USKI-2026-0077',
      date_iso: '2026-10-29',
      date_display: 'Kamis, 29 Okt 2026',
      time_display: '16:30 WIB',
      courier_id: 'cour-3',
      courier_name: 'Agus Pratama',
      courier_plate: 'B 9022 UTR (Gran Max Van)',
      recipient_name: 'Hendra Wijaya',
      recipient_phone: '0813-2233-4455',
      destination_address: 'Perumahan Pesona Depok Blok B3 No. 12',
      status: 'failed' as const,
      status_label: 'Gagal Antar (Jadwal Ulang)',
      package_summary: '5x Al-Quran Hafalan, 2x Kitab Fiqih',
      failed_reason: 'Penerima Tidak di Tempat & Pagar Terkunci',
      failed_notes: 'Kurir sudah menunggu 15 menit dan telepon tidak diangkat. Paket dibawa kembali ke gudang.',
    },
    {
      id: 'deliv-rec-5',
      order_number: 'USKI-2026-0062',
      date_iso: '2026-10-28',
      date_display: 'Rabu, 28 Okt 2026',
      time_display: '11:00 WIB',
      courier_id: 'cour-2',
      courier_name: 'Rahmat Hidayat',
      courier_plate: 'B 3189 KLP (Yamaha NMAX)',
      recipient_name: 'Ibu Hj. Nurul',
      recipient_phone: '0811-7788-9900',
      destination_address: 'Jl. Kemiri Muka No. 45, Beji, Depok',
      status: 'success' as const,
      status_label: 'Sukses Diserahterimakan',
      package_summary: '10x Buku Iqro, 5x Juz Amma',
      proof_photo: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=800',
      proof_signature_name: 'Hj. Nurul',
      received_by_note: 'Diterima oleh Ibu Hj. Nurul untuk pengajian anak-anak musholla',
    },
  ];

  // Filter Historical Deliveries
  const filteredHistoryRecords = allDeliveryRecords.filter((rec) => {
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
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormVehicleType('motorcycle');
    setFormPlate('');
    setFormAvatar('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Courier) => {
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

  // Reassign Handler
  const handleOpenReassignModal = (courier: Courier) => {
    setReassignSourceCourier(courier);
    const otherCouriers = couriers.filter((c) => c.id !== courier.id);
    setTargetCourierId(otherCouriers[0]?.id || '');
    setReassignReason('Pengalihan rute pengiriman / kendala kurir');
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignSourceCourier || !reassignSourceCourier.active_delivery || !targetCourierId) return;

    reassignDelivery(
      reassignSourceCourier.active_delivery.order_id,
      reassignSourceCourier.id,
      targetCourierId,
      reassignReason
    );

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
                      onClick={() => toggleCourierStatus(c.id, c.status === 'off_duty' ? 'available' : 'off_duty')}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-hairline flex flex-col touch-scroll">
            
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-hairline flex items-center justify-between">
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
                className="p-1.5 hover:bg-neutral-2 rounded-xl text-body hover:text-[#101519]"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCourier}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-base text-[#101519] flex items-center gap-1.5">
                <Truck className="w-5 h-5 text-primary" />
                <span>Tambah Kurir Toko Baru</span>
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-body" />
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-body block mb-1">Tipe Kendaraan</label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
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
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold uppercase"
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCourier}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-base text-[#101519] flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-primary" />
                <span>Edit Kurir: {editingCourier.name}</span>
              </h3>
              <button type="button" onClick={() => setEditingCourier(null)}>
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
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-body block mb-1">Tipe Kendaraan</label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
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
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold uppercase"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReassignSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-[#101519]">
                  Alihkan Tugas Kurir
                </h3>
              </div>
              <button type="button" onClick={() => setReassignSourceCourier(null)}>
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
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
              >
                <option value="">-- Pilih Kurir --</option>
                {couriers
                  .filter((c) => c.id !== reassignSourceCourier.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.vehicle_plate}) - {c.status === 'available' ? 'Standby' : 'Sedang Mengantar'}
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
                className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
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