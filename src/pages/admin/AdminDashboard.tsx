import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { requests } = useCustomOrderStore();

  // Metrics calculation
  const confirmedSales = orders
    .filter((o) => o.payment_status === 'verified')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingPayments = orders.filter((o) => o.status === 'awaiting_payment').length;
  const awaitingVerification = orders.filter((o) => o.status === 'awaiting_verification').length;
  const pendingCustomRequests = requests.filter((r) => r.status === 'pending_review' || r.status === 'checking_supplier').length;
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.min_stock_alert);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#101519]">
          Ringkasan Operasional Toko
        </h1>
        <p className="text-xs text-body mt-1">
          Monitor pendapatan nyata terverifikasi, antrean pemrosesan order, dan pergerakan stok secara berkala.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confirmed Revenue */}
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-body">Omset Sah Terverifikasi</span>
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#101519]">
            {formatRupiah(confirmedSales)}
          </div>
          <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
            <span>Dihitung dari dana yang sudah sah masuk kas toko</span>
          </p>
        </div>

        {/* Verification Queue */}
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-body">Antrean Bukti Bayar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#101519]">
            {awaitingVerification} Transaksi
          </div>
          <Link
            to="/admin/payments"
            className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Periksa bukti transfer sekarang</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pending Custom Requests */}
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-body">Permintaan Custom / RFQ</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#101519]">
            {pendingCustomRequests} Pengajuan
          </div>
          <Link
            to="/admin/bulk-orders"
            className="text-[11px] text-primary font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Buat penawaran harga resmi</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-body">Peringatan Stok Menipis</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-badge-text">
            {lowStockProducts.length} Produk
          </div>
          <Link
            to="/admin/inventory"
            className="text-[11px] text-badge-text font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Buka manajemen inventaris</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Two columns: Recent Orders & Recent Custom Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-hairline rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="text-sm font-extrabold text-[#101519] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Pesanan Masuk Terbaru
            </h3>
            <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              Kelola Semua
            </Link>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{ord.order_number}</span>
                    <span className="text-body">•</span>
                    <span className="font-bold text-[#101519]">{ord.customer_name}</span>
                  </div>
                  <p className="text-body text-[11px] mt-0.5">
                    {ord.items.length} Barang • Total: {formatRupiah(ord.total_amount)}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold block ${
                    ord.status === 'awaiting_verification'
                      ? 'bg-amber-100 text-amber-800'
                      : ord.status === 'shipped'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-body mt-1 block">{formatDate(ord.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Orders / RFQ Tickets (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-hairline rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="text-sm font-extrabold text-[#101519] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Tiket Kebutuhan Custom & Grosir
            </h3>
            <Link to="/admin/bulk-orders" className="text-xs font-bold text-primary hover:underline">
              Buka Semua
            </Link>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary">{req.reference_number}</span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded text-[10px]">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="font-bold text-[#101519] line-clamp-1">{req.title}</p>
                <p className="text-body text-[11px]">
                  {req.customer_name} ({req.institution_name || 'Instansi'}) • Kuantitas: {req.quantity} pcs
                </p>
                <div className="pt-1">
                  <Link
                    to={`/bulk-order/${req.reference_number}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Tinjau Dokumen & Buat Quotation →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
