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
  Barcode,
  Truck,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { useCourierStore } from '@/store/courierStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { requests } = useCustomOrderStore();
  const { couriers } = useCourierStore();

  const isStaff = user?.role === 'staff';
  const isManager = user?.role === 'manager';

  // Metrics calculation
  const confirmedSales = orders
    .filter((o) => o.payment_status === 'verified')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingPayments = orders.filter((o) => o.status === 'awaiting_payment').length;
  const awaitingVerification = orders.filter((o) => o.status === 'awaiting_verification').length;
  const processingOrders = orders.filter((o) => o.status === 'processing');
  const pendingCustomRequests = requests.filter((r) => r.status === 'pending_review' || r.status === 'checking_supplier').length;
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.min_stock_alert);
  const activeCouriersCount = couriers.filter((c) => c.status === 'delivering').length;

  // ----------------------------------------------------
  // 1. STAFF OPERATIONAL DASHBOARD (FOCUSED & SIMPLE)
  // ----------------------------------------------------
  if (isStaff) {
    return (
      <div className="space-y-6">
        {/* Staff Greeting Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-white/20 text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider">
              Mode Staf Gudang & Logistik
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              Pusat Tugas Operasional Toko
            </h1>
            <p className="text-xs text-amber-100 max-w-xl">
              Fokus pada pengemasan pesanan pelanggan, scan barcode barang masuk/keluar, dan monitoring stok menipis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/products"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-900 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-50 transition-all"
            >
              <Barcode className="w-4 h-4 text-amber-700" />
              <span>Scan Barcode Cepat</span>
            </Link>
          </div>
        </div>

        {/* Staff Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Packing Queue */}
          <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-body">Pesanan Perlu Dipacking</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-600">
              {processingOrders.length} Pesanan
            </div>
            <Link
              to="/admin/orders"
              className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Buka antrean pengemasan</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Low Stock Warning */}
          <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-body">Barang Stok Kritis / Habis</span>
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-badge-text">
              {lowStockProducts.length} Produk
            </div>
            <Link
              to="/admin/products"
              className="text-[11px] text-badge-text font-bold hover:underline flex items-center gap-1"
            >
              <span>Restock barang di gudang</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Active Couriers */}
          <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-body">Armada Kurir Bertugas</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-green-700">
              {activeCouriersCount} Kurir Aktif
            </div>
            <Link
              to="/admin/couriers"
              className="text-[11px] text-green-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Pantau rute GPS kurir</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Operational Task List for Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Urgent Packing Queue Table */}
          <div className="lg:col-span-7 bg-white border border-hairline rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-extrabold text-[#101519]">
                  Antrean Pesanan Siap Dikemas Hari Ini ({processingOrders.length})
                </h3>
              </div>
              <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline">
                Buka Semua
              </Link>
            </div>

            {processingOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-body space-y-1">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                <p className="font-bold text-[#101519]">Semua Pesanan Sudah Dikemas!</p>
                <p>Tidak ada antrean pesanan yang tertunda saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processingOrders.slice(0, 5).map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 bg-neutral-2/50 rounded-2xl border border-hairline flex items-center justify-between text-xs hover:border-amber-400 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700">{ord.order_number}</span>
                        <span className="text-body">•</span>
                        <span className="font-bold text-[#101519]">{ord.customer_name}</span>
                      </div>
                      <p className="text-body text-[11px] mt-0.5">
                        Kurir: <span className="font-bold text-[#101519]">{ord.shipping_method}</span> • {ord.items.length} macam barang
                      </p>
                    </div>

                    <Link
                      to="/admin/orders"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] shrink-0 transition-colors shadow-xs"
                    >
                      Proses Packing →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Critical Stock Restock List */}
          <div className="lg:col-span-5 bg-white border border-hairline rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-extrabold text-[#101519]">
                  Produk Perlu Di-restock ({lowStockProducts.length})
                </h3>
              </div>
              <Link to="/admin/products" className="text-xs font-bold text-primary hover:underline">
                Kelola Stok
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-body space-y-1">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                <p className="font-bold text-[#101519]">Inventaris Aman</p>
                <p>Semua produk masih di atas batas minimum stok.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-red-50/50 rounded-2xl border border-red-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-[#101519] truncate">{prod.name}</p>
                      <p className="text-[11px] text-body font-mono">SKU: {prod.sku_master}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold rounded text-[10px] block">
                        Sisa: {prod.stock_quantity}
                      </span>
                      <span className="text-[10px] text-body block mt-0.5">Min: {prod.min_stock_alert}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. MANAGER & ADMIN BUSINESS DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header with Role Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#101519]">
              {isManager ? 'Dashboard Manajer Operasional' : 'Ringkasan Eksekutif Toko'}
            </h1>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
              isManager ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {isManager ? 'Manajer Toko' : 'Super Admin'}
            </span>
          </div>
          <p className="text-xs text-body mt-1">
            Monitor omset nyata terverifikasi, antrean transfer bank, pengadaan custom RFQ, dan performa armada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-2 hover:bg-neutral-1/30 text-body font-bold text-xs rounded-xl border border-hairline transition-colors"
          >
            <span>Laporan Keuangan</span>
          </Link>
          <Link
            to="/admin/bulk-orders"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white hover:bg-primary-dark font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <span>Tinjau RFQ Grosir</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confirmed Revenue */}
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
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
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
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
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
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
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-2 shadow-xs">
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
            to="/admin/products"
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
        <div className="lg:col-span-7 bg-white border border-hairline rounded-3xl p-6 space-y-4 shadow-sm">
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
        <div className="lg:col-span-5 bg-white border border-hairline rounded-3xl p-6 space-y-4 shadow-sm">
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
