import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { OrderStatus } from '@/types';

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
