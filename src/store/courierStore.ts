import { create } from 'zustand';
import { Courier, CourierLocation, ActiveDelivery, DeliveryStatus, BreadcrumbPoint } from '@/types';
import { useOrderStore } from './orderStore';
import { dbService, isSupabaseConfigured, supabase } from '@/lib/supabase';

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

export const STORE_BASE_COORDS = { lat: -6.3728, lng: 106.8335 }; // Gudang Utama Margonda Depok

const COURIER_STORAGE_KEY = 'uski_couriers_v3';

const getInitialCouriers = (): Courier[] => {
  try {
    const saved = localStorage.getItem(COURIER_STORAGE_KEY);
    if (!saved) return [];
    const parsed: Courier[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    // Ensure no old dummy mock couriers are injected
    const mockIds = new Set(['cour-1', 'cour-2', 'cour-3']);
    return parsed
      .filter((c: any) => !mockIds.has(c.id))
      .map((c: any) => ({
        ...c,
        trip_history: c.trip_history || [],
        stationary_alert: c.stationary_alert || { is_stationary: false, duration_minutes: 0, alert_type: null },
      }));
  } catch {
    return [];
  }
};

export const useCourierStore = create<CourierState>((set, get) => ({
  couriers: getInitialCouriers(),
  activeCourierId: '',
  gpsTrackingIntervalSeconds: 15,

  setGpsTrackingIntervalSeconds: (seconds) => set({ gpsTrackingIntervalSeconds: seconds }),

  setCouriersFromSupabase: (cloudCouriers) => {
    if (!cloudCouriers) return;
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(cloudCouriers));
    } catch {
      // ignore
    }
    set((state) => ({
      couriers: cloudCouriers,
      activeCourierId: state.activeCourierId || (cloudCouriers.length > 0 ? cloudCouriers[0].id : ''),
    }));
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

    // Update order status in orderStore to shipped
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

    if (isSupabaseConfigured) {
      dbService.couriers.assignDelivery(courierId, activeDelivery).catch((err) =>
        console.error('Failed to sync courier delivery assignment to Supabase:', err)
      );
      dbService.orders.assignCourier(deliveryData.order_id, courierId).catch((err) =>
        console.error('Failed to sync order courier assignment to Supabase:', err)
      );

      const client = supabase;
      if (client) {
        const nowIso = new Date().toISOString();
        Promise.resolve(
          client
            .from('orders')
            .update({
              courier_id: courierId,
              order_status: 'shipped',
              status: 'shipped',
              dispatched_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', deliveryData.order_id)
        )
          .then(({ error }) => {
            if (error && error.code === 'PGRST204') {
              return client
                .from('orders')
                .update({
                  status: 'shipped',
                  updated_at: nowIso,
                })
                .eq('id', deliveryData.order_id);
            }
          })
          .catch((err: any) => console.error('Failed direct assign order to Supabase:', err));

        Promise.resolve(
          client
            .from('couriers')
            .update({
              status: 'delivering',
              active_delivery: activeDelivery,
              updated_at: nowIso,
            })
            .eq('id', courierId)
        ).catch((err: any) => console.error('Failed direct assign courier to Supabase:', err));
      }
    }
  },

  reassignDelivery: (orderId, fromCourierId, toCourierId, reason) => {
    const sourceCourier = get().couriers.find((c) => c.id === fromCourierId);
    const targetCourier = get().couriers.find((c) => c.id === toCourierId);
    if (!sourceCourier || !sourceCourier.active_delivery) return;

    // Ensure only idle/available couriers can receive the reassignment
    if (
      !targetCourier ||
      targetCourier.status !== 'available' ||
      targetCourier.active_delivery !== null
    ) {
      console.warn(`Cannot reassign order ${orderId} to courier ${toCourierId}: courier is not idle/available`);
      return;
    }

    const deliveryToTransfer: ActiveDelivery = {
      ...sourceCourier.active_delivery,
      status: 'assigned',
      reassigned_from: sourceCourier.name,
      reassign_reason: reason,
      started_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    const updated = get().couriers.map((c) => {
      // Release source courier and any courier currently assigned to this order
      if (c.id === fromCourierId || c.active_delivery?.order_id === orderId) {
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

    if (isSupabaseConfigured) {
      dbService.couriers.assignDelivery(toCourierId, deliveryToTransfer).catch((err) =>
        console.error('Failed to sync reassigned delivery to Supabase:', err)
      );
      dbService.orders.assignCourier(orderId, toCourierId, targetCourier?.name).catch((err) =>
        console.error('Failed to sync reassigned order courier to Supabase:', err)
      );

      const client = supabase;
      if (client) {
        const nowIso = new Date().toISOString();
        // Release source courier safely with 'idle' status
        Promise.resolve(
          client
            .from('couriers')
            .update({
              status: 'idle',
              active_delivery: null,
              updated_at: nowIso,
            })
            .eq('id', fromCourierId)
        ).catch((err: any) => console.error('Failed to release source courier in Supabase:', err));

        // Assign target courier
        Promise.resolve(
          client
            .from('couriers')
            .update({
              status: 'delivering',
              active_delivery: deliveryToTransfer,
              updated_at: nowIso,
            })
            .eq('id', toCourierId)
        ).catch((err: any) => console.error('Failed to assign target courier in Supabase:', err));

        // Update order
        Promise.resolve(
          client
            .from('orders')
            .update({
              courier_id: toCourierId,
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
          .catch((err: any) => console.error('Failed to reassign order courier in Supabase:', err));
      }
    }
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

    if (isSupabaseConfigured && courier.active_delivery) {
      dbService.couriers.updateLocation(courierId, courier.current_location, {
        ...courier.active_delivery,
        status,
      }).catch((err) => console.error('Failed to sync delivery status to Supabase:', err));
    }
  },

  completeDelivery: (courierId, proofPhotoUrl, proofSignatureUrl, notes) => {
    const courier = get().couriers.find((c) => c.id === courierId);
    const activeDelivery = courier?.active_delivery;

    if (activeDelivery) {
      useOrderStore.getState().updateOrderStatus(activeDelivery.order_id, 'delivered');
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

    if (isSupabaseConfigured) {
      dbService.couriers.completeDelivery(courierId).catch((err) =>
        console.error('Failed to complete delivery in Supabase:', err)
      );

      if (courier && activeDelivery) {
        const nowIso = new Date().toISOString();
        const client = supabase;
        if (client) {
          const fullOrderUpdates = {
            order_status: 'delivered',
            status: 'delivered',
            delivery_proof_url: proofPhotoUrl || '',
            delivery_signature_url: proofSignatureUrl || '',
            delivery_recipient_name: activeDelivery.recipient_name,
            delivery_notes: notes || null,
            delivered_at: nowIso,
            proof_of_payment_url: proofPhotoUrl || '',
            updated_at: nowIso,
          };

          Promise.resolve(
            client
              .from('orders')
              .update(fullOrderUpdates)
              .eq('id', activeDelivery.order_id)
          )
            .then(({ error }) => {
              if (error && error.code === 'PGRST204') {
                return client
                  .from('orders')
                  .update({
                    status: 'delivered',
                    proof_of_payment_url: proofPhotoUrl || '',
                    updated_at: nowIso,
                  })
                  .eq('id', activeDelivery.order_id);
              }
            })
            .catch((err: any) => console.error('Failed to update order status in Supabase:', err));

          const nextDelivered = (courier.total_delivered_today || 0) + 1;
          Promise.resolve(
            client
              .from('couriers')
              .update({
                status: 'available',
                active_delivery: null,
                total_delivered_today: nextDelivered,
                updated_at: nowIso,
              })
              .eq('id', courierId)
          )
            .then(({ error }) => {
              if (error) {
                return client
                  .from('couriers')
                  .update({
                    status: 'idle',
                    active_delivery: null,
                    total_delivered_today: nextDelivered,
                    updated_at: nowIso,
                  })
                  .eq('id', courierId);
              }
            })
            .catch((err: any) => console.error('Failed to update courier in Supabase:', err));
        }

        dbService.orders.completeDelivery(
          activeDelivery.order_id,
          proofPhotoUrl || '',
          proofSignatureUrl || '',
          activeDelivery.recipient_name,
          notes
        ).catch((err) => console.error('Failed to complete order delivery in Supabase:', err));

        dbService.deliveryProofs.insert({
          order_id: activeDelivery.order_id,
          courier_id: courierId,
          recipient_name: activeDelivery.recipient_name,
          proof_photo_url: proofPhotoUrl || '',
          signature_url: proofSignatureUrl,
          delivery_notes: notes,
          delivered_at: nowIso,
        }).catch((err) => console.error('Failed to persist delivery proof record in Supabase:', err));
      }
    }
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
          status: 'available' as const,
          active_delivery: null,
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

    if (isSupabaseConfigured) {
      dbService.couriers.updateStatus(courierId, 'available').catch((err) =>
        console.error('Failed to reset courier status in Supabase:', err)
      );
    }
  },

  toggleCourierStatus: (courierId, status) => {
    const mappedStatus = status === 'available' ? 'idle' : status === 'off_duty' ? 'offline' : status;
    const updated = get().couriers.map((c) => (c.id === courierId ? { ...c, status: mappedStatus as any } : c));
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });

    if (isSupabaseConfigured) {
      dbService.couriers.updateStatus(courierId, mappedStatus).catch((err) =>
        console.error('Failed to toggle courier status in Supabase:', err)
      );
    }
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
        lat: 0,
        lng: 0,
        heading: 0,
        speed_kmh: 0,
        accuracy_meters: 0,
        address_approx: 'Menunggu sinyal GPS perangkat',
        last_updated: new Date().toLocaleTimeString('id-ID'),
        last_timestamp: Date.now(),
        battery_level: 100,
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

    if (isSupabaseConfigured && supabase) {
      const dbPayload: any = {
        ...newCourier,
        status: 'idle',
      };
      supabase.from('couriers').insert(dbPayload).then(({ error }) => {
        if (error) console.error('Error inserting courier to Supabase:', error);
      });
    }
  },

  updateCourier: (courierId, data) => {
    const updated = get().couriers.map((c) => (c.id === courierId ? { ...c, ...data } : c));
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });

    if (isSupabaseConfigured && supabase) {
      const dbPayload: any = { ...data };
      if (dbPayload.status === 'off_duty') dbPayload.status = 'offline';
      if (dbPayload.status === 'available') dbPayload.status = 'idle';
      supabase.from('couriers').update(dbPayload).eq('id', courierId).then(({ error }) => {
        if (error) console.error('Error updating courier in Supabase:', error);
      });
    }
  },

  deleteCourier: (courierId) => {
    const updated = get().couriers.filter((c) => c.id !== courierId);
    try {
      localStorage.setItem(COURIER_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    set({ couriers: updated });

    if (isSupabaseConfigured && supabase) {
      supabase.from('couriers').delete().eq('id', courierId).then(({ error }) => {
        if (error) console.error('Error deleting courier from Supabase:', error);
      });
    }
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
