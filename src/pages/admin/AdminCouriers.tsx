import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Compass,
  Truck,
  MapPin,
  Phone,
  MessageSquare,
  Battery,
  Wifi,
  ExternalLink,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  Camera,
  UploadCloud,
  X,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRightLeft,
  XCircle,
  UserCheck,
  Package,
  Layers,
  History,
  AlertTriangle,
  Send,
  PenTool,
  Check,
  Activity,
} from 'lucide-react';
import { useCourierStore } from '@/store/courierStore';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Courier, DeliveryStatus } from '@/types';

const FAILED_REASONS = [
  'Rumah Kosong / Penerima Tidak Ada di Lokasi',
  'Alamat Tidak Ditemukan / Tidak Jelas',
  'Penerima Menolak Menerima Paket',
  'Nomor HP Tidak Aktif / Tidak Bisa Dihubungi',
  'Kendala Cuaca Ekstrem / Banjir',
  'Kendaraan Mengalami Kerusakan Teknis / Mogok',
  'Permintaan Penerima Minta Jadwal Ulang',
];

export const AdminCouriers: React.FC = () => {
  const {
    couriers,
    activeCourierId,
    setActiveCourierId,
    updateLocation,
    advanceSimulation,
    completeDelivery,
    failDelivery,
    assignDelivery,
    reassignDelivery,
    updateDeliveryStatus,
    toggleCourierStatus,
    gpsTrackingIntervalSeconds,
    setGpsTrackingIntervalSeconds,
  } = useCourierStore();
  const { orders, updateOrderStatus } = useOrderStore();

  // Active Tab: 'radar' | 'dispatch' | 'history'
  const [activeTab, setActiveTab] = useState<'radar' | 'dispatch' | 'history'>('radar');

  const activeCourier = couriers.find((c) => c.id === activeCourierId) || couriers[0];

  // GPS Telemetry State & Heartbeat Countdown
  const [secondsUntilNextUpdate, setSecondsUntilNextUpdate] = useState<number>(gpsTrackingIntervalSeconds || 15);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Keep nowTimestamp updated every second to evaluate "X detik lalu" and online status
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
      setSecondsUntilNextUpdate((prev) => (prev <= 1 ? gpsTrackingIntervalSeconds || 15 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gpsTrackingIntervalSeconds]);

  // Modal: Assign Order to Courier
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderIdToAssign, setSelectedOrderIdToAssign] = useState<string>('');
  const [selectedCourierIdToAssign, setSelectedCourierIdToAssign] = useState<string>(activeCourier.id);
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Modal: Reassign Courier
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignSourceCourier, setReassignSourceCourier] = useState<Courier | null>(null);
  const [targetCourierId, setTargetCourierId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('Kendala operasional lapangan / armada');

  // Modal: Gagal Antar (Failed Delivery)
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedCourier, setFailedCourier] = useState<Courier | null>(null);
  const [failedReason, setFailedReason] = useState<string>(FAILED_REASONS[0]);
  const [failedNotes, setFailedNotes] = useState<string>('');

  // Open Reassign Modal
  const handleOpenReassignModal = (courier: Courier) => {
    setReassignSourceCourier(courier);
    const otherCouriers = couriers.filter((c) => c.id !== courier.id);
    setTargetCourierId(otherCouriers[0]?.id || '');
    setReassignReason('Pengalihan rute pengiriman / kendala kurir');
    setShowReassignModal(true);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignSourceCourier || !reassignSourceCourier.active_delivery || !targetCourierId) return;

    const targetCourier = couriers.find((c) => c.id === targetCourierId);
    if (!targetCourier) return;

    reassignDelivery(
      reassignSourceCourier.active_delivery.order_id,
      reassignSourceCourier.id,
      targetCourierId,
      reassignReason
    );

    setShowReassignModal(false);
    alert(`Pesanan #${reassignSourceCourier.active_delivery.order_number} berhasil dialihkan dari ${reassignSourceCourier.name} ke ${targetCourier.name}.`);
  };

  // Open Assign Order Modal
  const handleOpenAssignModal = () => {
    setSelectedCourierIdToAssign(activeCourier.id);
    // Find first unassigned order
    const candidate = orders.find(
      (o) => o.status === 'processing' || o.status === 'ready_for_pickup' || o.shipping_method.toLowerCase().includes('kurir')
    );
    setSelectedOrderIdToAssign(candidate?.id || (orders[0]?.id || ''));
    setAssignNotes('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderToAssign = orders.find((o) => o.id === selectedOrderIdToAssign);
    const courierToAssign = couriers.find((c) => c.id === selectedCourierIdToAssign);

    if (!orderToAssign || !courierToAssign) {
      alert('Silakan pilih pesanan dan kurir yang valid.');
      return;
    }

    assignDelivery(courierToAssign.id, {
      order_id: orderToAssign.id,
      order_number: orderToAssign.order_number,
      recipient_name: orderToAssign.customer_name,
      recipient_phone: orderToAssign.customer_phone,
      destination_address: `${orderToAssign.shipping_address.street_address}, ${orderToAssign.shipping_address.city}`,
      destination_coords: {
        lat: -6.37 + (Math.random() - 0.5) * 0.05,
        lng: 106.83 + (Math.random() - 0.5) * 0.05,
      },
      eta_minutes: Math.floor(10 + Math.random() * 20),
      distance_km: Number((1.5 + Math.random() * 4).toFixed(1)),
      delivery_notes: assignNotes || `Pengantaran via ${courierToAssign.name}`,
      status: 'assigned',
    });

    setShowAssignModal(false);
    alert(`Order #${orderToAssign.order_number} berhasil ditugaskan ke ${courierToAssign.name}. Status kurir: Sedang Mengantar.`);
  };

  // Open Failed Delivery Modal
  const handleOpenFailedModal = (courier: Courier) => {
    setFailedCourier(courier);
    setFailedReason(FAILED_REASONS[0]);
    setFailedNotes('');
    setShowFailedModal(true);
  };

  const handleFailedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failedCourier || !failedCourier.active_delivery) return;

    failDelivery(failedCourier.id, failedReason, failedNotes);
    setShowFailedModal(false);
    alert(`Laporan gagal antar untuk #${failedCourier.active_delivery.order_number} telah dicatat. Kurir kembali status Standby.`);
  };

  // Helper: GPS Online / Offline Check
  const getGpsOnlineStatus = (courier: Courier) => {
    const lastPing = courier.current_location.last_timestamp || 0;
    const diffSec = Math.floor((nowTimestamp - lastPing) / 1000);

    if (diffSec <= 120) {
      return {
        isOnline: true,
        text: `Online (${diffSec}s lalu)`,
        color: 'bg-green-100 text-green-800 border-green-200',
        dot: 'bg-green-500 animate-pulse',
      };
    } else if (diffSec <= 300) {
      return {
        isOnline: true,
        text: `Idle (${Math.floor(diffSec / 60)}m lalu)`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        dot: 'bg-yellow-500',
      };
    } else {
      return {
        isOnline: false,
        text: `Offline (>5 menit)`,
        color: 'bg-neutral-2 text-body border-hairline',
        dot: 'bg-gray-400',
      };
    }
  };

  // Helper: GPS Accuracy Rating
  const getAccuracyBadge = (accuracyMeters: number = 6) => {
    if (accuracyMeters <= 15) {
      return {
        label: `±${accuracyMeters}m (Sangat Baik / Satelit)`,
        color: 'bg-green-100 text-green-800 border-green-200',
      };
    } else if (accuracyMeters <= 50) {
      return {
        label: `±${accuracyMeters}m (Sedang / Jaringan)`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    } else {
      return {
        label: `±${accuracyMeters}m (Rendah)`,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    }
  };

  // KPI Calculations
  const totalCouriers = couriers.length;
  const activeCouriersCount = couriers.filter((c) => c.status === 'delivering').length;
  const totalDeliveredToday = couriers.reduce((sum, c) => sum + c.total_delivered_today, 0);

  // Check for any stationary/abnormal alerts across all couriers
  const abnormalAlerts = couriers.filter(
    (c) => c.stationary_alert && c.stationary_alert.alert_type !== null
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#101519]">
              Armada Kurir Toko & Manajemen Pengiriman
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full animate-pulse border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              GPS Real-time Active
            </span>
          </div>
          <p className="text-xs text-body mt-1">
            Pantau posisi kurir toko via satelit GPS, interval heartbeat, assign & reassign pesanan, serta audit bukti tanda tangan digital.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAssignModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Tugaskan Pesanan (Assign)</span>
          </button>

          <a
            href={`https://www.google.com/maps?q=${activeCourier.current_location.lat},${activeCourier.current_location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl border border-hairline transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Google Maps</span>
          </a>
        </div>
      </div>

      {/* Abnormal / Stationary Warning Banner */}
      {abnormalAlerts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Peringatan Deteksi GPS Lapangan ({abnormalAlerts.length} Anomali Terdeteksi)</span>
          </div>
          <div className="space-y-1.5 text-xs text-amber-800">
            {abnormalAlerts.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-white/70 p-2.5 rounded-xl border border-amber-200">
                <div>
                  <span className="font-extrabold text-amber-950">{c.name} ({c.vehicle_plate}):</span>{' '}
                  <span>{c.stationary_alert?.message}</span>
                </div>
                <button
                  onClick={() => handleOpenReassignModal(c)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold"
                >
                  Alihkan Kurir (Reassign)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-bold text-body">Total Armada Kurir</span>
          <div className="text-2xl font-extrabold text-[#101519]">{totalCouriers} Driver</div>
          <p className="text-[11px] text-body">2 Motor Toko & 1 Mobil Blind Van</p>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-bold text-body">Sedang Mengantar (On Road)</span>
          <div className="text-2xl font-extrabold text-primary">{activeCouriersCount} Armada</div>
          <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
            Satelit GPS terhubung
          </p>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-bold text-body">Selesai Diantar Hari Ini</span>
          <div className="text-2xl font-extrabold text-[#101519]">{totalDeliveredToday} Pesanan</div>
          <p className="text-[11px] text-body">Bukti foto & tanda tangan terverifikasi</p>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-bold text-body">Interval Heartbeat GPS</span>
          <div className="text-2xl font-extrabold text-[#101519] flex items-center gap-2">
            <span>{gpsTrackingIntervalSeconds}s</span>
            <span className="text-xs font-normal text-body">/ update</span>
          </div>
          <p className="text-[11px] text-primary font-bold">
            Update berikutnya: {secondsUntilNextUpdate} detik
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION: RADAR, DISPATCH, HISTORY */}
      <div className="flex border-b border-hairline gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 py-3 px-4 font-extrabold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'radar'
              ? 'border-primary text-primary'
              : 'border-transparent text-body hover:text-[#101519]'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>1. Radar & Telemetri Live GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex items-center gap-2 py-3 px-4 font-extrabold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'dispatch'
              ? 'border-primary text-primary'
              : 'border-transparent text-body hover:text-[#101519]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>2. Penugasan & Antrean Pengiriman</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-4 font-extrabold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-body hover:text-[#101519]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>3. Histori Perjalanan & Bukti Serah Terima</span>
        </button>
      </div>

      {/* TAB 1: RADAR & LIVE GPS TELEMETRY */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Map & Telemetry Dashboard Card */}
          <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
            {/* Top Control Bar with Interval Selector */}
            <div className="p-4 sm:p-5 border-b border-hairline flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-2/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm">
                  <Navigation className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[#101519] text-sm">
                      Radar Live: {activeCourier.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-neutral-2 text-body font-mono text-[10px] rounded font-bold border border-hairline">
                      {activeCourier.vehicle_plate}
                    </span>
                    {(() => {
                      const st = getGpsOnlineStatus(activeCourier);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.text}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-body">
                    {activeCourier.current_location.address_approx}
                  </p>
                </div>
              </div>

              {/* Interval Heartbeat Selector & Driver Switcher */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-hairline text-xs font-bold text-body">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span>Interval GPS:</span>
                  <select
                    value={gpsTrackingIntervalSeconds}
                    onChange={(e) => setGpsTrackingIntervalSeconds(Number(e.target.value))}
                    className="bg-transparent font-extrabold text-primary outline-none cursor-pointer"
                  >
                    <option value={10}>10 detik</option>
                    <option value={15}>15 detik (Rekomendasi)</option>
                    <option value={30}>30 detik</option>
                    <option value={60}>60 detik</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  {couriers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCourierId(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        c.id === activeCourierId
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-white text-body border border-hairline hover:bg-neutral-2'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          c.status === 'delivering' ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      />
                      <span>{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Frame & Telemetry Badges */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="relative rounded-3xl overflow-hidden border border-hairline shadow-lg h-80 sm:h-[440px] bg-[#1A202C]">
                <iframe
                  title={`Live GPS Map - ${activeCourier.name}`}
                  src={`https://maps.google.com/maps?q=${activeCourier.current_location.lat},${activeCourier.current_location.lng}&z=16&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />

                {/* Floating GPS Badges */}
                <div className="absolute top-3 left-3 bg-[#101519]/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-white/20 text-xs shadow-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                  <span className="font-extrabold text-white">Satelit GPS Live</span>
                  <span className="text-white/40">|</span>
                  <span className="font-mono text-[11px] text-green-300 font-bold">
                    {activeCourier.current_location.lat.toFixed(5)}, {activeCourier.current_location.lng.toFixed(5)}
                  </span>
                </div>

                <div className="absolute top-3 right-3 hidden sm:flex items-center gap-3 bg-[#101519]/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl border border-white/20 text-xs shadow-xl">
                  <span className="flex items-center gap-1.5 text-green-300 font-bold">
                    <Battery className="w-4 h-4" />
                    {activeCourier.current_location.battery_level}%
                  </span>
                  <span className="text-white/40">|</span>
                  <span className="text-white/90 font-semibold">
                    Akurasi: ±{activeCourier.current_location.accuracy_meters}m
                  </span>
                </div>

                {/* Active Delivery Destination Card on Map */}
                {activeCourier.active_delivery && (
                  <div className="absolute bottom-3 inset-x-3 sm:inset-x-auto sm:left-3 bg-[#101519]/90 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/20 text-xs shadow-xl max-w-md">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-extrabold text-primary-light">
                        #{activeCourier.active_delivery.order_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-400/40">
                        {activeCourier.active_delivery.status === 'pickup'
                          ? 'Pickup di Gudang'
                          : activeCourier.active_delivery.status === 'on_delivery'
                          ? 'Dalam Perjalanan'
                          : 'Ditugaskan'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-bold truncate text-white">
                          Penerima: {activeCourier.active_delivery.recipient_name}
                        </p>
                        <p className="text-[11px] text-white/70 line-clamp-1">
                          {activeCourier.active_delivery.destination_address}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline">
                  <span className="text-body text-[10px] block font-bold uppercase tracking-wider">
                    Kecepatan Bergerak
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#101519]">
                    {activeCourier.current_location.speed_kmh} km/jam
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline">
                  <span className="text-body text-[10px] block font-bold uppercase tracking-wider">
                    Kualitas Akurasi GPS
                  </span>
                  {(() => {
                    const acc = getAccuracyBadge(activeCourier.current_location.accuracy_meters);
                    return (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${acc.color}`}>
                        {acc.label}
                      </span>
                    );
                  })()}
                </div>

                <div className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline">
                  <span className="text-body text-[10px] block font-bold uppercase tracking-wider">
                    Daya Baterai HP Kurir
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-primary">
                    {activeCourier.current_location.battery_level}%
                  </span>
                </div>

                <div className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline">
                  <span className="text-body text-[10px] block font-bold uppercase tracking-wider">
                    Waktu Update Terakhir
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-[#101519]">
                    {activeCourier.current_location.last_updated}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-extrabold text-[#101519] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{activeCourier.current_location.address_approx}</span>
                  </p>
                  <p className="text-[11px] text-body mt-0.5">
                    {activeCourier.active_delivery
                      ? `Kurir sedang mengantar paket ke ${activeCourier.active_delivery.recipient_name} (Sisa jarak: ${activeCourier.active_delivery.distance_km} km, ETA: ${activeCourier.active_delivery.eta_minutes} menit)`
                      : 'Kurir standby di pangkalan gudang utama siap menerima penugasan.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {activeCourier.active_delivery && (
                    <button
                      onClick={() => advanceSimulation(activeCourier.id)}
                      className="px-3.5 py-2 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold rounded-xl transition-all flex items-center gap-1.5 border border-hairline"
                    >
                      <Play className="w-3.5 h-3.5 text-primary" />
                      <span>Simulasi Maju (+15%)</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/${activeCourier.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Halo ${activeCourier.name}, ini Admin USKI STORE. Posisi armada Anda terdeteksi di: ${activeCourier.current_location.address_approx}. Mohon info estimasi tiba.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Kurir</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Courier Fleet Overview Table */}
          <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#101519]">
                  Daftar Status Armada Kurir Toko
                </h3>
                <p className="text-xs text-body">
                  Pemantauan status pengiriman real-time dan aksi cepat operasional
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Kurir & Kendaraan</th>
                    <th className="py-3 px-4">Status GPS</th>
                    <th className="py-3 px-4">Pesanan Aktif</th>
                    <th className="py-3 px-4">Tujuan / ETA</th>
                    <th className="py-3 px-4 text-center">Selesai Hari Ini</th>
                    <th className="py-3 px-4 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {couriers.map((c) => {
                    const isSelected = c.id === activeCourierId;
                    const onlineStatus = getGpsOnlineStatus(c);

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setActiveCourierId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5 font-semibold' : 'hover:bg-neutral-2/30'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={c.avatar_url}
                              alt={c.name}
                              className="w-10 h-10 rounded-full object-cover border border-hairline shrink-0"
                            />
                            <div>
                              <p className="font-bold text-[#101519] flex items-center gap-1.5">
                                <span>{c.name}</span>
                                {isSelected && (
                                  <span className="px-1.5 py-0.2 bg-primary text-white text-[9px] rounded font-bold">
                                    Aktif di Peta
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-body">{c.vehicle_plate}</p>
                              <p className="text-[10px] text-body font-mono">{c.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${onlineStatus.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${onlineStatus.dot}`} />
                            {onlineStatus.text}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {c.active_delivery ? (
                            <div>
                              <span className="font-mono font-extrabold text-primary block">
                                #{c.active_delivery.order_number}
                              </span>
                              <span className="text-[11px] text-body">
                                {c.active_delivery.recipient_name}
                              </span>
                              <span className="text-[10px] text-amber-700 font-bold block">
                                Status: {c.active_delivery.status || 'delivering'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-body italic">Standby di Gudang</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {c.active_delivery ? (
                            <div>
                              <p className="text-[#101519] font-bold truncate max-w-xs">
                                {c.active_delivery.destination_address}
                              </p>
                              <p className="text-[11px] text-green-700 font-semibold flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>ETA: ~{c.active_delivery.eta_minutes} mnt ({c.active_delivery.distance_km} km)</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-body">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-[#101519]">
                          {c.total_delivered_today} Paket
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Hubungi WhatsApp Kurir"
                              className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>

                            {c.active_delivery && (
                              <button
                                title="Alihkan ke Kurir Lain (Reassign)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenReassignModal(c);
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN PENUGASAN & ANTREAN PENGIRIMAN (DISPATCH & ASSIGNMENT) */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          {/* Dispatch Header Banner */}
          <div className="p-5 bg-white border border-hairline rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-[#101519]">
                Menu Penugasan Kurir (Order Dispatcher)
              </h3>
              <p className="text-xs text-body mt-0.5">
                Pilih pesanan siap dikirim dan tetapkan kurir toko yang bertugas, atau alihkan kurir jika terjadi kendala.
              </p>
            </div>

            <button
              onClick={handleOpenAssignModal}
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Tugaskan Pesanan Baru</span>
            </button>
          </div>

          {/* Active Deliveries Progression Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {couriers.map((c) => {
              const delivery = c.active_delivery;
              return (
                <div key={c.id} className="bg-white border border-hairline rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={c.avatar_url}
                          alt={c.name}
                          className="w-9 h-9 rounded-full object-cover border border-hairline"
                        />
                        <div>
                          <h4 className="font-extrabold text-xs text-[#101519]">{c.name}</h4>
                          <span className="text-[10px] text-body">{c.vehicle_plate.split('(')[0]}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          delivery
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {delivery ? 'Mengantar' : 'Standby'}
                      </span>
                    </div>

                    {delivery ? (
                      <div className="mt-3 space-y-3 text-xs">
                        <div className="p-3 bg-neutral-2/40 rounded-2xl border border-hairline">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-body">Order Nomor:</span>
                            <span className="font-mono font-extrabold text-primary">#{delivery.order_number}</span>
                          </div>
                          <div className="mt-1">
                            <p className="font-extrabold text-[#101519]">{delivery.recipient_name}</p>
                            <p className="text-[11px] text-body line-clamp-2 mt-0.5">{delivery.destination_address}</p>
                          </div>
                        </div>

                        {/* Status Lifecycle Indicator */}
                        <div>
                          <span className="text-[10px] font-bold text-body block mb-1">Status Pengantaran:</span>
                          <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
                            <button
                              onClick={() => updateDeliveryStatus(c.id, 'pickup')}
                              className={`p-1.5 rounded-lg border transition-all ${
                                delivery.status === 'pickup'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : 'bg-neutral-2 text-body border-hairline'
                              }`}
                            >
                              Pickup
                            </button>
                            <button
                              onClick={() => updateDeliveryStatus(c.id, 'on_delivery')}
                              className={`p-1.5 rounded-lg border transition-all ${
                                delivery.status === 'on_delivery'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-neutral-2 text-body border-hairline'
                              }`}
                            >
                              On Road
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Konfirmasi paket #${delivery.order_number} telah sampai dan selesai diantar?`)) {
                                  completeDelivery(c.id, undefined, undefined, 'Selesai diantar ke penerima');
                                }
                              }}
                              className="p-1.5 rounded-lg border bg-neutral-2 hover:bg-green-100 text-green-800 border-hairline transition-all"
                            >
                              Selesai
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-body space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="font-bold text-[#101519]">Kurir Siap Menerima Tugas</p>
                        <p className="text-[11px]">Belum ada pesanan aktif yang ditugaskan ke kurir ini.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-hairline flex gap-2">
                    {delivery ? (
                      <>
                        <button
                          onClick={() => handleOpenReassignModal(c)}
                          className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Alihkan (Reassign)</span>
                        </button>
                        <button
                          onClick={() => handleOpenFailedModal(c)}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Gagal</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCourierIdToAssign(c.id);
                          handleOpenAssignModal();
                        }}
                        className="w-full py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Tugaskan Pesanan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Orders Ready for Courier Dispatch Table */}
          <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#101519]">
                  Antrean Pesanan Siap Kirim (Kurir Toko)
                </h3>
                <p className="text-xs text-body">
                  Daftar pesanan dengan status Siap Kirim yang dapat langsung ditugaskan ke kurir
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nomor Pesanan</th>
                    <th className="py-3 px-4">Nama Pembeli</th>
                    <th className="py-3 px-4">Alamat Pengiriman</th>
                    <th className="py-3 px-4">Status Order</th>
                    <th className="py-3 px-4">Total Belanja</th>
                    <th className="py-3 px-4 text-center">Tugaskan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-2/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-primary">
                        #{order.order_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#101519]">
                        {order.customer_name}
                        <span className="block text-[10px] text-body font-normal">{order.customer_phone}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-body">
                        {order.shipping_address.street_address}, {order.shipping_address.city}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-2 text-body">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#101519]">
                        {formatRupiah(order.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrderIdToAssign(order.id);
                            setShowAssignModal(true);
                          }}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-[11px] shadow-xs transition-all flex items-center justify-center gap-1 mx-auto"
                        >
                          <Send className="w-3 h-3" />
                          <span>Pilih Kurir</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORI PERJALANAN & BUKTI SERAH TERIMA (TRIP HISTORY & AUDIT) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Breadcrumb Trail Timeline Card */}
          <div className="bg-white border border-hairline rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#101519]">
                    Rekam Jejak Titik Perjalanan (Breadcrumb Trail)
                  </h3>
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded-full">
                    {activeCourier.name}
                  </span>
                </div>
                <p className="text-xs text-body mt-0.5">
                  Audit koordinat GPS yang direkam secara berkala selama pengantaran paket
                </p>
              </div>

              {/* Courier Selector */}
              <div className="flex items-center gap-1.5">
                {couriers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCourierId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      c.id === activeCourierId
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-neutral-2 text-body hover:bg-neutral-1/40'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {activeCourier.trip_history && activeCourier.trip_history.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/30">
                {[...activeCourier.trip_history].reverse().map((point, idx) => (
                  <div key={idx} className="relative flex items-start justify-between gap-4 p-3 bg-neutral-2/40 border border-hairline rounded-2xl">
                    <span className="absolute -left-6 top-3 w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#101519] text-xs">
                        {point.address || 'Titik Koordinat Perjalanan'}
                      </p>
                      <p className="text-[11px] text-body font-mono mt-0.5">
                        Lat: {point.lat.toFixed(5)}, Lng: {point.lng.toFixed(5)} • Kecepatan: {point.speed_kmh} km/jam
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-extrabold text-primary font-mono block">
                        {point.timestamp}
                      </span>
                      <a
                        href={`https://maps.google.com/maps?q=${point.lat},${point.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline font-bold inline-flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Peta</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-body italic py-6 text-center">
                Belum ada data jejak perjalanan terekam untuk kurir ini.
              </p>
            )}
          </div>

          {/* Proof of Delivery Viewer (Photo + Digital Signature Side-by-side) */}
          <div className="bg-white border border-hairline rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="border-b border-hairline pb-3">
              <h3 className="font-extrabold text-base text-[#101519]">
                Bukti Pengiriman Terverifikasi (Foto & Tanda Tangan Digital)
              </h3>
              <p className="text-xs text-body">
                Dokumentasi serah terima barang kepada penerima sebagai bukti sah pengiriman
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sample Proof 1 */}
              <div className="p-4 bg-neutral-2/40 border border-hairline rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-primary text-xs">#USKI-2026-0089</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold">
                    Telah Diterima
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-body block mb-1">Foto Serah Terima:</span>
                    <img
                      src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=400"
                      alt="Foto Serah Terima"
                      className="w-full h-28 object-cover rounded-xl border border-hairline"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-body block mb-1">Tanda Tangan Digital:</span>
                    <div className="w-full h-28 bg-white border border-hairline rounded-xl flex items-center justify-center p-2">
                      <div className="text-center font-caveat text-xl font-bold text-slate-800 rotate-[-4deg]">
                        Budi Santoso
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-body pt-1">
                  <p><strong>Penerima:</strong> Budi Santoso (Ybs langsung)</p>
                  <p><strong>Waktu:</strong> 10:45 WIB • Kurir: Bambang Supriyadi</p>
                </div>
              </div>

              {/* Sample Proof 2 */}
              <div className="p-4 bg-neutral-2/40 border border-hairline rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-primary text-xs">#USKI-2026-0077</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold">
                    Telah Diterima
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-body block mb-1">Foto Serah Terima:</span>
                    <img
                      src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400"
                      alt="Foto Serah Terima"
                      className="w-full h-28 object-cover rounded-xl border border-hairline"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-body block mb-1">Tanda Tangan Digital:</span>
                    <div className="w-full h-28 bg-white border border-hairline rounded-xl flex items-center justify-center p-2">
                      <div className="text-center font-caveat text-xl font-bold text-slate-800 rotate-[-2deg]">
                        Ust. Ahmad Fauzi
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-body pt-1">
                  <p><strong>Penerima:</strong> Ust. Ahmad Fauzi (Sekretariat DKM)</p>
                  <p><strong>Waktu:</strong> Kemarin, 14:20 WIB • Kurir: Agus Pratama</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TUGASKAN PESANAN KE KURIR (ASSIGN ORDER) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Penugasan Pesanan ke Kurir Toko
                </h3>
              </div>
              <button onClick={() => setShowAssignModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">
                  Pilih Pesanan Siap Kirim *
                </label>
                <select
                  value={selectedOrderIdToAssign}
                  onChange={(e) => setSelectedOrderIdToAssign(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                >
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.order_number} - {order.customer_name} ({formatRupiah(order.total_amount)}) - {order.shipping_address.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Pilih Kurir Toko yang Ditugaskan *
                </label>
                <select
                  value={selectedCourierIdToAssign}
                  onChange={(e) => setSelectedCourierIdToAssign(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                >
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.vehicle_plate}) - Status: {c.status === 'delivering' ? 'Sedang Mengantar (On Road)' : 'Standby di Gudang'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Catatan Pengantaran Khusus (Opsional)
                </label>
                <input
                  type="text"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Contoh: Paket pecah belah, hubungi sebelum sampai di gerbang"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Konfirmasi Penugasan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REASSIGN COURIER */}
      {showReassignModal && reassignSourceCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">
                    Alihkan Pesanan (Reassign Courier)
                  </h3>
                  <p className="text-[11px] text-body">
                    Pesanan #{reassignSourceCourier.active_delivery?.order_number}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowReassignModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-2/50 border border-hairline rounded-xl">
                <span className="text-body block text-[10px]">Kurir Asal:</span>
                <span className="font-bold text-[#101519]">{reassignSourceCourier.name} ({reassignSourceCourier.vehicle_plate})</span>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Pindahkan ke Kurir Pengganti *
                </label>
                <select
                  value={targetCourierId}
                  onChange={(e) => setTargetCourierId(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                >
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
                <label className="font-bold text-body block mb-1">
                  Alasan Pengalihan Kurir *
                </label>
                <input
                  type="text"
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Contoh: Ban motor kurir bocor / rute padat"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Alihkan Tugas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LAPORAN GAGAL ANTAR */}
      {showFailedModal && failedCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">
                    Laporan Gagal Antar
                  </h3>
                  <p className="text-[11px] text-body">
                    Order #{failedCourier.active_delivery?.order_number}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFailedModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleFailedSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">
                  Alasan Gagal Antar *
                </label>
                <select
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                >
                  {FAILED_REASONS.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Catatan Kendala di Lapangan
                </label>
                <textarea
                  rows={3}
                  value={failedNotes}
                  onChange={(e) => setFailedNotes(e.target.value)}
                  placeholder="Keterangan tambahan untuk admin gudang..."
                  className="w-full p-2.5 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFailedModal(false)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simpan Status Gagal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
