import { create } from 'zustand';
import { Courier, CourierLocation, ActiveDelivery, DeliveryStatus, BreadcrumbPoint } from '@/types';
import { useOrderStore } from './orderStore';
import { dbService, isSupabaseConfigured } from '@/lib/supabase';

interface CourierState {
  couriers: Courier[];
  activeCourierId: string;
  gpsTrackingIntervalSeconds: number;
  setGpsTrackingIntervalSeconds: (seconds: number) => void;
  setCouriersFromSupabase: (couriers: Courier[]) => void;
  setActiveCourierId: (id: string) => void;
  updateLocation: (
    courierId: string,
    location: Partial<CourierLocation>
  ) => void;
  assignDelivery: (
    courierId: string,
    delivery: Omit<ActiveDelivery, 'progress_pct' | 'started_at' | 'status'> & { status?: DeliveryStatus }
  ) => void;
  reassignDelivery: (
    orderId: string,
    fromCourierId: string,
    toCourierId: string,
    reason: string
  ) => void;
  updateDeliveryStatus: (
    courierId: string,
    status: DeliveryStatus,
    details?: { failed_reason?: string; failed_notes?: string }
  ) => void;
  advanceSimulation: (courierId: string) => void;
  completeDelivery: (
    courierId: string,
    proofPhotoUrl?: string,
    proofSignatureUrl?: string,
    notes?: string
  ) => void;
  failDelivery: (
    courierId: string,
    reason: string,
    notes?: string
  ) => void;
  toggleCourierStatus: (courierId: string, status: Courier['status']) => void;
  setGpsActive: (courierId: string, active: boolean) => void;
  recordTripBreadcrumb: (courierId: string, point: BreadcrumbPoint) => void;
  addCourier: (courierData: {
    name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    vehicle_type: 'motorcycle' | 'van';
    vehicle_plate: string;
  }) => void;
  updateCourier: (courierId: string, data: Partial<Courier>) => void;
  deleteCourier: (courierId: string) => void;
}

const STORE_BASE_COORDS = { lat: -6.3728, lng: 106.8335 }; // Gudang Utama Margonda Depok

