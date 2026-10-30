import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrderStore } from '@/store/orderStore';
import { useCourierStore } from '@/store/courierStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { OrderStatus } from '@/types';
import {
  PackageCheck,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
  ArrowRight,
  AlertCircle,
  Navigation,
  Phone,
  ExternalLink,
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { getOrderByNumber } = useOrderStore();

  const queryRef = searchParams.get('ref') || '';
  const [orderQuery, setOrderQuery] = useState(queryRef);
  const [searchedOrder, setSearchedOrder] = useState<any | null>(() => {
    return queryRef ? getOrderByNumber(queryRef) || null : null;
  });
  const [errorNotFound, setErrorNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    const found = getOrderByNumber(orderQuery);
    if (found) {
      setSearchedOrder(found);
      setErrorNotFound(false);
    } else {
      setSearchedOrder(null);
      setErrorNotFound(true);
    }
  };

  const getStepActive = (status: OrderStatus) => {
    switch (status) {
      case 'awaiting_payment':
        return 1;
      case 'awaiting_verification':
        return 1;
      case 'processing':
        return 2;
      case 'ready_for_pickup':
        return 3;
      case 'shipped':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  };

  const currentStep = searchedOrder ? getStepActive(searchedOrder.status) : 1;

  const steps = [
    { step: 1, label: 'Pesanan Dibuat', desc: 'Menunggu konfirmasi pembayaran' },
    { step: 2, label: 'Pembayaran Sah', desc: 'Pesanan diverifikasi staf' },
    { step: 3, label: 'Sedang Dikemas', desc: 'Packaging & pengecekan barang' },
    { step: 4, label: 'Dalam Pengiriman', desc: 'Diserahkan ke kurir / ekspedisi' },
    { step: 5, label: 'Pesanan Diterima', desc: 'Barang telah sampai di tujuan' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Search Header */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-4 text-center">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <PackageCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#101519]">
          Pelacakan Status Pesanan
        </h1>
        <p className="text-xs sm:text-sm text-body max-w-md mx-auto">
          Masukkan nomor invoice pesanan Anda untuk memeriksa status pengemasan, verifikasi pembayaran, dan resi kurir.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-2">
          <input
            type="text"
            required
            placeholder="Contoh: USKI-20260320-1042"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            className="flex-1 h-11 px-4 bg-neutral-2 border border-hairline rounded-xl text-xs uppercase font-mono font-bold focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-6 h-11 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-dark transition-all flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Lacak</span>
          </button>
        </form>

        {errorNotFound && (
          <p className="text-xs text-badge-text font-bold pt-2 flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Pesanan dengan nomor tersebut tidak ditemukan. Periksa kembali ejaannya.
          </p>
        )}
      </div>

      {/* Tracking Result View */}
      {searchedOrder && (
        <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-hairline gap-2">
            <div>
              <span className="text-xs text-body">Nomor Pesanan:</span>
              <h2 className="text-lg font-mono font-extrabold text-primary">
                {searchedOrder.order_number}
              </h2>
            </div>
            <div className="text-xs text-body">
              <span>Waktu Transaksi: </span>
              <span className="font-bold text-[#101519]">{formatDate(searchedOrder.created_at)}</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="py-4">
            <div className="relative flex items-center justify-between">
              {/* Stepper background line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-2 z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((st) => {
                const isCompleted = st.step <= currentStep;
                const isCurrent = st.step === currentStep;

                return (
                  <div key={st.step} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-white border-2 border-hairline text-body'
                      }`}
                    >
                      {st.step < currentStep ? <CheckCircle2 className="w-4 h-4" /> : st.step}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold mt-2 text-center max-w-[80px] leading-tight ${
                        isCurrent ? 'text-primary' : 'text-body'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipment & Courier Card */}
          {searchedOrder.shipment ? (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  {searchedOrder.shipment.courier_name} ({searchedOrder.shipment.service_type})
                </span>
                <span className="px-2 py-0.5 bg-primary text-white font-bold rounded text-[10px]">
                  {searchedOrder.shipment.status}
                </span>
              </div>
              <p className="text-[#101519]">
                Nomor Resi Pelacakan: <strong className="font-mono text-sm">{searchedOrder.shipment.tracking_number}</strong>
              </p>
              <p className="text-body text-[11px]">
                Diserahkan ke kurir pada {formatDate(searchedOrder.shipment.dispatched_at)}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-neutral-2 rounded-2xl text-xs text-body flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Resi pengiriman akan otomatis ditampilkan begitu pesanan selesai dikemas dan diserahkan ke pihak ekspedisi.</span>
            </div>
          )}

          {/* Live GPS Courier Card if Kurir Toko USKI is delivering */}
          {(() => {
            const couriers = useCourierStore.getState().couriers;
            const assignedCourier = couriers.find(
              (c) =>
                c.active_delivery?.order_number === searchedOrder.order_number ||
                c.active_delivery?.order_id === searchedOrder.id
            );

            if (searchedOrder.status === 'awaiting_payment' || searchedOrder.status === 'awaiting_verification') {
              return null;
            }

            if (!assignedCourier) {
              if (searchedOrder.shipping_method?.toLowerCase().includes('toko') && searchedOrder.status !== 'cancelled') {
                return (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5">
                    <Clock className="w-5 h-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-bold text-sm text-amber-900">Menunggu Penugasan Kurir Toko</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Pesanan Anda telah masuk antrean pengiriman. Admin toko USKI sedang menugaskan staf kurir internal untuk mengantar paket ke alamat Anda.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }

            return (
              <div className="p-5 bg-gradient-to-br from-[#101519] to-[#2D3033] text-white rounded-3xl space-y-4 shadow-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-green-400">
                      Live GPS Pelacakan Kurir Toko USKI
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60 font-mono">
                    Diperbarui: {assignedCourier.current_location.last_updated}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={assignedCourier.avatar_url}
                    alt={assignedCourier.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate">
                      {assignedCourier.name}
                    </h4>
                    <p className="text-[11px] text-accent-2 font-mono">
                      {assignedCourier.vehicle_plate}
                    </p>
                    <p className="text-[11px] text-white/70 truncate mt-0.5">
                      Posisi: {assignedCourier.current_location.address_approx}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/${assignedCourier.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center justify-center shrink-0"
                    title="Hubungi Kurir via WhatsApp"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                {/* Live ETA and Route progress */}
                <div className="p-3 bg-white/10 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-white/90">
                    <span>Estimasi Sampai (ETA):</span>
                    <span className="font-extrabold text-green-400 text-sm">
                      {assignedCourier.active_delivery?.eta_minutes
                        ? `~${assignedCourier.active_delivery.eta_minutes} Menit Lagi`
                        : 'Menyesuaikan rute pengantaran'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/60">
                    <span>
                      Sisa Jarak: {assignedCourier.active_delivery?.distance_km ? `${assignedCourier.active_delivery.distance_km} km` : '-'}
                    </span>
                    <span>Kecepatan: {assignedCourier.current_location.speed_kmh} km/jam</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${assignedCourier.active_delivery?.progress_pct || 15}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-white/60">
                    Koordinat GPS: {assignedCourier.current_location.lat}, {assignedCourier.current_location.lng}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${assignedCourier.current_location.lat},${assignedCourier.current_location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-white font-bold flex items-center gap-1 text-[11px] transition-colors"
                  >
                    <span>Buka Peta Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Order Items List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-body">
              Barang dalam Pesanan ({searchedOrder.items.length})
            </h3>
            <div className="space-y-2">
              {searchedOrder.items.map((it: any) => (
                <div key={it.id} className="p-3 bg-neutral-2/40 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#101519]">{it.product_name}</p>
                    <p className="text-body text-[11px]">{it.quantity} x {formatRupiah(it.price)} {it.variant_name ? `(${it.variant_name})` : ''}</p>
                  </div>
                  <span className="font-bold text-[#101519]">{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="pt-4 border-t border-hairline text-xs text-body flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#101519]">Tujuan Pengiriman:</span>
              <p>{searchedOrder.shipping_address.recipient_name} ({searchedOrder.shipping_address.phone_number})</p>
              <p>{searchedOrder.shipping_address.street_address}, {searchedOrder.shipping_address.city}, {searchedOrder.shipping_address.province}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
