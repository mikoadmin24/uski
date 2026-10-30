import { create } from 'zustand';
import { Courier, CourierLocation, ActiveDelivery } from '@/types';
import { useOrderStore } from './orderStore';

interface CourierState {
  couriers: Courier[];
  activeCourierId: string;
  setActiveCourierId: (id: string) => void;
  updateLocation: (
    courierId: string,
    location: Partial<CourierLocation>
  ) => void;
  assignDelivery: (
    courierId: string,
    delivery: Omit<ActiveDelivery, 'progress_pct' | 'started_at'>
  ) => void;
  advanceSimulation: (courierId: string) => void;
  completeDelivery: (
    courierId: string,
    proofPhotoUrl?: string,
    notes?: string
  ) => void;
  toggleCourierStatus: (courierId: string, status: Courier['status']) => void;
  setGpsActive: (courierId: string, active: boolean) => void;
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
    current_location: {
      lat: -6.3850,
      lng: 106.8280,
      heading: 195,
      speed_kmh: 34,
      accuracy_meters: 4,
      address_approx: 'Jl. Margonda Raya Km 4.5, dekat RS Bunda',
      last_updated: new Date().toLocaleTimeString('id-ID'),
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
      delivery_notes: 'Titip di pos satpam atau hubungi jika sudah di depan pagar',
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
    current_location: {
      lat: STORE_BASE_COORDS.lat,
      lng: STORE_BASE_COORDS.lng,
      heading: 0,
      speed_kmh: 0,
      accuracy_meters: 3,
      address_approx: 'Gudang Utama USKI STORE Margonda',
      last_updated: new Date().toLocaleTimeString('id-ID'),
      battery_level: 95,
    },
    active_delivery: null,
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
    current_location: {
      lat: -6.3640,
      lng: 106.8410,
      heading: 45,
      speed_kmh: 42,
      accuracy_meters: 5,
      address_approx: 'Jl. Ir. H. Juanda, dekat Pintu Tol Cijago',
      last_updated: new Date().toLocaleTimeString('id-ID'),
      battery_level: 72,
    },
    active_delivery: {
      order_id: 'ord-1002',
      order_number: 'USKI-2026-0091',
      recipient_name: 'Yayasan Pendidikan Al-Hikmah',
      recipient_phone: '0812-4455-6677',
      destination_address: 'Komp. Sekolah Islam Terpadu Al-Hikmah, Jl. Cisalak No. 24',
      destination_coords: { lat: -6.3550, lng: 106.8520 },
      started_at: '09:45 WIB',
      eta_minutes: 14,
      distance_km: 3.2,
      progress_pct: 45,
      delivery_notes: 'Pengantaran paket Al-Qur\'an dan Kitab grosir (12 koli)',
    },
  },
];

const COURIER_STORAGE_KEY = 'uski_couriers_v1';

const getInitialCouriers = (): Courier[] => {
  try {
    const saved = localStorage.getItem(COURIER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialCouriers;
  } catch {
    return initialCouriers;
  }
};

export const useCourierStore = create<CourierState>((set, get) => ({
  couriers: getInitialCouriers(),
  activeCourierId: initialCouriers[0].id,

  setActiveCourierId: (id) => set({ activeCourierId: id }),

  updateLocation: (courierId, loc) => {
    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
        return {
          ...c,
          current_location: {
            ...c.current_location,
            ...loc,
            last_updated: new Date().toLocaleTimeString('id-ID'),
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

  assignDelivery: (courierId, deliveryData) => {
    const activeDelivery: ActiveDelivery = {
      ...deliveryData,
      progress_pct: 10,
      started_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
        return {
          ...c,
          status: 'delivering' as const,
          active_delivery: activeDelivery,
          is_gps_active: true,
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

    const updated = get().couriers.map((c) => {
      if (c.id === courierId && c.active_delivery) {
        return {
          ...c,
          current_location: {
            ...c.current_location,
            lat: Number(newLat.toFixed(5)),
            lng: Number(newLng.toFixed(5)),
            speed_kmh: nextProg >= 100 ? 0 : Math.floor(25 + Math.random() * 15),
            last_updated: new Date().toLocaleTimeString('id-ID'),
          },
          active_delivery: {
            ...c.active_delivery,
            progress_pct: nextProg,
            distance_km: Number(remDist.toFixed(1)),
            eta_minutes: remEta,
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

  completeDelivery: (courierId, proofPhotoUrl, notes) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    if (courier && courier.active_delivery) {
      // Update order status in orderStore to delivered
      useOrderStore.getState().updateOrderStatus(courier.active_delivery.order_id, 'delivered');
    }

    const updated = get().couriers.map((c) => {
      if (c.id === courierId) {
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

  toggleCourierStatus: (courierId, status) => {
    const updated = get().couriers.map((c) => (c.id === courierId ? { ...c, status } : c));
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
