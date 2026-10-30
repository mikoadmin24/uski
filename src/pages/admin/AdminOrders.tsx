import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  Printer,
  ChevronDown,
  CheckCircle2,
  Clock,
  MapPin,
  X,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import { OrderStatus, Order } from '@/types';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, updateShipmentTracking } = useOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [courierInput, setCourierInput] = useState('');
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState<Order | null>(null);
  const [printShippingLabelOrder, setPrintShippingLabelOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForTracking || !trackingNumberInput.trim()) return;

    updateShipmentTracking(
      selectedOrderForTracking.id,
      trackingNumberInput.trim(),
      courierInput || selectedOrderForTracking.shipping_method
    );

    setSelectedOrderForTracking(null);
    setTrackingNumberInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Manajemen Pesanan Pelanggan
          </h1>
          <p className="text-xs text-body mt-1">
            Proses pengemasan, input resi pengiriman, dan cetak invoice resmi
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-hairline rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari nomor order, nama pelanggan, atau no. telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
        >
          <option value="all">Semua Status Pesanan</option>
          <option value="awaiting_payment">Menunggu Pembayaran</option>
          <option value="awaiting_verification">Menunggu Verifikasi</option>
          <option value="processing">Sedang Diproses / Dikemas</option>
          <option value="shipped">Sedang Dikirim (In Transit)</option>
          <option value="delivered">Pesanan Selesai</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Pesanan</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Status Order</th>
                <th className="py-3 px-4 text-center">Resi / Logistik</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-neutral-2/20">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {ord.order_number}
                    <span className="block font-normal text-body text-[10px]">
                      {formatDate(ord.created_at)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#101519] block">{ord.customer_name}</span>
                    <span className="text-body text-[11px]">{ord.customer_phone}</span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-[#101519]">
                    {formatRupiah(ord.total_amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-body uppercase">{ord.payment_method.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={ord.status}
                      onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        ord.status === 'awaiting_verification'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : ord.status === 'processing'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : ord.status === 'shipped'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : ord.status === 'delivered'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-neutral-2 text-body border-hairline'
                      }`}
                    >
                      <option value="awaiting_payment">Menunggu Pembayaran</option>
                      <option value="awaiting_verification">Menunggu Verifikasi</option>
                      <option value="processing">Sedang Dikemas (Processing)</option>
                      <option value="shipped">Sedang Dikirim (Shipped)</option>
                      <option value="delivered">Pesanan Selesai (Delivered)</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {ord.shipment?.tracking_number ? (
                      <span className="font-bold text-primary">{ord.shipment.tracking_number}</span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedOrderForTracking(ord);
                          setCourierInput(ord.shipping_method);
                        }}
                        className="px-3 py-1 bg-neutral-2 hover:bg-primary hover:text-white rounded-lg text-[11px] font-bold transition-colors"
                      >
                        + Input Resi
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setPrintInvoiceOrder(ord)}
                        title="Cetak Faktur / Invoice"
                        className="p-1.5 hover:text-primary text-body hover:bg-neutral-2 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPrintShippingLabelOrder(ord)}
                        title="Cetak Label Resi Pengiriman (Thermal 100x150mm)"
                        className="p-1.5 hover:text-green-600 text-body hover:bg-neutral-2 rounded-lg transition-colors"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Resi Tracking Modal */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-sm text-[#101519]">
                Input Resi: {selectedOrderForTracking.order_number}
              </h3>
              <button onClick={() => setSelectedOrderForTracking(null)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Pilih / Nama Jasa Ekspedisi</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Kurir Toko USKI', 'J&T Express', 'SiCepat', 'Sentral Kargo'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCourierInput(c)}
                      className="px-2 py-1 bg-neutral-2 hover:bg-primary hover:text-white rounded text-[10px] font-semibold transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor Resi / Kode Antar Toko *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: USKI-TOKO-01 atau JNT-982192"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-mono font-bold uppercase"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForTracking(null)}
                  className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl"
                >
                  Simpan & Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {printInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <span className="text-xl font-extrabold text-primary">USKI STORE</span>
                <span className="text-xs text-body block">Faktur & Surat Jalan Resmi</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm">{printInvoiceOrder.order_number}</span>
                <span className="text-xs text-body block">{formatDate(printInvoiceOrder.created_at)}</span>
              </div>
            </div>

            {/* Recipient info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-body block">Penerima:</span>
                <p className="font-bold text-[#101519]">{printInvoiceOrder.shipping_address.recipient_name}</p>
                <p className="text-body">{printInvoiceOrder.shipping_address.phone_number}</p>
                <p className="text-body">{printInvoiceOrder.shipping_address.street_address}, {printInvoiceOrder.shipping_address.city}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-body block">Metode Pembayaran:</span>
                <p className="font-bold text-[#101519] uppercase">{printInvoiceOrder.payment_method}</p>
                <span className="font-bold text-body block mt-2">Logistik:</span>
                <p className="font-bold text-primary">{printInvoiceOrder.shipping_method}</p>
              </div>
            </div>

            {/* Table of items */}
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-hairline text-body font-bold">
                  <th className="py-2">Item Barang</th>
                  <th className="py-2 text-center">Jumlah</th>
                  <th className="py-2 text-right">Harga</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {printInvoiceOrder.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 font-bold text-[#101519]">{it.product_name}</td>
                    <td className="py-2.5 text-center">{it.quantity}</td>
                    <td className="py-2.5 text-right">{formatRupiah(it.price)}</td>
                    <td className="py-2.5 text-right font-bold">{formatRupiah(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total calculation */}
            <div className="space-y-1.5 text-xs max-w-xs ml-auto border-t border-hairline pt-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(printInvoiceOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span>{formatRupiah(printInvoiceOrder.shipping_fee)}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-1 text-sm font-extrabold text-primary">
                <span>Total Tagihan:</span>
                <span>{formatRupiah(printInvoiceOrder.total_amount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex justify-end gap-3">
              <button
                onClick={() => setPrintInvoiceOrder(null)}
                className="px-4 py-2 bg-neutral-2 text-body font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Thermal Shipping Label (100x150 mm) Modal */}
      {printShippingLabelOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl print:m-0 print:p-0 print:border-none print:shadow-none">
            {/* Header Controls (hidden on print) */}
            <div className="flex items-center justify-between border-b border-hairline pb-2 print:hidden">
              <span className="text-xs font-bold text-body">Label Thermal (100x150 mm)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak Label</span>
                </button>
                <button
                  onClick={() => setPrintShippingLabelOrder(null)}
                  className="px-2 py-1 bg-neutral-2 text-body font-bold text-xs rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Label Card Body (Thermal 100x150mm format) */}
            <div className="border-2 border-black p-4 space-y-3 font-sans text-black">
              {/* Top Banner: Courier & Logistics Name */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <h4 className="font-extrabold text-sm tracking-wider uppercase text-primary">USKI STORE</h4>
                  <p className="text-[10px] font-bold">EKSPEDISI: {printShippingLabelOrder.shipment?.courier_name || printShippingLabelOrder.shipping_method}</p>
                </div>
                {printShippingLabelOrder.payment_method === 'cod' ? (
                  <div className="px-2 py-1 bg-black text-white font-black text-xs rounded">
                    COD: {formatRupiah(printShippingLabelOrder.total_amount)}
                  </div>
                ) : (
                  <div className="px-2 py-0.5 border border-black font-black text-[10px] uppercase">
                    NON-COD (LUNAS)
                  </div>
                )}
              </div>

              {/* Barcode Area */}
              <div className="text-center py-1 border-b-2 border-black space-y-0.5">
                <div className="font-mono tracking-widest text-lg font-black bg-neutral-100 py-1 border border-black/30">
                  ||| | |||| | ||||| |||
                </div>
                <p className="font-mono font-bold text-xs tracking-wider">
                  {printShippingLabelOrder.shipment?.tracking_number || printShippingLabelOrder.order_number}
                </p>
              </div>

              {/* Recipient (Penerima) */}
              <div className="border-b-2 border-black pb-2 space-y-0.5 text-xs">
                <span className="font-bold uppercase text-[10px] text-gray-600 block">PENERIMA:</span>
                <p className="font-extrabold text-sm text-black">{printShippingLabelOrder.shipping_address.recipient_name}</p>
                <p className="font-bold text-xs">{printShippingLabelOrder.shipping_address.phone_number}</p>
                <p className="text-[11px] leading-snug">
                  {printShippingLabelOrder.shipping_address.street_address}, {printShippingLabelOrder.shipping_address.district}, {printShippingLabelOrder.shipping_address.city}, {printShippingLabelOrder.shipping_address.province} ({printShippingLabelOrder.shipping_address.postal_code})
                </p>
              </div>

              {/* Sender (Pengirim) */}
              <div className="border-b border-black pb-2 space-y-0.5 text-[11px]">
                <span className="font-bold uppercase text-[9px] text-gray-600 block">PENGIRIM:</span>
                <p className="font-bold">USKI STORE (0812-3456-7890)</p>
                <p className="text-[10px] text-gray-700">Jl. Margonda Raya No. 102, Depok, Jawa Barat</p>
              </div>

              {/* Package Content & Notes */}
              <div className="text-[10px] space-y-0.5">
                <p><strong>Isi Paket:</strong> {printShippingLabelOrder.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}</p>
                {printShippingLabelOrder.notes && (
                  <p className="italic text-gray-700"><strong>Catatan:</strong> {printShippingLabelOrder.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
