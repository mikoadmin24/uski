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
  PackageCheck,
  XCircle,
  FileText,
  Route,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCourierStore } from '@/store/courierStore';
import { useOrderStore } from '@/store/orderStore';
import { uploadFileToStorage } from '@/lib/supabase';
import { formatRupiah, formatDate } from '@/lib/utils';
import { DigitalSignaturePad } from '@/components/courier/DigitalSignaturePad';

const FAILED_REASONS = [
  'Rumah Kosong / Penerima Tidak Ada di Lokasi',
  'Alamat Tidak Ditemukan / Tidak Jelas',
  'Penerima Menolak Menerima Paket',
  'Nomor HP Tidak Aktif / Tidak Bisa Dihubungi',
  'Kendala Cuaca Ekstrem / Banjir',
  'Kendaraan Mengalami Kerusakan Teknis / Mogok',
  'Permintaan Penerima Minta Jadwal Ulang',
];

export const CourierPortalPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const {
    couriers,
    completeDelivery,
    updateLocation,
    updateDeliveryStatus,
    failDelivery,
    gpsTrackingIntervalSeconds,
  } = useCourierStore();
  const { orders } = useOrderStore();
  const navigate = useNavigate();

  // Find courier profile matching logged-in user
  const currentCourier =
    couriers.find((c) => c.email === user?.email || c.name.includes(user?.full_name || '')) ||
    couriers[0];

  // GPS State
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'active' | 'denied'>('requesting');
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speed: number;
    lastPingText: string;
  } | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);

  // Complete delivery modal / form
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);
  const [recipientNameInput, setRecipientNameInput] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Failed delivery modal / form
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [failedReason, setFailedReason] = useState(FAILED_REASONS[0]);
  const [failedNotes, setFailedNotes] = useState('');
  const [isSubmittingFailed, setIsSubmittingFailed] = useState(false);

  // 1. AUTOMATIC GPS WATCHER on mount
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      return;
    }

    // Try reading battery
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((bat: any) => {
          setBatteryLevel(Math.round(bat.level * 100));
          bat.onlevelchange = () => setBatteryLevel(Math.round(bat.level * 100));
        })
        .catch(() => {});
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : 0;

        const timeStr = new Date().toLocaleTimeString('id-ID');

        setGpsStatus('active');
        setGpsCoords({
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          accuracy: Math.round(accuracy),
          speed: currentSpeedKmh,
          lastPingText: timeStr,
        });

        // Broadcast to store so Admin sees it in real-time
        updateLocation(currentCourier.id, {
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          accuracy_meters: Math.round(accuracy),
          speed_kmh: currentSpeedKmh,
          battery_level: batteryLevel,
          address_approx: `Posisi Nyata HP Kurir (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: (gpsTrackingIntervalSeconds || 15) * 1000,
        timeout: 12000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentCourier.id, updateLocation, batteryLevel, currentCourier.status, gpsTrackingIntervalSeconds]);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Ukuran file bukti maksimal 8MB.');
        return;
      }
      setSelectedProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourier.active_delivery) return;

    if (!proofPhotoPreview) {
      alert('Wajib mengunggah foto bukti serah terima paket!');
      return;
    }

    if (!signatureDataUrl) {
      alert('Penerima wajib membubuhkan tanda tangan digital pada kotak yang disediakan!');
      return;
    }

    setIsSubmittingDelivery(true);
    let finalProofUrl = proofPhotoPreview || '';
    let finalSignatureUrl = signatureDataUrl || '';

    // 1. Upload proof photo to bucket 'delivery-proofs' in subfolder 'proofs'
    if (selectedProofFile) {
      try {
        const cloudUrl = await uploadFileToStorage(selectedProofFile, 'delivery-proofs', 'proofs');
        if (cloudUrl) {
          finalProofUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('Upload proof photo to Supabase Storage failed, using local preview fallback', err);
      }
    } else if (proofPhotoPreview && proofPhotoPreview.startsWith('data:')) {
      try {
        const cloudUrl = await uploadFileToStorage(proofPhotoPreview, 'delivery-proofs', 'proofs');
        if (cloudUrl) {
          finalProofUrl = cloudUrl;
        }
      } catch (err) {
        console.warn('Upload base64 proof photo to storage failed:', err);
      }
    }

    // 2. Upload digital signature to bucket 'delivery-proofs' in subfolder 'signatures'
    if (signatureDataUrl) {
      try {
        const sigUrl = await uploadFileToStorage(signatureDataUrl, 'delivery-proofs', 'signatures');
        if (sigUrl) {
          finalSignatureUrl = sigUrl;
        }
      } catch (err) {
        console.warn('Upload digital signature to Supabase Storage failed, using dataUrl fallback', err);
      }
    }

    completeDelivery(
      currentCourier.id,
      finalProofUrl,
      finalSignatureUrl,
      `${recipientNameInput ? `Diterima oleh: ${recipientNameInput}. ` : ''}${deliveryNotes}`
    );

    // Native haptic feedback for mobile devices (iPhone/Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setIsSubmittingDelivery(false);
    setShowCompleteModal(false);
    setProofPhotoPreview(null);
    setSignatureDataUrl(null);
    setSelectedProofFile(null);
    setRecipientNameInput('');
    setDeliveryNotes('');
    alert('Alhamdulillah! Status paket berhasil diselesaikan (DELIVERED) dengan bukti foto & tanda tangan.');
  };

  const handleFailDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCourier.active_delivery) return;

    setIsSubmittingFailed(true);
    failDelivery(currentCourier.id, failedReason, failedNotes);

    setIsSubmittingFailed(false);
    setShowFailedModal(false);
    setFailedNotes('');
    alert(`Laporan gagal antar telah dicatat ke Admin: "${failedReason}". Status kurir kembali standby.`);
  };

  const activeDelivery = currentCourier.active_delivery;
  const deliveryStatus = activeDelivery?.status || 'assigned';

  // Calculate GPS accuracy label
  const accuracyMeters = gpsCoords?.accuracy || currentCourier.current_location.accuracy_meters || 10;
  const accuracyBadge =
    accuracyMeters <= 15
      ? { label: 'Tinggi (GPS Perangkat Aktif)', color: 'bg-green-100 text-green-800 border-green-200' }
      : accuracyMeters <= 50
      ? { label: 'Sedang (Jaringan Seluler)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
      : { label: 'Rendah (>50m)', color: 'bg-orange-100 text-orange-800 border-orange-200' };

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
            <Link
              to="/admin/couriers"
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold"
              title="Panel Monitoring Admin"
            >
              Monitor GPS
            </Link>
            <Link
              to="/"
              className="px-2.5 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold"
              title="Ke Beranda Toko"
            >
              Ke Toko
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* GPS PERANGKAT AKTIF */}
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
                  ? 'GPS Perangkat Aktif'
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

          {gpsStatus === 'active' && (
            <div className="mt-3 space-y-2.5">
              <div className="p-3 bg-white/10 rounded-2xl flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white/60 block text-[10px]">KOORDINAT POSISI FISIK</span>
                  <span className="text-green-300 font-bold text-sm">
                    {gpsCoords?.lat || currentCourier.current_location.lat},{' '}
                    {gpsCoords?.lng || currentCourier.current_location.lng}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-white/60 block text-[10px]">AKURASI GPS</span>
                  <span className="text-white font-bold">±{accuracyMeters} meter</span>
                </div>
              </div>

              {/* Status Geolocation Perangkat */}
              <div className="flex items-center justify-between text-[11px] bg-white/5 p-2 rounded-xl text-white/80">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Status Geolocation: <strong>GPS Perangkat Aktif</strong>
                  </span>
                </div>
                <div className="text-[10px] text-green-300 font-mono">
                  Sinyal: Baik
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span>
                  Kecepatan:{' '}
                  <strong className="text-white">
                    {gpsCoords?.speed || currentCourier.current_location.speed_kmh} km/jam
                  </strong>
                </span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Update: {currentCourier.current_location.last_updated}
                </span>
              </div>
            </div>
          )}

          {gpsStatus === 'denied' && (
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
          )}
        </div>

        {/* ACTIVE DELIVERY CARD WITH STEP-BY-STEP PROGRESSION */}
        {activeDelivery ? (
          <div className="bg-white border border-hairline rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-body">
                  Tugas Pengantaran Paket
                </span>
                <h2 className="text-base font-extrabold text-primary font-mono">
                  #{activeDelivery.order_number}
                </h2>
              </div>

              {/* Current Lifecycle Status Pill */}
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                  deliveryStatus === 'assigned'
                    ? 'bg-blue-100 text-blue-800'
                    : deliveryStatus === 'pickup'
                    ? 'bg-purple-100 text-purple-800'
                    : deliveryStatus === 'on_delivery'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {deliveryStatus === 'assigned' && '1. Menunggu Pickup'}
                {deliveryStatus === 'pickup' && '2. Sudah Di-Pickup'}
                {deliveryStatus === 'on_delivery' && '3. Dalam Perjalanan'}
                {deliveryStatus === 'delivered' && 'Selesai'}
              </span>
            </div>

            {/* Step-by-Step Delivery Tracker UI */}
            <div className="p-3 bg-neutral-2/40 rounded-2xl border border-hairline">
              <span className="text-[10px] font-bold text-body block mb-2 uppercase tracking-wider">
                Alur Pengantaran (Delivery Flow)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                <div
                  className={`p-2 rounded-xl transition-all ${
                    deliveryStatus === 'assigned' || deliveryStatus === 'pickup' || deliveryStatus === 'on_delivery'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-neutral-2 text-body'
                  }`}
                >
                  <span>1. Pickup Toko</span>
                </div>
                <div
                  className={`p-2 rounded-xl transition-all ${
                    deliveryStatus === 'pickup' || deliveryStatus === 'on_delivery'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-neutral-2 text-body'
                  }`}
                >
                  <span>2. Di Jalan</span>
                </div>
                <div
                  className={`p-2 rounded-xl transition-all ${
                    deliveryStatus === 'on_delivery'
                      ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                      : 'bg-neutral-2 text-body'
                  }`}
                >
                  <span>3. Tiba & Serah</span>
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-body text-[11px]">Nama Penerima:</span>
                <h3 className="text-sm font-extrabold text-[#101519]">
                  {activeDelivery.recipient_name}
                </h3>
              </div>

              <div>
                <span className="text-body text-[11px]">Alamat Pengantaran:</span>
                <p className="font-bold text-[#101519] leading-relaxed">
                  {activeDelivery.destination_address}
                </p>
              </div>

              {activeDelivery.reassigned_from && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                  <strong>Catatan Pengalihan:</strong> Dialihkan dari {activeDelivery.reassigned_from}.
                  {activeDelivery.reassign_reason && ` (${activeDelivery.reassign_reason})`}
                </div>
              )}

              {activeDelivery.delivery_notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Catatan Toko:</strong> {activeDelivery.delivery_notes}
                </div>
              )}
            </div>

            {/* Quick Actions (Maps & WA) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  activeDelivery.destination_address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-primary text-white rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm hover:bg-primary-dark transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Petunjuk Arah</span>
              </a>

              <a
                href={`https://wa.me/${activeDelivery.recipient_phone.replace(/[^0-9]/g, '')}?text=Halo%20kak%20${encodeURIComponent(
                  activeDelivery.recipient_name
                )},%20saya%20kurir%20USKI%20STORE%20sedang%20mengantar%20paket%20Anda.`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm hover:bg-green-700 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* ACTION BUTTONS BASED ON LIFECYCLE */}
            <div className="pt-2 space-y-2">
              {deliveryStatus === 'assigned' && (
                <button
                  type="button"
                  onClick={() => updateDeliveryStatus(currentCourier.id, 'pickup')}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>Ambil Paket di Toko / Gudang (Pickup)</span>
                </button>
              )}

              {deliveryStatus === 'pickup' && (
                <button
                  type="button"
                  onClick={() => updateDeliveryStatus(currentCourier.id, 'on_delivery')}
                  className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  <span>Mulai Pengantaran ke Alamat (On Delivery)</span>
                </button>
              )}

              {deliveryStatus === 'on_delivery' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(true)}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Selesaikan Pengantaran (Delivered)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFailedModal(true)}
                    className="w-full h-10 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Laporkan Gagal Antar (Failed)</span>
                  </button>
                </div>
              )}
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

        {/* TRIP BREADCRUMB HISTORY AUDIT TRAIL */}
        {currentCourier.trip_history && currentCourier.trip_history.length > 0 && (
          <div className="bg-white border border-hairline rounded-3xl p-5 space-y-3 shadow-sm text-xs">
            <div className="flex items-center justify-between border-b border-hairline pb-2.5">
              <div className="flex items-center gap-1.5">
                <Route className="w-4 h-4 text-primary" />
                <h4 className="font-extrabold text-[#101519]">
                  Histori Titik Perjalanan Hari Ini
                </h4>
              </div>
              <span className="text-[10px] font-bold text-body">
                {currentCourier.trip_history.length} Titik Rekam
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {[...currentCourier.trip_history].reverse().map((point, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-neutral-2/40 border border-hairline rounded-xl flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#101519] truncate">{point.address || 'Koordinat Perjalanan'}</p>
                    <p className="text-[10px] text-body font-mono">
                      {point.lat.toFixed(5)}, {point.lng.toFixed(5)} • {point.speed_kmh} km/jam
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-primary shrink-0 font-mono">
                    {point.timestamp}
                  </span>
                </div>
              ))}
            </div>
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
                {currentCourier.status === 'delivering' ? 'Mengantar' : 'Siap Tugas'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* COMPLETE DELIVERY MODAL WITH PHOTO AND SIGNATURE PAD */}
      {showCompleteModal && activeDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#101519]">
                  Konfirmasi Serah Terima Paket
                </h3>
                <p className="text-[11px] text-body">
                  Pesanan #{activeDelivery.order_number} • {activeDelivery.recipient_name}
                </p>
              </div>
              <button onClick={() => setShowCompleteModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleFinishDelivery} className="space-y-4 text-xs">
              {/* Photo Proof */}
              <div>
                <label className="font-bold text-body block mb-1">
                  1. Foto Bukti Serah Terima Paket (Wajib) *
                </label>
                {proofPhotoPreview ? (
                  <div className="relative border border-hairline rounded-2xl overflow-hidden mb-2">
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
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-hairline hover:border-primary rounded-2xl p-5 cursor-pointer bg-neutral-2/40 hover:bg-neutral-2/80 transition-all text-center">
                    <Camera className="w-7 h-7 text-primary mb-1" />
                    <span className="font-bold text-xs text-[#101519]">
                      Ambil Foto / Pilih dari Galeri HP
                    </span>
                    <span className="text-[10px] text-body mt-0.5">
                      Foto paket diterima atau foto depan rumah pembeli
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

              {/* Digital Signature Pad */}
              <div>
                <label className="font-bold text-body block mb-1">
                  2. Tanda Tangan Digital Penerima (Wajib) *
                </label>
                <DigitalSignaturePad onSignatureChange={setSignatureDataUrl} height={130} />
              </div>

              {/* Recipient Name */}
              <div>
                <label className="font-bold text-body block mb-1">
                  3. Nama Penerima Paket *
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

              {/* Additional Delivery Notes */}
              <div>
                <label className="font-bold text-body block mb-1">
                  4. Catatan Serah Terima (Opsional)
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
                  disabled={isSubmittingDelivery}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmittingDelivery ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Bukti...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kirim & Selesaikan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAILED DELIVERY REPORT MODAL */}
      {showFailedModal && activeDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">
                    Laporan Gagal Antar
                  </h3>
                  <p className="text-[11px] text-body">
                    Order #{activeDelivery.order_number} • {activeDelivery.recipient_name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFailedModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleFailDeliverySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">
                  Pilih Alasan Gagal Antar *
                </label>
                <select
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                >
                  {FAILED_REASONS.map((reason, i) => (
                    <option key={i} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">
                  Keterangan Kendala Lapangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={failedNotes}
                  onChange={(e) => setFailedNotes(e.target.value)}
                  placeholder="Contoh: Sudah mengetuk pagar 3 kali dan menelpon nomor pembeli namun tidak aktif."
                  className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-[11px]">
                <p>
                  <strong>Perhatian:</strong> Paket akan dikembalikan ke gudang toko atau dijadwalkan ulang oleh admin toko.
                </p>
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
                  disabled={isSubmittingFailed}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSubmittingFailed ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Laporan...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Laporkan Gagal Antar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
