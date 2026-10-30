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
  Smartphone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useCourierStore } from '@/store/courierStore';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah } from '@/lib/utils';
import { Courier } from '@/types';

export const AdminCouriers: React.FC = () => {
  const {
    couriers,
    activeCourierId,
    setActiveCourierId,
    updateLocation,
    advanceSimulation,
    completeDelivery,
    toggleCourierStatus,
    setGpsActive,
  } = useCourierStore();
  const { orders } = useOrderStore();

  const activeCourier = couriers.find((c) => c.id === activeCourierId) || couriers[0];

  // Driver mobile app simulator modal
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverModalCourier, setDriverModalCourier] = useState<Courier | null>(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [realGpsActive, setRealGpsActive] = useState(false);
  const [realGpsMsg, setRealGpsMsg] = useState<string | null>(null);

  // Auto-pulse simulation for demo mode (optional toggle)
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  useEffect(() => {
    if (!isLiveSimulating) return;
    const interval = setInterval(() => {
      if (activeCourier && activeCourier.active_delivery && activeCourier.active_delivery.progress_pct < 100) {
        advanceSimulation(activeCourier.id);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveSimulating, activeCourier?.id, activeCourier?.active_delivery?.progress_pct]);

  // Handle Real Device HTML5 Geolocation
  const handleActivateRealGps = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation HTML5.');
      return;
    }

    setRealGpsMsg('Menghubungkan ke satelit GPS perangkat...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        if (driverModalCourier) {
          updateLocation(driverModalCourier.id, {
            lat: Number(latitude.toFixed(5)),
            lng: Number(longitude.toFixed(5)),
            accuracy_meters: Math.round(accuracy),
            speed_kmh: speed ? Math.round(speed * 3.6) : 0,
            address_approx: `Posisi Nyata Perangkat Kurir (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          });
        }
        setRealGpsActive(true);
        setRealGpsMsg(`GPS Terkunci! Akurasi: ±${Math.round(accuracy)}m (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)})`);
      },
      (err) => {
        setRealGpsMsg(`Gagal membaca GPS: ${err.message}. Pastikan izin lokasi diizinkan di browser.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenDriverModal = (courier: Courier) => {
    setDriverModalCourier(courier);
    setProofPhotoPreview(courier.active_delivery?.proof_photo || null);
    setDeliveryNotes(courier.active_delivery?.delivery_notes || '');
    setRealGpsActive(false);
    setRealGpsMsg(null);
    setShowDriverModal(true);
  };

  const handleDriverCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverModalCourier) return;

    completeDelivery(
      driverModalCourier.id,
      proofPhotoPreview || 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600',
      deliveryNotes
    );

    setShowDriverModal(false);
    alert(`Pengantaran oleh ${driverModalCourier.name} berhasil diselesaikan. Status pesanan telah diperbarui menjadi DITERIMA.`);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // KPI Calculations
  const totalCouriers = couriers.length;
  const activeCouriersCount = couriers.filter((c) => c.status === 'delivering').length;
  const totalDeliveredToday = couriers.reduce((sum, c) => sum + c.total_delivered_today, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#101519]">
              Armada Kurir Toko & GPS Pelacakan Langsung
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              Sinyal GPS Aktif
            </span>
          </div>
          <p className="text-xs text-body mt-1">
            Pantau posisi kurir toko secara langsung, pergerakan armada antar barang, status baterai HP, dan estimasi waktu sampai (ETA).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDriverModal(activeCourier)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold text-xs rounded-xl border border-hairline transition-all"
          >
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Simulasi HP Kurir</span>
          </button>

          <a
            href={`https://www.google.com/maps?q=${activeCourier.current_location.lat},${activeCourier.current_location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Google Maps</span>
          </a>
        </div>
      </div>

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
            Terhubung satelit GPS
          </p>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-bold text-body">Selesai Diantar Hari Ini</span>
          <div className="text-2xl font-extrabold text-[#101519]">{totalDeliveredToday} Pesanan</div>
          <p className="text-[11px] text-body">Bukti tanda tangan & foto tersimpan</p>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1 shadow-xs">
          <span className="text-xs font-bold text-body">Pusat Distribusi Utama</span>
          <div className="text-sm font-extrabold text-[#101519] truncate">Gudang USKI Margonda</div>
          <p className="text-[11px] text-body">Depok, Jawa Barat (-6.3728, 106.8335)</p>
        </div>
      </div>

      {/* Interactive GPS Radar & Telemetry Canvas */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        {/* Map Top Bar */}
        <div className="p-4 sm:p-5 border-b border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-2/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm">
              <Navigation className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#101519] text-sm">
                  Live Radar: {activeCourier.name}
                </h3>
                <span className="px-2 py-0.5 bg-neutral-2 text-body font-mono text-[10px] rounded font-bold border border-hairline">
                  {activeCourier.vehicle_plate}
                </span>
              </div>
              <p className="text-xs text-body">
                {activeCourier.current_location.address_approx}
              </p>
            </div>
          </div>

          {/* Courier Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
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

        {/* Visual Map Canvas Grid */}
        <div className="relative bg-[#1A202C] text-white p-6 sm:p-8 min-h-[360px] flex flex-col justify-between overflow-hidden">
          {/* Decorative Map Street Grid */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Simulated curved road vectors */}
              <path
                d="M 50 300 Q 200 150 450 200 T 800 100"
                fill="none"
                stroke="#63B3ED"
                strokeWidth="4"
                strokeDasharray="8 8"
              />
              <path
                d="M 100 80 Q 300 250 600 220 T 900 320"
                fill="none"
                stroke="#4A5568"
                strokeWidth="8"
              />
            </svg>
          </div>

          {/* Map Top Status Pill */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Compass className="w-4 h-4 text-accent-2 animate-spin-slow" />
              <span className="font-mono text-[11px] text-white/90">
                GPS: {activeCourier.current_location.lat.toFixed(5)},{' '}
                {activeCourier.current_location.lng.toFixed(5)}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-green-400 font-bold">±{activeCourier.current_location.accuracy_meters}m</span>
            </div>

            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px]">
              <span className="flex items-center gap-1 text-white/80">
                <Battery className="w-3.5 h-3.5 text-green-400" />
                {activeCourier.current_location.battery_level}%
              </span>
              <span className="flex items-center gap-1 text-accent-1 font-bold">
                <Wifi className="w-3.5 h-3.5" />
                Online
              </span>
              <span className="text-white/50">Diperbarui: {activeCourier.current_location.last_updated}</span>
            </div>
          </div>

          {/* Visual Route Diagram inside Map */}
          <div className="relative z-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto w-full">
            {/* Origin (Gudang USKI) */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 border-2 border-primary flex items-center justify-center text-primary shadow-lg mb-2 relative">
                <Truck className="w-7 h-7 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="font-extrabold text-xs text-white">Gudang USKI</span>
              <span className="text-[10px] text-white/60">Pusat Margonda</span>
            </div>

            {/* Courier Position Moving Indicator */}
            <div className="flex-1 w-full px-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80 font-semibold">
                <span className="flex items-center gap-1 text-accent-2 font-bold">
                  <span>Kecepatan:</span>
                  <span className="text-sm font-extrabold text-white">
                    {activeCourier.current_location.speed_kmh} km/jam
                  </span>
                </span>
                {activeCourier.active_delivery ? (
                  <span>
                    Sisa Jarak: <strong className="text-white">{activeCourier.active_delivery.distance_km} km</strong> (ETA: ~{activeCourier.active_delivery.eta_minutes} mnt)
                  </span>
                ) : (
                  <span className="text-green-400 font-bold">Standby Siap Kirim</span>
                )}
              </div>

              {/* Progress Bar Line */}
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/20 relative">
                <div
                  className="h-full bg-gradient-to-r from-primary via-accent-2 to-green-400 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${
                      activeCourier.active_delivery ? activeCourier.active_delivery.progress_pct : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span>Titik Muat Barang</span>
                <span className="text-accent-2 font-bold">
                  {activeCourier.active_delivery
                    ? `Perjalanan: ${activeCourier.active_delivery.progress_pct}%`
                    : 'Di Gudang'}
                </span>
                <span>Pintu Alamat Penerima</span>
              </div>
            </div>

            {/* Destination Pin */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-lg mb-2">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <span className="font-extrabold text-xs text-white truncate max-w-[130px]">
                {activeCourier.active_delivery?.recipient_name || 'Standby'}
              </span>
              <span className="text-[10px] text-white/60">Alamat Tujuan</span>
            </div>
          </div>

          {/* Map Bottom Telemetry & Simulation Controls */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 bg-black/40 -mx-6 -mb-6 p-4 px-6 backdrop-blur-sm text-xs">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold truncate">
                {activeCourier.active_delivery
                  ? `Mengantar Order #${activeCourier.active_delivery.order_number} (${activeCourier.active_delivery.destination_address})`
                  : 'Kurir standby di pangkalan gudang utama siap ditugaskan.'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeCourier.active_delivery && (
                <>
                  <button
                    onClick={() => advanceSimulation(activeCourier.id)}
                    className="px-3.5 py-1.5 bg-accent-1 text-black font-extrabold text-xs rounded-xl hover:bg-yellow-400 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Simulasikan posisi kurir maju ke depan"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Maju GPS (+15%)</span>
                  </button>

                  <button
                    onClick={() => setIsLiveSimulating(!isLiveSimulating)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                      isLiveSimulating
                        ? 'bg-red-500 text-white border-red-400'
                        : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                    }`}
                  >
                    {isLiveSimulating ? 'Stop Auto-Run' : 'Auto-Run GPS'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courier Fleet Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-[#101519]">
              Daftar Kurir & Armada Toko Aktif
            </h3>
            <p className="text-xs text-body">
              Status tugas pengantaran paket, nomor kontak telepon/WA, dan aksi operasional
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Kurir & Kendaraan</th>
                <th className="py-3 px-4">Status Pengantaran</th>
                <th className="py-3 px-4">Pesanan yang Diantar</th>
                <th className="py-3 px-4">Tujuan / Sisa Waktu</th>
                <th className="py-3 px-4 text-center">Selesai Hari Ini</th>
                <th className="py-3 px-4 text-center">Aksi Langsung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {couriers.map((c) => {
                const isSelected = c.id === activeCourierId;

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
                                Terpilih
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-body">{c.vehicle_plate}</p>
                          <p className="text-[10px] text-body font-mono">{c.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'delivering'
                            ? 'bg-amber-100 text-amber-800'
                            : c.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-2 text-body'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'delivering' ? 'bg-amber-600 animate-pulse' : 'bg-green-600'
                          }`}
                        />
                        {c.status === 'delivering'
                          ? 'Sedang Mengantar'
                          : c.status === 'available'
                          ? 'Standby di Gudang'
                          : 'Istirahat / Off-Duty'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.active_delivery ? (
                        <div>
                          <span className="font-mono font-extrabold text-primary block">
                            #{c.active_delivery.order_number}
                          </span>
                          <span className="text-[11px] text-body">
                            Penerima: {c.active_delivery.recipient_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-body italic">Belum ada tugas aktif</span>
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
                            <span>ETA: ~{c.active_delivery.eta_minutes} menit ({c.active_delivery.distance_km} km lagi)</span>
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
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Hubungi WhatsApp Kurir"
                          className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        <button
                          title="Buka Layar HP Kurir (Konfirmasi Selesai Antar)"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDriverModal(c);
                          }}
                          className="px-2.5 py-1 bg-neutral-2 hover:bg-primary hover:text-white rounded-lg text-[11px] font-bold text-[#101519] transition-all flex items-center gap-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Layar HP</span>
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

      {/* Driver Mobile View Modal */}
      {showDriverModal && driverModalCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">
                    Layar Handphone Kurir
                  </h3>
                  <p className="text-[11px] text-body">{driverModalCourier.name} • {driverModalCourier.vehicle_plate}</p>
                </div>
              </div>
              <button onClick={() => setShowDriverModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            {/* GPS Sensor Connection Card */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#101519] flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-primary" />
                  Sensor GPS Geolocation HP
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                  Ready
                </span>
              </div>
              <p className="text-body text-[11px]">
                Tekan tombol di bawah untuk menyiarkan koordinat GPS fisik dari HP/perangkat Anda langsung ke panel admin.
              </p>
              <button
                type="button"
                onClick={handleActivateRealGps}
                className="w-full py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Kirimkan Titik GPS Saat Ini</span>
              </button>
              {realGpsMsg && (
                <p className="text-[10px] text-primary font-semibold mt-1 bg-white p-2 rounded-lg border border-primary/20">
                  {realGpsMsg}
                </p>
              )}
            </div>

            {/* Active Delivery Information */}
            {driverModalCourier.active_delivery ? (
              <form onSubmit={handleDriverCompleteSubmit} className="space-y-4 text-xs">
                <div className="p-4 bg-neutral-2/50 border border-hairline rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body font-bold">Pesanan Aktif:</span>
                    <span className="font-mono font-extrabold text-primary">
                      #{driverModalCourier.active_delivery.order_number}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-[#101519] block">
                      {driverModalCourier.active_delivery.recipient_name}
                    </span>
                    <span className="text-body text-[11px] block">
                      {driverModalCourier.active_delivery.destination_address}
                    </span>
                    <span className="text-primary font-mono text-[10px] block mt-1">
                      Telp: {driverModalCourier.active_delivery.recipient_phone}
                    </span>
                  </div>
                  {driverModalCourier.active_delivery.delivery_notes && (
                    <p className="text-[11px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                      <strong>Catatan Toko:</strong> {driverModalCourier.active_delivery.delivery_notes}
                    </p>
                  )}
                </div>

                {/* Upload Bukti Serah Terima Paket */}
                <div>
                  <label className="font-bold text-body block mb-1">
                    Foto Bukti Serah Terima Paket (Wajib) *
                  </label>
                  {proofPhotoPreview ? (
                    <div className="relative border border-hairline rounded-2xl overflow-hidden">
                      <img
                        src={proofPhotoPreview}
                        alt="Bukti Serah Terima"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setProofPhotoPreview(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-6 cursor-pointer bg-neutral-2/40 hover:bg-neutral-2/80 transition-all text-center">
                      <Camera className="w-8 h-8 text-primary mb-1" />
                      <span className="font-bold text-xs text-[#101519]">
                        Ambil Foto Kamera / Upload dari HP
                      </span>
                      <span className="text-[10px] text-body mt-0.5">
                        Foto paket diterima atau foto pagar rumah pembeli
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="font-bold text-body block mb-1">
                    Nama Penerima / Keterangan Serah Terima
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Contoh: Diterima langsung oleh Ibu Rahma (Istri pembeli)"
                    className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="pt-3 border-t border-hairline flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDriverModal(false)}
                    className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Paket Diterima</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h4 className="font-extrabold text-[#101519] text-sm">
                  Semua Tugas Selesai Diantar!
                </h4>
                <p className="text-xs text-body">
                  Kurir sedang standby di pangkalan gudang utama. Admin dapat menugaskan order baru melalui menu Manajemen Pesanan.
                </p>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="px-5 py-2 bg-neutral-2 text-body font-bold rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