const initialCouriers: Courier[] = [
  {
    id: 'cour-1',
    name: 'Bambang Supriyadi',
    phone: '0857-1122-3344',
    email: 'bambang.kurir@uskistore.id',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    vehicle_type: 'motorcycle',
    vehicle_plate: 'B 4521 EXD (Honda Beat Hitam)',
    status: 'delivering',
    is_gps_active: true,
    total_delivered_today: 6,
    last_seen_at: new Date().toISOString(),
    current_location: {
      lat: -6.3850,
      lng: 106.8280,
      heading: 195,
      speed_kmh: 34,
      accuracy_meters: 6,
      address_approx: 'Jl. Margonda Raya Km 4.5, dekat RS Bunda',
      last_updated: new Date().toLocaleTimeString('id-ID'),
      last_timestamp: Date.now() - 15000,
      battery_level: 86,
    },
    active_delivery: {
      order_id: 'ord-1001',
      order_number: 'USKI-2026-0089',
      recipient_name: 'Budi Santoso',
      recipient_phone: '0812-9876-5432',
      destination_address: 'Jl. Margonda Raya No. 102, Beji, Kota Depok',
      destination_coords: { lat: -6.3920, lng: 106.8240 },
      started_at: '10:15 WIB',
      eta_minutes: 8,
      distance_km: 1.4,
      progress_pct: 65,
      status: 'on_delivery',
      delivery_notes: 'Titip di pos satpam atau hubungi jika sudah di depan pagar',
    },
    trip_history: [
      {
        lat: STORE_BASE_COORDS.lat,
        lng: STORE_BASE_COORDS.lng,
        timestamp: '10:15:20 WIB',
        speed_kmh: 0,
        accuracy_meters: 4,
        address: 'Berangkat dari Gudang Utama Margonda',
      },
      {
        lat: -6.3765,
        lng: 106.8310,
        timestamp: '10:19:45 WIB',
        speed_kmh: 38,
        accuracy_meters: 5,
        address: 'Melintas Jl. Margonda Raya Flyover UI',
      },
      {
        lat: -6.3812,
        lng: 106.8295,
        timestamp: '10:24:10 WIB',
        speed_kmh: 28,
        accuracy_meters: 6,
        address: 'Dekat Halte Stasiun Pondok Cina',
      },
      {
        lat: -6.3850,
        lng: 106.8280,
        timestamp: '10:28:30 WIB',
        speed_kmh: 34,
        accuracy_meters: 6,
        address: 'Jl. Margonda Raya Km 4.5, dekat RS Bunda',
      },
    ],
    stationary_alert: {
      is_stationary: false,
      duration_minutes: 0,
      alert_type: null,
    },
  },
  {
    id: 'cour-2',
    name: 'Rahmat Hidayat',
    phone: '0813-8899-7766',
    email: 'rahmat.kurir@uskistore.id',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    vehicle_type: 'motorcycle',
    vehicle_plate: 'B 3189 KLP (Yamaha NMAX Putih)',
    status: 'available',
    is_gps_active: true,
    total_delivered_today: 4,
    last_seen_at: new Date().toISOString(),
    current_location: {
      lat: STORE_BASE_COORDS.lat,
      lng: STORE_BASE_COORDS.lng,
      heading: 0,
      speed_kmh: 0,
      accuracy_meters: 3,
      address_approx: 'Gudang Utama USKI STORE Margonda',
      last_updated: new Date().toLocaleTimeString('id-ID'),
      last_timestamp: Date.now() - 45000,
      battery_level: 95,
    },
    active_delivery: null,
    trip_history: [
      {
        lat: STORE_BASE_COORDS.lat,
        lng: STORE_BASE_COORDS.lng,
        timestamp: '09:00:00 WIB',
        speed_kmh: 0,
        accuracy_meters: 3,
        address: 'Standby di Pangkalan Gudang Utama USKI',
      },
    ],
    stationary_alert: {
      is_stationary: false,
      duration_minutes: 0,
      alert_type: null,
    },
  },
  {
    id: 'cour-3',
    name: 'Agus Pratama',
    phone: '0811-3344-5566',
    email: 'agus.kurir@uskistore.id',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    vehicle_type: 'van',
    vehicle_plate: 'B 9022 UTR (Daihatsu Gran Max Blind Van)',
    status: 'delivering',
    is_gps_active: true,
    total_delivered_today: 2,
    last_seen_at: new Date().toISOString(),
    current_location: {
      lat: -6.3640,
      lng: 106.8410,
      heading: 45,
      speed_kmh: 42,
      accuracy_meters: 5,
      address_approx: 'Jl. Ir. H. Juanda, dekat Pintu Tol Cijago',
      last_updated: new Date().toLocaleTimeString('id-ID'),
      last_timestamp: Date.now() - 30000,
      battery_level: 72,
    },
    active_delivery: {
      order_id: 'ord-1002',
      order_number: 'USKI-2026-0091',
      recipient_name: 'Yayasan Pendidikan Al-Hikmah (SIT Al-Hikmah)',
      recipient_phone: '0812-4455-6677',
      destination_address: 'Komp. Sekolah Islam Terpadu (SIT) Al-Hikmah, Jl. Menpor No. 05, RT 02/RW 03, Kel. Tugu, Kec. Cimanggis, Kota Depok, Jawa Barat 16951',
      destination_coords: { lat: -6.35623, lng: 106.85073 },
      started_at: '09:45 WIB',
      eta_minutes: 14,
      distance_km: 3.2,
      progress_pct: 45,
      status: 'on_delivery',
      delivery_notes: 'Pengantaran paket Al-Qur\'an dan Kitab grosir (12 koli)',
    },
    trip_history: [
      {
        lat: STORE_BASE_COORDS.lat,
        lng: STORE_BASE_COORDS.lng,
        timestamp: '09:45:00 WIB',
        speed_kmh: 0,
        accuracy_meters: 4,
        address: 'Gudang Utama USKI Margonda (Muat Barang 12 Koli)',
      },
      {
        lat: -6.3690,
        lng: 106.8370,
        timestamp: '09:55:12 WIB',
        speed_kmh: 35,
        accuracy_meters: 5,
        address: 'Jl. Margonda persimpangan Juanda',
      },
      {
        lat: -6.3640,
        lng: 106.8410,
        timestamp: '10:05:40 WIB',
        speed_kmh: 42,
        accuracy_meters: 5,
        address: 'Jl. Ir. H. Juanda, dekat Pintu Tol Cijago',
      },
    ],
    stationary_alert: {
      is_stationary: false,
      duration_minutes: 0,
      alert_type: null,
    },
  },
];

