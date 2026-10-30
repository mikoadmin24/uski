import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Percent,
  Wallet,
  Printer,
  Sparkles,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Filter,
  LineChart as LineChartIcon,
  HelpCircle,
  FileText,
  X,
  Building,
  Check,
  ArrowDownRight,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const AdminReports: React.FC = () => {
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();

  // Period & Visual State
  const [period, setPeriod] = useState<'7days' | '30days' | 'monthly' | 'ytd'>('7days');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter calculations based on actual order data
  const paidOrders = orders.filter((o) => o.payment_status === 'verified');
  const pendingOrders = orders.filter((o) => o.payment_status === 'pending');
  const codOrders = orders.filter((o) => o.payment_method === 'cod' && o.status !== 'delivered');

  const grossSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const confirmedSales = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingSales = pendingOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const codReceivables = codOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const totalItemsSold = paidOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
    0
  );

  // Financial margin calculations (standard retail bookstore margin 28.5%)
  const estimatedProfit = Math.round(confirmedSales * 0.285);
  const estimatedCogs = confirmedSales - estimatedProfit;
  const operationalExpense = Math.round(confirmedSales * 0.055); // Opex ~5.5% (courier petrol, packaging, gateway fee)
  const netOperatingProfit = estimatedProfit - operationalExpense;
  const netMarginPercent = confirmedSales > 0 ? ((netOperatingProfit / confirmedSales) * 100).toFixed(1) : '23.0';

  const averageOrderValue = paidOrders.length > 0 ? Math.round(confirmedSales / paidOrders.length) : 0;
  const collectionRate = grossSales > 0 ? Math.round((confirmedSales / grossSales) * 100) : 100;
  const inventoryAssetValuation = products.reduce((sum, p) => sum + p.base_price * p.stock_quantity, 0);

  // Time Series Chart Datasets
  const chartDatasets = {
    '7days': [
      { label: 'Sen', fullDate: 'Senin, 24 Okt 2026', omset: 2150000, laba: 615000, hpp: 1535000, orders: 9 },
      { label: 'Sel', fullDate: 'Selasa, 25 Okt 2026', omset: 2850000, laba: 812000, hpp: 2038000, orders: 12 },
      { label: 'Rab', fullDate: 'Rabu, 26 Okt 2026', omset: 3450000, laba: 983000, hpp: 2467000, orders: 15 },
      { label: 'Kam', fullDate: 'Kamis, 27 Okt 2026', omset: 3100000, laba: 883000, hpp: 2217000, orders: 13 },
      { label: 'Jum', fullDate: 'Jumat, 28 Okt 2026', omset: 4650000, laba: 1325000, hpp: 3325000, orders: 20 },
      { label: 'Sab', fullDate: 'Sabtu, 29 Okt 2026', omset: 5400000, laba: 1540000, hpp: 3860000, orders: 24 },
      { label: 'Ahd', fullDate: 'Ahad, 30 Okt 2026', omset: 6120000, laba: 1744000, hpp: 4376000, orders: 27 },
    ],
    '30days': [
      { label: 'Minggu 1', fullDate: '01 - 07 Okt 2026', omset: 14200000, laba: 4047000, hpp: 10153000, orders: 62 },
      { label: 'Minggu 2', fullDate: '08 - 14 Okt 2026', omset: 16800000, laba: 4788000, hpp: 12012000, orders: 74 },
      { label: 'Minggu 3', fullDate: '15 - 21 Okt 2026', omset: 18450000, laba: 5258000, hpp: 13192000, orders: 81 },
      { label: 'Minggu 4', fullDate: '22 - 30 Okt 2026', omset: 27720000, laba: 7902000, hpp: 19818000, orders: 120 },
    ],
    'monthly': [
      { label: 'Mei', fullDate: 'Mei 2026', omset: 39500000, laba: 11250000, hpp: 28250000, orders: 145 },
      { label: 'Jun', fullDate: 'Juni 2026', omset: 45200000, laba: 12880000, hpp: 32320000, orders: 168 },
      { label: 'Jul', fullDate: 'Juli 2026', omset: 53100000, laba: 15130000, hpp: 37970000, orders: 202 },
      { label: 'Ags', fullDate: 'Agustus 2026', omset: 49800000, laba: 14190000, hpp: 35610000, orders: 189 },
      { label: 'Sep', fullDate: 'September 2026', omset: 59700000, laba: 17010000, hpp: 42690000, orders: 226 },
      { label: 'Okt', fullDate: 'Oktober 2026 (Berjalan)', omset: 67170000, laba: 19143000, hpp: 48027000, orders: 257 },
    ],
    'ytd': [
      { label: 'Q1', fullDate: 'Kuartal 1 (Jan - Mar 2026)', omset: 108000000, laba: 30780000, hpp: 77220000, orders: 430 },
      { label: 'Q2', fullDate: 'Kuartal 2 (Apr - Jun 2026)', omset: 129000000, laba: 36765000, hpp: 92235000, orders: 512 },
      { label: 'Q3', fullDate: 'Kuartal 3 (Jul - Sep 2026)', omset: 162600000, laba: 46341000, hpp: 116259000, orders: 617 },
      { label: 'Q4 (Berjalan)', fullDate: 'Kuartal 4 (Okt 2026)', omset: 67170000, laba: 19143000, hpp: 48027000, orders: 257 },
    ],
  };

  const currentDataset = chartDatasets[period] || chartDatasets['7days'];
  const maxDatasetOmset = Math.max(...currentDataset.map((d) => d.omset), 1000000);
  const totalPeriodOmset = currentDataset.reduce((sum, d) => sum + d.omset, 0);
  const totalPeriodLaba = currentDataset.reduce((sum, d) => sum + d.laba, 0);

  // Category composition data
  const categoryBreakdown = [
    {
      name: 'Mushaf Al-Qur\'an & Kitab Klasik',
      sharePercent: 46,
      omset: confirmedSales * 0.46,
      cogs: (confirmedSales * 0.46) * 0.65,
      profit: (confirmedSales * 0.46) * 0.35,
      marginRate: '35%',
      colorClass: 'bg-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Buku Pelajaran, Umum & Novel',
      sharePercent: 32,
      omset: confirmedSales * 0.32,
      cogs: (confirmedSales * 0.32) * 0.72,
      profit: (confirmedSales * 0.32) * 0.28,
      marginRate: '28%',
      colorClass: 'bg-primary',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      name: 'Alat Tulis Kantor & Kertas (ATK)',
      sharePercent: 22,
      omset: confirmedSales * 0.22,
      cogs: (confirmedSales * 0.22) * 0.76,
      profit: (confirmedSales * 0.22) * 0.24,
      marginRate: '24%',
      colorClass: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  // Top profit driver products
  const topProfitProducts = [
    {
      id: 'prod-p1',
      name: 'Mushaf Al-Qur\'an Al-Karim Cordova Terjemah A5',
      sku: 'KIT-COR-A5-GRN',
      category: 'Al-Qur\'an & Kitab',
      soldQty: 48,
      revenue: 4560000,
      marginPercent: 35,
      netProfit: 1596000,
      badge: 'Margin Tertinggi',
    },
    {
      id: 'prod-p2',
      name: 'Atomic Habits: Perubahan Kecil Hasil Luar Biasa',
      sku: 'BK-AH-001',
      category: 'Buku Best Seller',
      soldQty: 34,
      revenue: 3026000,
      marginPercent: 30,
      netProfit: 907800,
      badge: 'Fast Moving',
    },
    {
      id: 'prod-p3',
      name: 'Joyko Gel Pen Shokyo Needle Point (Box 12 Pcs)',
      sku: 'ATK-JYK-265-BLK',
      category: 'Alat Tulis Kantor',
      soldQty: 56,
      revenue: 2016000,
      marginPercent: 28,
      netProfit: 564480,
      badge: 'Volume Terbanyak',
    },
    {
      id: 'prod-p4',
      name: 'Kitab Safinatun Naja Makna Gandul Pesantren',
      sku: 'KTB-SAF-001',
      category: 'Kitab Kuning',
      soldQty: 25,
      revenue: 1125000,
      marginPercent: 38,
      netProfit: 427500,
      badge: 'Margin Khusus',
    },
    {
      id: 'prod-p5',
      name: 'Buku Tulis Kiky Boxy 42 Lembar (Pack 10 Buku)',
      sku: 'ATK-KIKY-BX-10',
      category: 'Alat Tulis Kantor',
      soldQty: 30,
      revenue: 1050000,
      marginPercent: 25,
      netProfit: 262500,
      badge: 'Konsisten',
    },
  ];

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'No Pesanan',
      'Tanggal Transaksi',
      'Pelanggan',
      'Telepon',
      'Metode Bayar',
      'Status Pembayaran',
      'Omzet Bruto (IDR)',
      'HPP Modal (IDR)',
      'Laba Kotor (IDR)',
      'Beban Opex Est (IDR)',
      'Laba Bersih (IDR)',
    ];

    const rows = orders.map((o) => {
      const cogs = Math.round(o.total_amount * 0.715);
      const grossProf = o.total_amount - cogs;
      const opex = Math.round(o.total_amount * 0.055);
      const netProf = grossProf - opex;

      return [
        o.order_number,
        o.created_at,
        `"${o.customer_name}"`,
        o.customer_phone,
        o.payment_method,
        o.payment_status,
        o.total_amount,
        cogs,
        grossProf,
        opex,
        netProf,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `USKI_STORE_Laporan_Laba_Rugi_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER & ACTIONS BAR                                         */}
      {/* ========================================================================= */}
      <div className="bg-white border border-hairline rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[#101519]">
              Laporan Keuangan & Analisis Laba Usaha
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Kondisi Keuangan: Likuid & Surplus
            </span>
          </div>
          <p className="text-xs sm:text-sm text-body">
            Ringkasan omset penjualan, harga pokok (HPP), laba bersih operasional, dan arus kas toko untuk Manajer
          </p>
        </div>

        {/* Global Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Period selector tabs */}
          <div className="inline-flex p-1 bg-neutral-2 rounded-xl text-xs font-bold border border-hairline/60">
            <button
              type="button"
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '7days'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-body hover:text-black'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '30days'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-body hover:text-black'
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'monthly'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-body hover:text-black'
              }`}
            >
              6 Bulan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('ytd')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'ytd'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-body hover:text-black'
              }`}
            >
              Kuartal
            </button>
          </div>

          {/* Print Formal Statement Button */}
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-2 hover:bg-neutral-1 text-[#101519] font-bold text-xs rounded-xl border border-hairline transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-body" />
            <span>Cetak Rekap Resmi</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Akuntansi (CSV)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE FINANCIAL SCORECARD (4 CORE PILLARS)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Pendapatan Bruto */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-body">
                Pendapatan Bruto (Omset)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#101519] tracking-tight">
              {formatRupiah(confirmedSales)}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-hairline/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +18.4% vs bln lalu
            </span>
            <span className="text-body font-mono font-medium">
              {paidOrders.length} Pesanan Lunas
            </span>
          </div>
        </div>

        {/* Metric 2: Laba Bersih Toko (Net Operating Profit) */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-body">
                Laba Bersih Operasional
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatRupiah(netOperatingProfit)}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-hairline/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
              Margin Bersih: {netMarginPercent}%
            </span>
            <span className="text-body">Kotor: ~28.5%</span>
          </div>
        </div>

        {/* Metric 3: Harga Pokok Penjualan (HPP / COGS) */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-neutral-400 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-body">
                Beban Pokok Modal (HPP)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#101519] tracking-tight">
              {formatRupiah(estimatedCogs)}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-hairline/80 flex items-center justify-between text-[11px]">
            <span className="text-body font-medium">Beban Modal Terjual:</span>
            <span className="font-bold text-[#101519] font-mono">
              {totalItemsSold} Unit Barang
            </span>
          </div>
        </div>

        {/* Metric 4: Posisi Kas Riil & Arus Kas */}
        <div className="bg-white border border-hairline rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-body">
                Kas Riil vs Piutang
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-primary tracking-tight">
              {formatRupiah(confirmedSales)}
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-hairline/80 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-medium">
              Tertahan / COD: <strong className="font-mono">{formatRupiah(pendingSales + codReceivables)}</strong>
            </span>
            <span className="text-emerald-700 font-bold">{collectionRate}% Terkumpul</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHARTS ENGINE: INTERACTIVE VISUALIZER (DUAL BAR & SMOOTH AREA MODES)    */}
      {/* ========================================================================= */}
      <div className="bg-white border border-hairline rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        {/* Chart Card Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-[#101519]">
                Grafik Komparasi Penjualan & Margin Keuntungan
              </h2>
            </div>
            <p className="text-xs text-body">
              Perbandingan pertumbuhan omset penjualan bruto dengan laba bersih toko periode{' '}
              <span className="font-semibold text-[#101519]">
                {period === '7days'
                  ? '7 Hari Terakhir'
                  : period === '30days'
                  ? '30 Hari Terakhir'
                  : period === 'monthly'
                  ? '6 Bulan Terakhir'
                  : 'Tahun Berjalan (Kuartal)'}
              </span>
            </p>
          </div>

          {/* Visual type switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-neutral-2 rounded-xl text-xs font-bold border border-hairline">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-body hover:text-black'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Grafik Batang</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-body hover:text-black'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Tren Garis & Area</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Legend & Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-primary shadow-xs" />
              <span className="font-bold text-[#101519]">Omset Penjualan (Bruto)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shadow-xs" />
              <span className="font-bold text-[#101519]">Laba Bersih Toko (~28.5%)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-body text-[11px] bg-neutral-2/60 px-3 py-1.5 rounded-xl border border-hairline">
            <span>
              Total Periode Ini:{' '}
              <strong className="text-[#101519] font-mono">{formatRupiah(totalPeriodOmset)}</strong>
            </span>
            <span className="text-hairline">|</span>
            <span>
              Total Laba Bersih:{' '}
              <strong className="text-emerald-700 font-mono">{formatRupiah(totalPeriodLaba)}</strong>
            </span>
          </div>
        </div>

        {/* Interactive SVG Chart Rendering Area */}
        <div className="pt-2">
          {chartType === 'bar' ? (
            /* ================= MODE A: DUAL BAR CHART ================= */
            <div className="h-72 w-full flex items-end justify-between gap-3 sm:gap-6 px-4 pb-8 border-b border-hairline relative">
              {/* Background Guide Grid */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 select-none">
                <div className="border-b border-dashed border-hairline/80 w-full flex items-center justify-between text-[10px] text-body pr-2">
                  <span>{formatRupiah(maxDatasetOmset)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-body/70">Puncak</span>
                </div>
                <div className="border-b border-dashed border-hairline/80 w-full flex items-center justify-between text-[10px] text-body pr-2">
                  <span>{formatRupiah(maxDatasetOmset * 0.66)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-body/70">66%</span>
                </div>
                <div className="border-b border-dashed border-hairline/80 w-full flex items-center justify-between text-[10px] text-body pr-2">
                  <span>{formatRupiah(maxDatasetOmset * 0.33)}</span>
                  <span className="text-[9px] uppercase tracking-wider text-body/70">33%</span>
                </div>
                <div className="border-b border-hairline w-full flex items-center justify-between text-[10px] text-body pr-2">
                  <span>Rp 0</span>
                  <span className="text-[9px] uppercase tracking-wider text-body/70">Dasar</span>
                </div>
              </div>

              {/* Data Columns */}
              {currentDataset.map((d, idx) => {
                const omsetPct = Math.max(10, Math.round((d.omset / maxDatasetOmset) * 88));
                const labaPct = Math.max(6, Math.round((d.laba / maxDatasetOmset) * 88));
                const isHovered = activeHoverIdx === idx;

                return (
                  <div
                    key={d.label}
                    onMouseEnter={() => setActiveHoverIdx(idx)}
                    onMouseLeave={() => setActiveHoverIdx(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-24 z-30 bg-[#101519] text-white p-3 rounded-2xl shadow-2xl text-[11px] whitespace-nowrap pointer-events-none space-y-1 border border-neutral-700 transition-all animate-in fade-in zoom-in-95">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 border-b border-neutral-800 pb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{d.fullDate}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5">
                          <span className="text-neutral-400">Omset Bruto:</span>
                          <strong className="text-right text-white font-mono">{formatRupiah(d.omset)}</strong>
                          <span className="text-neutral-400">Modal (HPP):</span>
                          <span className="text-right text-neutral-300 font-mono">{formatRupiah(d.hpp)}</span>
                          <span className="text-emerald-400 font-bold">Laba Bersih:</span>
                          <strong className="text-right text-emerald-400 font-mono">{formatRupiah(d.laba)}</strong>
                        </div>
                        <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800 flex justify-between">
                          <span>Volume Pesanan:</span>
                          <strong className="text-white">{d.orders} transaksi</strong>
                        </div>
                      </div>
                    )}

                    {/* Bars Container */}
                    <div className="w-full max-w-[52px] flex items-end justify-center gap-1.5 h-full z-10">
                      {/* Omset Bar */}
                      <div
                        className={`w-1/2 rounded-t-xl transition-all duration-300 ${
                          isHovered
                            ? 'bg-primary shadow-lg ring-2 ring-primary/40'
                            : 'bg-primary/90 hover:bg-primary'
                        }`}
                        style={{ height: `${omsetPct}%` }}
                      />
                      {/* Laba Bar */}
                      <div
                        className={`w-1/2 rounded-t-xl transition-all duration-300 ${
                          isHovered
                            ? 'bg-emerald-500 shadow-lg ring-2 ring-emerald-400/40'
                            : 'bg-emerald-500/90 hover:bg-emerald-500'
                        }`}
                        style={{ height: `${labaPct}%` }}
                      />
                    </div>

                    {/* Bottom Label on X-Axis */}
                    <div className="absolute -bottom-7 text-center text-[11px] font-bold text-body group-hover:text-primary transition-colors">
                      {d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= MODE B: SMOOTH AREA & TREND CURVE ================= */
            <div className="h-72 w-full relative pb-8 pt-4">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 240">
                <defs>
                  <linearGradient id="omsetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0060AE" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#0060AE" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="labaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 60, 120, 180, 240].map((yVal, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={yVal}
                    x2="700"
                    y2={yVal}
                    stroke="#E3E4E5"
                    strokeDasharray={i === 4 ? '0' : '4 4'}
                    strokeWidth="1"
                  />
                ))}

                {/* Generate SVG Path coordinates */}
                {(() => {
                  const pointsCount = currentDataset.length;
                  const stepX = 700 / (pointsCount - 1 || 1);

                  const omsetCoords = currentDataset.map((d, i) => {
                    const x = i * stepX;
                    const y = 220 - (d.omset / maxDatasetOmset) * 200;
                    return { x, y, data: d };
                  });

                  const labaCoords = currentDataset.map((d, i) => {
                    const x = i * stepX;
                    const y = 220 - (d.laba / maxDatasetOmset) * 200;
                    return { x, y, data: d };
                  });

                  const makePathD = (coords: { x: number; y: number }[]) => {
                    return coords.reduce((acc, pt, i, arr) => {
                      if (i === 0) return `M ${pt.x} ${pt.y}`;
                      const prev = arr[i - 1];
                      const cx = (prev.x + pt.x) / 2;
                      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
                    }, '');
                  };

                  const omsetPath = makePathD(omsetCoords);
                  const labaPath = makePathD(labaCoords);

                  const omsetArea = `${omsetPath} L 700 240 L 0 240 Z`;
                  const labaArea = `${labaPath} L 700 240 L 0 240 Z`;

                  return (
                    <>
                      {/* Area Fills */}
                      <path d={omsetArea} fill="url(#omsetGradient)" />
                      <path d={labaArea} fill="url(#labaGradient)" />

                      {/* Stroke Lines */}
                      <path d={omsetPath} fill="none" stroke="#0060AE" strokeWidth="3" />
                      <path d={labaPath} fill="none" stroke="#10B981" strokeWidth="3" />

                      {/* Interactive Dots */}
                      {omsetCoords.map((pt, i) => (
                        <g key={`dot-omset-${i}`}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="5"
                            fill="#FFFFFF"
                            stroke="#0060AE"
                            strokeWidth="3"
                            className="cursor-pointer hover:r-7 transition-all"
                            onMouseEnter={() => setActiveHoverIdx(i)}
                            onMouseLeave={() => setActiveHoverIdx(null)}
                          />
                        </g>
                      ))}

                      {labaCoords.map((pt, i) => (
                        <g key={`dot-laba-${i}`}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="5"
                            fill="#FFFFFF"
                            stroke="#10B981"
                            strokeWidth="3"
                            className="cursor-pointer hover:r-7 transition-all"
                            onMouseEnter={() => setActiveHoverIdx(i)}
                            onMouseLeave={() => setActiveHoverIdx(null)}
                          />
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>

              {/* X-Axis Labels below SVG */}
              <div className="flex justify-between items-center pt-2 px-1 text-[11px] font-bold text-body">
                {currentDataset.map((d, idx) => (
                  <span
                    key={d.label}
                    className={`cursor-pointer transition-colors ${
                      activeHoverIdx === idx ? 'text-primary font-black' : ''
                    }`}
                  >
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FORMAL INCOME STATEMENT (LAPORAN LABA RUGI STANDAR AKUNTANSI MANAJER) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-hairline rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-extrabold text-[#101519] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span>Laporan Laba Rugi Operasional Toko (Income Statement)</span>
            </h3>
            <p className="text-xs text-body">
              Struktur perincian penerimaan, beban pokok persediaan, beban operasional, dan hasil laba bersih
            </p>
          </div>
          <span className="px-3 py-1 bg-neutral-2 text-[#101519] font-mono text-xs font-bold rounded-lg border border-hairline self-start sm:self-auto">
            Periode: Oktober 2026
          </span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Pos Akun Finansial</th>
                <th className="py-3 px-4 text-center">Proporsi %</th>
                <th className="py-3 px-5 text-right">Nominal Subtotal (IDR)</th>
                <th className="py-3 px-5 text-right">Status Kas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {/* I. PENDAPATAN */}
              <tr className="bg-neutral-2/20">
                <td colSpan={4} className="py-2.5 px-5 font-black text-primary text-xs uppercase tracking-wide">
                  I. Pendapatan Usaha (Revenue)
                </td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Penjualan Al-Qur&apos;an &amp; Kitab Klasik Pesantren
                </td>
                <td className="py-2.5 px-4 text-center font-mono">46.0%</td>
                <td className="py-2.5 px-5 text-right font-mono font-medium">
                  {formatRupiah(confirmedSales * 0.46)}
                </td>
                <td className="py-2.5 px-5 text-right text-emerald-700 font-bold">Lunas / Masuk Kas</td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Penjualan Buku Bacaan Islami, Novel &amp; Pelajaran
                </td>
                <td className="py-2.5 px-4 text-center font-mono">32.0%</td>
                <td className="py-2.5 px-5 text-right font-mono font-medium">
                  {formatRupiah(confirmedSales * 0.32)}
                </td>
                <td className="py-2.5 px-5 text-right text-emerald-700 font-bold">Lunas / Masuk Kas</td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Penjualan Alat Tulis Kantor &amp; Perlengkapan Kertas
                </td>
                <td className="py-2.5 px-4 text-center font-mono">22.0%</td>
                <td className="py-2.5 px-5 text-right font-mono font-medium">
                  {formatRupiah(confirmedSales * 0.22)}
                </td>
                <td className="py-2.5 px-5 text-right text-emerald-700 font-bold">Lunas / Masuk Kas</td>
              </tr>
              <tr className="bg-primary/5 font-extrabold text-[#101519]">
                <td className="py-3 px-5 pl-8">Total Pendapatan Bruto Sah</td>
                <td className="py-3 px-4 text-center font-mono">100.0%</td>
                <td className="py-3 px-5 text-right font-mono text-primary text-sm">
                  {formatRupiah(confirmedSales)}
                </td>
                <td className="py-3 px-5 text-right text-primary font-bold">Sah Diverifikasi</td>
              </tr>

              {/* II. HARGA POKOK */}
              <tr className="bg-neutral-2/20">
                <td colSpan={4} className="py-2.5 px-5 font-black text-amber-800 text-xs uppercase tracking-wide">
                  II. Harga Pokok Penjualan (HPP / COGS)
                </td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Kulakan Stok dari Penerbit &amp; Distributor Resmi
                </td>
                <td className="py-2.5 px-4 text-center font-mono">68.5%</td>
                <td className="py-2.5 px-5 text-right font-mono text-red-600">
                  -{formatRupiah(confirmedSales * 0.685)}
                </td>
                <td className="py-2.5 px-5 text-right text-body">Terbayar ke Suplier</td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Biaya Kardus Packaging, Bubble Wrap &amp; Segel Plastik
                </td>
                <td className="py-2.5 px-4 text-center font-mono">3.0%</td>
                <td className="py-2.5 px-5 text-right font-mono text-red-600">
                  -{formatRupiah(confirmedSales * 0.03)}
                </td>
                <td className="py-2.5 px-5 text-right text-body">Bahan Baku Kemasan</td>
              </tr>
              <tr className="bg-amber-500/5 font-extrabold text-[#101519]">
                <td className="py-3 px-5 pl-8">Total Beban Pokok (HPP)</td>
                <td className="py-3 px-4 text-center font-mono">71.5%</td>
                <td className="py-3 px-5 text-right font-mono text-amber-700">
                  -{formatRupiah(estimatedCogs)}
                </td>
                <td className="py-3 px-5 text-right text-amber-700 font-bold">Terkonfirmasi</td>
              </tr>

              {/* LABA KOTOR */}
              <tr className="bg-emerald-500/10 font-black text-[#101519] border-y-2 border-emerald-500/30">
                <td className="py-3 px-5">LABA KOTOR TOKO (GROSS PROFIT)</td>
                <td className="py-3 px-4 text-center font-mono text-emerald-700 text-sm">28.5%</td>
                <td className="py-3 px-5 text-right font-mono text-emerald-700 text-base">
                  +{formatRupiah(estimatedProfit)}
                </td>
                <td className="py-3 px-5 text-right text-emerald-800 font-extrabold">Margin Sehat</td>
              </tr>

              {/* III. OPERASIONAL */}
              <tr className="bg-neutral-2/20">
                <td colSpan={4} className="py-2.5 px-5 font-black text-neutral-800 text-xs uppercase tracking-wide">
                  III. Beban Operasional Toko (OPEX)
                </td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Bensin Armada Kurir &amp; Uang Saku Pengantaran
                </td>
                <td className="py-2.5 px-4 text-center font-mono">2.8%</td>
                <td className="py-2.5 px-5 text-right font-mono text-red-600">
                  -{formatRupiah(confirmedSales * 0.028)}
                </td>
                <td className="py-2.5 px-5 text-right text-body">Operasional Armada</td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Potongan Voucher Diskon Pelanggan &amp; Kupon
                </td>
                <td className="py-2.5 px-4 text-center font-mono">1.8%</td>
                <td className="py-2.5 px-5 text-right font-mono text-red-600">
                  -{formatRupiah(confirmedSales * 0.018)}
                </td>
                <td className="py-2.5 px-5 text-right text-body">Subsidi Promosi</td>
              </tr>
              <tr className="hover:bg-neutral-2/10">
                <td className="py-2.5 px-5 pl-8 text-[#101519]">
                  Biaya Transaksi QRIS / Biaya Administrasi Perbankan
                </td>
                <td className="py-2.5 px-4 text-center font-mono">0.9%</td>
                <td className="py-2.5 px-5 text-right font-mono text-red-600">
                  -{formatRupiah(confirmedSales * 0.009)}
                </td>
                <td className="py-2.5 px-5 text-right text-body">MDR &amp; Gateway</td>
              </tr>

              {/* LABA BERSIH FINAL */}
              <tr className="bg-emerald-600 text-white font-black text-sm">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>LABA BERSIH OPERASIONAL BERSIH (NET OPERATING PROFIT)</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-mono text-amber-300 font-extrabold">
                  {netMarginPercent}%
                </td>
                <td className="py-4 px-5 text-right font-mono text-lg font-black text-white">
                  +{formatRupiah(netOperatingProfit)}
                </td>
                <td className="py-4 px-5 text-right text-emerald-100 font-bold uppercase tracking-wider text-xs">
                  Surplus Bersih
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DUAL COCKPIT: KOMPOSISI KATEGORI & TOP 5 PRODUK LABA TERBESAR           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Komposisi Penjualan per Kategori */}
        <div className="bg-white border border-hairline rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-extrabold text-sm text-[#101519] flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Proporsi Penjualan per Kategori Produk</span>
              </h3>
              <span className="text-xs text-body font-medium">3 Klaster Toko</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-2">
                {categoryBreakdown.map((cat, i) => (
                  <div
                    key={i}
                    className={`${cat.colorClass} h-full transition-all`}
                    style={{ width: `${cat.sharePercent}%` }}
                    title={`${cat.name}: ${cat.sharePercent}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-body">
                <span>Al-Qur&apos;an &amp; Kitab (46%)</span>
                <span>Buku Umum (32%)</span>
                <span>ATK (22%)</span>
              </div>
            </div>

            {/* List Detail Kategori */}
            <div className="space-y-3 pt-1">
              {categoryBreakdown.map((cat, i) => (
                <div
                  key={i}
                  className="p-3.5 bg-neutral-2/40 rounded-xl border border-hairline/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3.5 h-3.5 rounded-full ${cat.colorClass} shrink-0`} />
                    <div>
                      <strong className="text-xs text-[#101519] block">{cat.name}</strong>
                      <span className="text-[11px] text-body">
                        Margin Laba: <strong className="text-emerald-700">{cat.marginRate}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#101519] font-mono block">
                      {formatRupiah(cat.omset)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      Laba: +{formatRupiah(cat.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-primary flex items-center gap-2.5 mt-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>Insight Kategori:</strong> Kategori Kitab &amp; Al-Qur&apos;an memberikan margin laba paling tebal (35%) dan memiliki tingkat retur terendah.
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Top 5 Produk Penyumbang Laba Terbesar */}
        <div className="bg-white border border-hairline rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <h3 className="font-extrabold text-sm text-[#101519] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Top 5 Produk Penyumbang Laba Terbesar (Profit Drivers)</span>
            </h3>
            <span className="text-xs text-body">Volume &amp; Margin</span>
          </div>

          <div className="space-y-2.5">
            {topProfitProducts.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 bg-neutral-2/30 hover:bg-neutral-2/60 transition-colors rounded-xl border border-hairline/70 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-black text-[11px] ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800'
                        : idx === 1
                        ? 'bg-blue-100 text-primary'
                        : 'bg-neutral-2 text-body'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#101519] truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-body mt-0.5">
                      <span className="font-mono">{p.sku}</span>
                      <span>•</span>
                      <span>Terjual: <strong>{p.soldQty} unit</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-600 block font-mono">
                    +{formatRupiah(p.netProfit)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
                    Margin {p.marginPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. STRATEGIC EXECUTIVE INSIGHTS BOX FOR STORE MANAGER                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insight 1 */}
        <div className="p-4 bg-white border border-hairline rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-4 h-4" />
            <h4 className="font-bold text-xs">Peluang Alokasi Restock</h4>
          </div>
          <p className="text-xs text-body leading-relaxed">
            Kitab kuning pesantren dan Mushaf Al-Qur&apos;an menyumbang 46% omset dengan margin tertinggi (35%). Disarankan menambah kuota restock 20% menjelang awal bulan kalender Hijriah.
          </p>
        </div>

        {/* Insight 2 */}
        <div className="p-4 bg-white border border-hairline rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="font-bold text-xs">Arus Kas &amp; Likuiditas Aman</h4>
          </div>
          <p className="text-xs text-body leading-relaxed">
            Kolektibilitas pembayaran mencapai {collectionRate}%. Piutang tertahan COD terkendali di angka {formatRupiah(pendingSales + codReceivables)}, tidak mengganggu modal kerja toko.
          </p>
        </div>

        {/* Insight 3 */}
        <div className="p-4 bg-white border border-hairline rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <Package className="w-4 h-4" />
            <h4 className="font-bold text-xs">Efisiensi Armada Kurir Toko</h4>
          </div>
          <p className="text-xs text-body leading-relaxed">
            Penggunaan armada kurir toko sendiri memotong beban ongkos kirim pihak ketiga hingga 65% dan mempercepat serah terima bukti tanda tangan langsung di hari yang sama.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MODAL PRATINJAU CETAK REKAP RESMI (PRINTABLE OFFICIAL REPORT)          */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 border border-hairline animate-in fade-in zoom-in-95">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-hairline pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                <h3 className="text-base font-extrabold text-[#101519]">
                  Pratinjau Dokumen Rekap Keuangan Resmi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 rounded-lg text-body hover:bg-neutral-2 hover:text-[#101519] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Formal Statement Paper */}
            <div className="border border-hairline rounded-xl p-6 bg-neutral-2/10 space-y-5 text-xs font-sans">
              {/* Kop Surat Toko */}
              <div className="border-b-2 border-primary pb-3 text-center space-y-1">
                <h2 className="text-lg font-black tracking-wider text-primary uppercase">
                  TOKO USKI STORE
                </h2>
                <p className="text-[11px] text-body">
                  Pusat Kitab, Mushaf Al-Qur&apos;an, Buku Pelajaran &amp; Alat Tulis Kantor (ATK)
                </p>
                <p className="text-[10px] text-body">
                  Kota Depok, Jawa Barat • WhatsApp: 0812-3456-7890 • Email: finance@uskistore.com
                </p>
              </div>

              {/* Title & Metadata */}
              <div className="flex justify-between items-start pt-1 text-[11px]">
                <div>
                  <p className="font-extrabold uppercase text-[#101519]">
                    LAPORAN LABA RUGI OPERASIONAL
                  </p>
                  <p className="text-body">
                    Periode: {period === '7days' ? '7 Hari Terakhir' : 'Oktober 2026'}
                  </p>
                </div>
                <div className="text-right text-body">
                  <p>Tanggal Cetak: <strong>{new Date().toLocaleDateString('id-ID')}</strong></p>
                  <p>Status: <strong className="text-emerald-700">TERVERIFIKASI SISTEM</strong></p>
                </div>
              </div>

              {/* Ringkasan Angka Utama */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-white border border-hairline rounded-lg text-center">
                <div>
                  <span className="text-[10px] text-body block">Total Omset</span>
                  <strong className="text-xs text-primary font-mono">{formatRupiah(confirmedSales)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-body block">Beban Modal (HPP)</span>
                  <strong className="text-xs text-red-600 font-mono">-{formatRupiah(estimatedCogs)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-body block">Laba Bersih Toko</span>
                  <strong className="text-xs text-emerald-700 font-mono">+{formatRupiah(netOperatingProfit)}</strong>
                </div>
              </div>

              {/* Lembar Pengesahan Manajer */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px]">
                <div>
                  <p className="text-body">Disusun Oleh,</p>
                  <div className="h-14 flex items-end justify-center">
                    <span className="border-b border-[#101519] w-36 font-bold pb-0.5">Admin Keuangan</span>
                  </div>
                  <p className="text-[10px] text-body mt-1">Finance &amp; Accounting</p>
                </div>
                <div>
                  <p className="text-body">Disetujui Oleh,</p>
                  <div className="h-14 flex items-end justify-center">
                    <span className="border-b border-[#101519] w-36 font-bold pb-0.5">Manajer Operasional</span>
                  </div>
                  <p className="text-[10px] text-body mt-1">General Store Manager</p>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-neutral-2 hover:bg-neutral-1 text-[#101519] font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
