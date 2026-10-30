import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const AdminReports: React.FC = () => {
  const { orders } = useOrderStore();
  const { products, inventoryMovements } = useProductStore();

  const [dateFilter, setDateFilter] = useState('30days');

  // Confirmed orders
  const paidOrders = orders.filter((o) => o.payment_status === 'verified');
  const grossSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const confirmedSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalItemsSold = paidOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  // Profit calculation (approx 30% margin on retail without internal COGS override)
  const estimatedProfit = confirmedSales * 0.28;

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Phone', 'Payment Method', 'Status', 'Total'];
    const rows = orders.map((o) => [
      o.order_number,
      o.created_at,
      `"${o.customer_name}"`,
      o.customer_phone,
      o.payment_method,
      o.status,
      o.total_amount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `USKI_STORE_Laporan_Penjualan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Laporan Penjualan & Analitik Laba
          </h1>
          <p className="text-xs text-body mt-1">
            Data transaksi terverifikasi, perputaran stok, dan estimasi laba kotor
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Laporan (CSV)</span>
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-body">Omset Sah Masuk (Lunas)</span>
          <p className="text-2xl font-extrabold text-primary">{formatRupiah(confirmedSales)}</p>
          <span className="text-[10px] text-body block">Dari {paidOrders.length} transaksi sah</span>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-body">Estimasi Laba Kotor (Margin)</span>
          <p className="text-2xl font-extrabold text-green-600">{formatRupiah(estimatedProfit)}</p>
          <span className="text-[10px] text-green-700 block">Rasio Margin ~28%</span>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-body">Total Barang Terjual</span>
          <p className="text-2xl font-extrabold text-[#101519]">{totalItemsSold} Unit</p>
          <span className="text-[10px] text-body block">Buku & ATK</span>
        </div>

        <div className="bg-white border border-hairline rounded-2xl p-5 space-y-1">
          <span className="text-xs font-bold text-body">Nilai Aset Stok Toko</span>
          <p className="text-2xl font-extrabold text-[#101519]">
            {formatRupiah(products.reduce((sum, p) => sum + p.base_price * p.stock_quantity, 0))}
          </p>
          <span className="text-[10px] text-body block">{products.length} SKU aktif</span>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h3 className="font-extrabold text-sm text-[#101519] border-b border-hairline pb-3">
          Rincian Transaksi Berdasarkan Metode Pembayaran
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {[
            { method: 'Transfer Bank Manual', count: orders.filter((o) => o.payment_method === 'bank_transfer').length },
            { method: 'QRIS Instant Toko', count: orders.filter((o) => o.payment_method === 'manual_qris').length },
            { method: 'Cash on Delivery (COD)', count: orders.filter((o) => o.payment_method === 'cod').length },
          ].map((m) => (
            <div key={m.method} className="p-4 bg-neutral-2/50 border border-hairline rounded-2xl space-y-1">
              <span className="font-bold text-[#101519]">{m.method}</span>
              <p className="text-base font-extrabold text-primary">{m.count} Pesanan</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
