import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCourierStore } from '@/store/courierStore';
import { Navigation, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export const CourierGpsWatcher: React.FC = () => {
  const { user } = useAuthStore();
  const { couriers, updateLocation } = useCourierStore();
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  const isCourier = user?.role === 'courier';

  useEffect(() => {
    if (!isCourier) return;

    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }

    // Try to query permissions API if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => {
            setPermissionState(result.state);
          };
        })
        .catch(() => {
          // ignore
        });
    }

    // Fetch phone battery if supported
    let batteryLevel = 88;
    if ('getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((bat: any) => {
          batteryLevel = Math.round(bat.level * 100);
        })
        .catch(() => {
          // ignore
        });
    }

    // Identify courier account
    const courierObj =
      couriers.find((c) => c.email === user.email || c.name.includes(user.full_name)) ||
      couriers[0];

    // AUTOMATIC GPS WATCHER
    // Calling watchPosition immediately prompts the browser for permission if not yet decided!
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;

        setPermissionState('granted');
        setLastCoords({
          lat: Number(latitude.toFixed(5)),
          lng: Number(longitude.toFixed(5)),
          accuracy: Math.round(accuracy),
        });

        if (courierObj) {
          updateLocation(courierObj.id, {
            lat: Number(latitude.toFixed(5)),
            lng: Number(longitude.toFixed(5)),
            accuracy_meters: Math.round(accuracy),
            speed_kmh: speed ? Math.round(speed * 3.6) : courierObj.current_location.speed_kmh,
            heading: heading || courierObj.current_location.heading,
            battery_level: batteryLevel,
            address_approx: `Koordinat GPS Otomatis (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isCourier, user?.email, user?.full_name, couriers, updateLocation]);

  if (!isCourier || !showBanner) return null;

  return (
    <aside aria-label="Status GPS Kurir" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-up">
      {permissionState === 'denied' ? (
        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 text-xs border border-red-500">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">Izin GPS Ditolak</p>
              <p className="text-white/90 text-[11px] mt-0.5 leading-relaxed">
                Kurir wajib mengizinkan akses lokasi di browser agar admin dapat melacak rute pengantaran paket secara otomatis.
              </p>
            </div>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : permissionState === 'granted' && lastCoords ? (
        <div className="bg-[#101519] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs border border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span className="font-extrabold text-xs text-green-400 uppercase tracking-wide">
                  GPS Kurir Otomatis Aktif
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-mono truncate">
                {lastCoords.lat}, {lastCoords.lng} (±{lastCoords.accuracy}m)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBanner(false)}
            className="p-1 rounded-lg text-white/50 hover:text-white"
            title="Sembunyikan Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-primary text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Navigation className="w-4 h-4 animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-xs">Meminta Akses GPS Perangkat...</p>
              <p className="text-[10px] text-white/80">Silakan klik 'Allow / Izinkan' pada pop-up izin lokasi browser Anda.</p>
            </div>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
