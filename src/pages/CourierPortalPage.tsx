import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Navigation,
  Compass,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  Camera,
  UploadCloud,
  X,
  ExternalLink,
  Battery,
  ShieldCheck,
  Truck,
  RotateCw,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCourierStore } from '@/store/courierStore';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const CourierPortalPage: React.FC = () => {
  const { user, logout, loginAs } = useAuthStore();
  const { couriers, completeDelivery, updateLocation } = useCourierStore();
  const { orders } = useOrderStore();
  const navigate = useNavigate();

  // Find courier profile matching logged-in user
  const currentCourier =
    couriers.find((c) => c.email === user?.email || c.name.includes(user?.full_name || '')) ||
    couriers[0];

  // GPS State
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'active' | 'denied'>('requesting');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number; speed: number } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);

  // Complete delivery modal / form
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(null);
  const [recipientNameInput, setRecipientNameInput] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // 1. AUTOMATIC GPS WATCHER on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      return;
    }

    // Try reading battery
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.onlevelchange = () => setBatteryLevel(Math.round(bat.level * 100));
      }).catch(() => {});
    }

    // Calling watchPosition triggers native browser permission popup automatically!
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : (currentCourier.status === 'delivering' ? 32 : 0);

        setGpsStatus('active');
        setGpsCoords({
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          accuracy: Math.round(accuracy),
          speed: currentSpeedKmh,
        });

        // Broadcast to store so Admin sees it in real-time
        updateLocation(currentCourier.id, {
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          accuracy_meters: Math.round(accuracy),
          speed_kmh: currentSpeedKmh,
          battery_level: batteryLevel,
          address_approx: `Titik GPS Fisik Kurir (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentCourier.id, updateLocation, batteryLevel, currentCourier.status]);

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

  const handleFinishDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourier.active_delivery) return;

    completeDelivery(
      currentCourier.id,
      proofPhotoPreview || 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600',
      `${recipientNameInput ? `Diterima oleh: ${recipientNameInput}. ` : ''}${deliveryNotes}`
    );

    // Native haptic feedback for mobile devices (iPhone/Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setShowCompleteModal(false);
    setProofPhotoPreview(null);
    setRecipientNameInput('');
    setDeliveryNotes('');
    alert('Alhamdulillah! Status paket telah berhasil dikonfirmasi DITERIMA.');
  };

  return (
    <div className="min-h-[100dvh] bg-[#F0F4F8] font-urbanist text-[#101519] pb-[calc(3rem+env(safe-area-inset-bottom,0px))] touch-scroll">
      {/* Mobile Header Bar */}
      <header className="bg-[#2D3033] text-white p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-extrabold text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                USKI COURIER DRIVER
              </h1>
              <p className="text-[11px] text-neutral-1">
                {currentCourier.name} • {currentCourier.vehicle_plate.split('(')[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loginAs('super_admin');
                navigate('/admin');
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold"
              title="Kembali ke Super Admin"
            >
              Ke Admin
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* AUTOMATIC GPS TELEMETRY CARD */}
        <div
          className={`rounded-3xl p-5 text-white shadow-lg border transition-all ${
            gpsStatus === 'active'
              ? 'bg-gradient-to-br from-[#101519] to-[#2D3033] border-green-500/30'
              : gpsStatus === 'denied'
              ? 'bg-red-700 border-red-500'
              : 'bg-primary border-primary/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  gpsStatus === 'active'
                    ? 'bg-green-400 animate-ping'
                    : gpsStatus === 'denied'
                    ? 'bg-red-300'
                    : 'bg-yellow-300 animate-pulse'
                }`}
              />
              <span className="font-extrabold text-xs uppercase tracking-wider text-green-400">
                {gpsStatus === 'active'
                  ? 'GPS Pelacak Otomatis Aktif'
                  : gpsStatus === 'denied'
                  ? 'Izin GPS Ditolak'
                  : 'Menghubungkan GPS...'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-white/80 font-mono">
              <span className="flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-green-400" />
                {batteryLevel}%
              </span>
            </div>
          </div>

          {gpsStatus === 'active' && gpsCoords ? (
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-white/10 rounded-2xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white/60 block text-[10px]">KOORDINAT SATELIT REAL-TIME</span>
                  <span className="text-green-300 font-bold text-sm">
                    {gpsCoords.lat}, {gpsCoords.lng}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-white/60 block text-[10px]">AKURASI</span>
                  <span className="text-white font-bold">±{gpsCoords.accuracy} meter</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span>Kecepatan: <strong className="text-white">{gpsCoords.speed} km/jam</strong></span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tersiar ke Admin Toko
                </span>
              </div>
            </div>
          ) : gpsStatus === 'denied' ? (
            <div className="mt-2 space-y-2 text-xs">
              <p className="text-white/90 text-[11px]">
                Izin GPS diblokir di browser. Harap izinkan akses lokasi di pengaturan browser agar pengantaran Anda terlacak otomatis.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-1.5 bg-white text-red-700 font-bold rounded-xl text-xs"
              >
                Muat Ulang & Izinkan Lokasi
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/80 mt-2">
              Sistem sedang meminta izin lokasi ke browser Anda. Harap tekan <strong>Allow / Izinkan</strong> pada notifikasi browser.
            </p>
          )}
        </div>

        {/* ACTIVE DELIVERY CARD */}
        {currentCourier.active_delivery ? (
          <div className="bg-white border border-hairline rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-body">
                  Tugas Pengantaran Saat Ini
                </span>
                <h2 className="text-base font-extrabold text-primary font-mono">
                  #{currentCourier.active_delivery.order_number}
                </h2>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full animate-pulse">
                Dalam Perjalanan
              </span>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-body text-[11px]">Nama Pembeli / Penerima:</span>
                <h3 className="text-sm font-extrabold text-[#101519]">
                  {currentCourier.active_delivery.recipient_name}
                </h3>
              </div>

              <div>
                <span className="text-body text-[11px]">Alamat Pengantaran:</span>
                <p className="font-bold text-[#101519] leading-relaxed">
                  {currentCourier.active_delivery.destination_address}
                </p>
              </div>

              {currentCourier.active_delivery.delivery_notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Catatan Khusus:</strong> {currentCourier.active_delivery.delivery_notes}
                </div>
              )}
            </div>

            {/* Navigation & Communication Quick Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  currentCourier.active_delivery.destination_address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-sm hover:bg-primary-dark transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Buka Petunjuk Arah</span>
              </a>

              <a
                href={`https://wa.me/${currentCourier.active_delivery.recipient_phone.replace(/[^0-9]/g, '')}?text=Halo%20kak%20${encodeURIComponent(
                  currentCourier.active_delivery.recipient_name
                )},%20saya%20kurir%20USKI%20STORE%20sedang%20dalam%20perjalanan%20mengantar%20paket%20Anda.`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-sm hover:bg-green-700 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat WhatsApp</span>
              </a>
            </div>

            {/* Complete Delivery Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(true)}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Paket Telah Sampai / Selesai Antar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-hairline rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-base text-[#101519]">
              Semua Pengantaran Selesai!
            </h3>
            <p className="text-xs text-body">
              Anda sedang standby di pangkalan gudang utama. Tugas baru akan otomatis muncul di layar ini begitu ditugaskan oleh admin.
            </p>
          </div>
        )}

        {/* Courier Summary Card */}
        <div className="bg-white border border-hairline rounded-3xl p-5 space-y-3 shadow-sm text-xs">
          <h4 className="font-extrabold text-[#101519] border-b border-hairline pb-2 flex items-center justify-between">
            <span>Performa Pengantaran Hari Ini</span>
            <span className="text-primary font-bold">{currentCourier.total_delivered_today} Paket Berhasil</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-neutral-2/50 rounded-2xl">
              <span className="text-body text-[10px] block">TOTAL DIANTAR</span>
              <span className="text-lg font-extrabold text-[#101519]">
                {currentCourier.total_delivered_today} Paket
              </span>
            </div>
            <div className="p-3 bg-neutral-2/50 rounded-2xl">
              <span className="text-body text-[10px] block">STATUS OPERASIONAL</span>
              <span className="text-lg font-extrabold text-green-700">
                Siap Tugas
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Complete Delivery Modal */}
      {showCompleteModal && currentCourier.active_delivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-extrabold text-[#101519]">
                Konfirmasi Serah Terima Paket
              </h3>
              <button onClick={() => setShowCompleteModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleFinishDelivery} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">
                  Foto Bukti Serah Terima (Kamera / File) *
                </label>
                {proofPhotoPreview ? (
                  <div className="relative border border-hairline rounded-2xl overflow-hidden mb-2">
                    <img
                      src={proofPhotoPreview}
                      alt="Bukti Serah Terima"
                      className="w-full h-44 object-cover"
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
                      Ambil Foto / Pilih dari Galeri HP
                    </span>
                    <span className="text-[10px] text-body mt-0.5">
                      Foto paket di tangan penerima atau di depan pintu
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
                  Nama Penerima Paket *
                </label>
                <input
                  type="text"
                  required
                  value={recipientNameInput}
                  onChange={(e) => setRecipientNameInput(e.target.value)}
                  placeholder="Contoh: Diterima langsung oleh Kak Budi (Ybs)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Contoh: Paket diletakkan di teras atas izin pembeli"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="w-1/3 py-2.5 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim & Selesaikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