const COURIER_STORAGE_KEY = 'uski_couriers_v3';

const getInitialCouriers = (): Courier[] => {
  try {
    const saved = localStorage.getItem(COURIER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all fields exist
      return parsed.map((c: any, index: number) => ({
        ...initialCouriers[index % initialCouriers.length],
        ...c,
        trip_history: c.trip_history || initialCouriers[index % initialCouriers.length]?.trip_history || [],
        stationary_alert: c.stationary_alert || { is_stationary: false, duration_minutes: 0, alert_type: null },
      }));
    }
    return initialCouriers;
  } catch {
    return initialCouriers;
  }
};

export const useCourierStore = create<CourierState>((set, get) => ({
  couriers: getInitialCouriers(),
  activeCourierId: initialCouriers[0].id,
  gpsTrackingIntervalSeconds: 15,

  setGpsTrackingIntervalSeconds: (seconds) => set({ gpsTrackingIntervalSeconds: seconds }),

  setCouriersFromSupabase: (cloudCouriers) => {
    if (!cloudCouriers || cloudCouriers.length === 0) return;
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(cloudCouriers));
    } catch {
      // ignore
    }
    set({ couriers: cloudCouriers });
  },

  setActiveCourierId: (id) => set({ activeCourierId: id }),

  updateLocation: (courierId, loc) => {
    let updatedLocation: any = null;
    let updatedActiveDelivery: any = undefined;

    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
        const now = Date.now();
        const speed = loc.speed_kmh !== undefined ? loc.speed_kmh : c.current_location.speed_kmh;

        updatedLocation = {
          ...c.current_location,
          ...loc,
          last_updated: new Date().toLocaleTimeString('id-ID'),
          last_timestamp: now,
        };
        updatedActiveDelivery = c.active_delivery;

        // Create breadcrumb
        const newBreadcrumb: BreadcrumbPoint = {
          lat: updatedLocation.lat,
          lng: updatedLocation.lng,
          timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
          speed_kmh: speed,
          address: updatedLocation.address_approx,
          accuracy_meters: updatedLocation.accuracy_meters,
        };

        const existingTrail = c.trip_history || [];
        // Only append if moved or last breadcrumb > 30s ago
        const updatedTrail = [
          ...existingTrail.slice(-24), // keep last 25 points
          newBreadcrumb,
        ];

        // Check Stationary & Abnormal Speed
        let alertState = c.stationary_alert || {
          is_stationary: false,
          duration_minutes: 0,
          alert_type: null,
        };

        if (speed > 105) {
          alertState = {
            is_stationary: false,
            duration_minutes: 0,
            alert_type: 'abnormal_speed',
            message: `Kecepatan tidak wajar terdeteksi (${speed} km/jam)! Mohon verifikasi keselamatan driver.`,
          };
        } else if (c.status === 'delivering' && speed === 0) {
          const prevDuration = alertState.is_stationary ? alertState.duration_minutes : 0;
          const newDuration = prevDuration + 1;
          if (newDuration >= 30) {
            alertState = {
              is_stationary: true,
              duration_minutes: newDuration,
              alert_type: 'idle_too_long',
              message: `Kurir diam/macet di lokasi selama ${newDuration} menit saat bertugas mengantar.`,
            };
          } else {
            alertState = {
              is_stationary: true,
              duration_minutes: newDuration,
              alert_type: null,
            };
          }
        } else {
          alertState = {
            is_stationary: false,
            duration_minutes: 0,
            alert_type: null,
          };
        }

        return {
          ...c,
          last_seen_at: new Date().toISOString(),
          current_location: updatedLocation,
          trip_history: updatedTrail,
          stationary_alert: alertState,
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });

    if (isSupabaseConfigured && updatedLocation) {
      dbService.couriers.updateLocation(courierId, updatedLocation, updatedActiveDelivery).catch((err) =>
        console.error('Failed to sync courier GPS to Supabase:', err)
      );
    }
  },

  recordTripBreadcrumb: (courierId, point) => {
    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
        return {
          ...c,
          trip_history: [...(c.trip_history || []).slice(-24), point],
        };
      }
      return c;
    });
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  assignDelivery: (courierId, deliveryData) => {
    const activeDelivery: ActiveDelivery = {
      ...deliveryData,
      status: deliveryData.status || 'assigned',
      progress_pct: 10,
      started_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    // Also update order status in orderStore to ready_for_pickup or shipped
    useOrderStore.getState().updateOrderStatus(deliveryData.order_id, 'shipped');

    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
        const startPoint: BreadcrumbPoint = {
          lat: c.current_location.lat,
          lng: c.current_location.lng,
          timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
          speed_kmh: 0,
          accuracy_meters: c.current_location.accuracy_meters,
          address: `Ditugaskan order #${deliveryData.order_number} (${deliveryData.recipient_name})`,
        };

        return {
          ...c,
          status: 'delivering' as const,
          active_delivery: activeDelivery,
          is_gps_active: true,
          trip_history: [...(c.trip_history || []).slice(-24), startPoint],
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  reassignDelivery: (orderId, fromCourierId, toCourierId, reason) => {
    const sourceCourier = get().couriers.find((c) => c.id === fromCourierId);
    if (!sourceCourier || !sourceCourier.active_delivery) return;

    const deliveryToTransfer: ActiveDelivery = {
      ...sourceCourier.active_delivery,
      status: 'assigned',
      reassigned_from: sourceCourier.name,
      reassign_reason: reason,
      started_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    const updated = get().couriers.map((c) => {
      // Release source courier
      if (c.id === fromCourierId) {
        return {
          ...c,
          status: 'available' as const,
          active_delivery: null,
          trip_history: [
            ...(c.trip_history || []).slice(-24),
            {
              lat: c.current_location.lat,
              lng: c.current_location.lng,
              timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
              speed_kmh: 0,
              address: `Pesanan #${deliveryToTransfer.order_number} dialihkan ke kurir lain. Alasan: ${reason}`,
            },
          ],
        };
      }
      // Assign to destination courier
      if (c.id === toCourierId) {
        return {
          ...c,
          status: 'delivering' as const,
          active_delivery: deliveryToTransfer,
          is_gps_active: true,
          trip_history: [
            ...(c.trip_history || []).slice(-24),
            {
              lat: c.current_location.lat,
              lng: c.current_location.lng,
              timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
              speed_kmh: 0,
              address: `Menerima pengalihan order #${deliveryToTransfer.order_number} dari ${sourceCourier.name}`,
            },
          ],
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  updateDeliveryStatus: (courierId, status, details) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    if (!courier || !courier.active_delivery) return;

    const nowStr = new Date().toLocaleTimeString('id-ID') + ' WIB';

    if (status === 'delivered') {
      get().completeDelivery(courierId);
      return;
    }

    if (status === 'failed') {
      get().failDelivery(courierId, details?.failed_reason || 'Kendala lapangan', details?.failed_notes);
      return;
    }

    const updated = get().couriers.map((c) => {
      if (c.id === courierId && c.active_delivery) {
        const nextDelivery: ActiveDelivery = {
          ...c.active_delivery,
          status,
          picked_up_at: status === 'pickup' ? nowStr : c.active_delivery.picked_up_at,
          progress_pct: status === 'pickup' ? 30 : status === 'on_delivery' ? 50 : c.active_delivery.progress_pct,
        };

        const statusNote =
          status === 'pickup'
            ? 'Paket telah diambil di gudang/toko (Status: Pickup)'
            : 'Paket dalam perjalanan ke alamat pembeli (Status: On Delivery)';

        return {
          ...c,
          active_delivery: nextDelivery,
          trip_history: [
            ...(c.trip_history || []).slice(-24),
            {
              lat: c.current_location.lat,
              lng: c.current_location.lng,
              timestamp: nowStr,
              speed_kmh: c.current_location.speed_kmh,
              address: statusNote,
            },
          ],
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  advanceSimulation: (courierId) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    if (!courier || !courier.active_delivery) return;

    const currentProg = courier.active_delivery.progress_pct;
    const nextProg = Math.min(100, currentProg + 15);

    // Calculate interpolated coords between current and destination
    const target = courier.active_delivery.destination_coords;
    const ratio = nextProg / 100;
    const origin = STORE_BASE_COORDS;

    const newLat = origin.lat + (target.lat - origin.lat) * ratio;
    const newLng = origin.lng + (target.lng - origin.lng) * ratio;

    const remDist = Math.max(0, courier.active_delivery.distance_km * (1 - ratio));
    const remEta = Math.max(1, Math.round(courier.active_delivery.eta_minutes * (1 - ratio)));

    const nowStr = new Date().toLocaleTimeString('id-ID');
    const newSpeed = nextProg >= 100 ? 0 : Math.floor(25 + Math.random() * 15);

    const updated = get().couriers.map((c) => {
      if (c.id === courierId && c.active_delivery) {
        const nextLoc: CourierLocation = {
          ...c.current_location,
          lat: Number(newLat.toFixed(5)),
          lng: Number(newLng.toFixed(5)),
          speed_kmh: newSpeed,
          last_updated: nowStr,
          last_timestamp: Date.now(),
        };

        const breadcrumb: BreadcrumbPoint = {
          lat: nextLoc.lat,
          lng: nextLoc.lng,
          timestamp: nowStr + ' WIB',
          speed_kmh: newSpeed,
          accuracy_meters: nextLoc.accuracy_meters,
          address: `Pergerakan armada (${nextProg}% perjalanan) menuju ${c.active_delivery?.destination_address?.slice(0, 35)}...`,
        };

        return {
          ...c,
          last_seen_at: new Date().toISOString(),
          current_location: nextLoc,
          active_delivery: {
            ...c.active_delivery,
            progress_pct: nextProg,
            distance_km: Number(remDist.toFixed(1)),
            eta_minutes: remEta,
            status: (nextProg >= 100 ? 'delivered' : 'on_delivery') as DeliveryStatus,
          },
          trip_history: [...(c.trip_history || []).slice(-24), breadcrumb],
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  completeDelivery: (courierId, proofPhotoUrl, proofSignatureUrl, notes) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    if (courier && courier.active_delivery) {
      // Update order status in orderStore to delivered
      useOrderStore.getState().updateOrderStatus(courier.active_delivery.order_id, 'delivered');
    }

    const nowStr = new Date().toLocaleTimeString('id-ID') + ' WIB';

    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
        const finishPoint: BreadcrumbPoint = {
          lat: c.current_location.lat,
          lng: c.current_location.lng,
          timestamp: nowStr,
          speed_kmh: 0,
          accuracy_meters: c.current_location.accuracy_meters,
          address: `Pengantaran selesai • Paket diterima oleh penerima (${notes || 'Bukti foto & tanda tangan terverifikasi'})`,
        };

        return {
          ...c,
          status: 'available' as const,
          total_delivered_today: c.total_delivered_today + 1,
          active_delivery: null,
          current_location: {
            ...c.current_location,
            speed_kmh: 0,
            address_approx: 'Selesai antar paket • Siap untuk order berikutnya',
            last_updated: new Date().toLocaleTimeString('id-ID'),
            last_timestamp: Date.now(),
          },
          trip_history: [...(c.trip_history || []).slice(-24), finishPoint],
          stationary_alert: {
            is_stationary: false,
            duration_minutes: 0,
            alert_type: null,
          },
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  failDelivery: (courierId, reason, notes) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    if (!courier || !courier.active_delivery) return;

    const nowStr = new Date().toLocaleTimeString('id-ID') + ' WIB';

    const updated = get().couriers.map((c) => {
      if (c.id === courierId && c.active_delivery) {
        const failedDelivery: ActiveDelivery = {
          ...c.active_delivery,
          status: 'failed',
          failed_at: nowStr,
          failed_reason: reason,
          failed_notes: notes,
        };

        const breadcrumb: BreadcrumbPoint = {
          lat: c.current_location.lat,
          lng: c.current_location.lng,
          timestamp: nowStr,
          speed_kmh: 0,
          accuracy_meters: c.current_location.accuracy_meters,
          address: `Gagal Antar: ${reason}. Catatan: ${notes || '-'}`,
        };

        return {
          ...c,
          status: 'available' as const, // Kurir kembali available untuk tugas lain
          active_delivery: null, // Reset tugas aktif
          current_location: {
            ...c.current_location,
            address_approx: `Gagal antar #${failedDelivery.order_number} (${reason}) • Standby`,
            last_updated: new Date().toLocaleTimeString('id-ID'),
            last_timestamp: Date.now(),
          },
          trip_history: [...(c.trip_history || []).slice(-24), breadcrumb],
        };
      }
      return c;
    });

    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  toggleCourierStatus: (courierId, status) => {
    const updated = get().couriers.map((c) => (c.id === courierId ? { ...c, status } : c));
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  addCourier: (courierData) => {
    const newCourier: Courier = {
      id: `cour-${Date.now()}`,
      name: courierData.name,
      phone: courierData.phone,
      email: courierData.email || `${courierData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@uskistore.id`,
      avatar_url: courierData.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      vehicle_type: courierData.vehicle_type,
      vehicle_plate: courierData.vehicle_plate,
      status: 'available',
      is_gps_active: false,
      total_delivered_today: 0,
      last_seen_at: new Date().toISOString(),
      current_location: {
        lat: STORE_BASE_COORDS.lat,
        lng: STORE_BASE_COORDS.lng,
        heading: 0,
        speed_kmh: 0,
        accuracy_meters: 5,
        address_approx: 'Gudang Utama USKI STORE Margonda Depok',
        last_updated: new Date().toLocaleTimeString('id-ID'),
        last_timestamp: Date.now(),
        battery_level: 98,
      },
      active_delivery: null,
      trip_history: [],
      stationary_alert: { is_stationary: false, duration_minutes: 0, alert_type: null },
    };

    const updated = [...get().couriers, newCourier];
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  updateCourier: (courierId, data) => {
    const updated = get().couriers.map((c) => (c.id === courierId ? { ...c, ...data } : c));
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  deleteCourier: (courierId) => {
    const updated = get().couriers.filter((c) => c.id !== courierId);
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },

  setGpsActive: (courierId, active) => {
    const updated = get().couriers.map((c) => (c.id === courierId ? { ...c, is_gps_active: active } : c));
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });
  },
}));
