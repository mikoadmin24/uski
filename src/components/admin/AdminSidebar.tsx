import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Barcode,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
  Tag,
  BarChart3,
  Users,
  Settings,
  ArrowLeft,
  X,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useCustomOrderStore } from '@/store/customOrderStore';
import { useCourierStore } from '@/store/courierStore';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { requests } = useCustomOrderStore();
  const { couriers } = useCourierStore();

  // Dynamic real-time badge counters
  const activeCouriersCount = couriers.filter((c) => c.status === 'delivering').length;
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'awaiting_payment' || o.status === 'processing'
  ).length;
  const awaitingVerificationCount = orders.filter(
    (o) => o.status === 'awaiting_verification'
  ).length;
  const pendingRfqCount = requests.filter(
    (r) => r.status === 'pending_review' || r.status === 'checking_supplier'
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.min_stock_alert
  ).length;

  const navLinks = [
    { label: 'Ringkasan Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Katalog Produk & Varian', path: '/admin/products', icon: Package },
    { label: 'Kategori & Banner Hero', path: '/admin/categories', icon: Layers },
    {
      label: 'Inventaris & Barcode',
      path: '/admin/inventory',
      icon: Barcode,
      badge: lowStockCount > 0 ? `${lowStockCount} Peringatan` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
    },
    {
      label: 'Manajemen Pesanan',
      path: '/admin/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
      badgeColor: 'bg-amber-500 text-[#101519]',
    },
    {
      label: 'Armada Kurir & GPS',
      path: '/admin/couriers',
      icon: Navigation,
      badge: activeCouriersCount > 0 ? `${activeCouriersCount} Live GPS` : undefined,
      badgeColor: 'bg-green-400 text-black',
    },
    {
      label: 'Verifikasi Pembayaran',
      path: '/admin/payments',
      icon: CreditCard,
      badge: awaitingVerificationCount > 0 ? String(awaitingVerificationCount) : undefined,
      badgeColor: 'bg-accent-2 text-[#101519]',
    },
    {
      label: 'Permintaan Custom & RFQ',
      path: '/admin/bulk-orders',
      icon: FileSpreadsheet,
      badge: pendingRfqCount > 0 ? String(pendingRfqCount) : undefined,
      badgeColor: 'bg-blue-400 text-[#101519]',
    },
    { label: 'Voucher & Promo Diskon', path: '/admin/promos', icon: Tag },
    { label: 'Laporan Penjualan & Laba', path: '/admin/reports', icon: BarChart3 },
    { label: 'Akun Staf & Hak Akses', path: '/admin/staff', icon: Users },
    { label: 'Pengaturan Toko', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#2D3033] text-white flex flex-col shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-base shadow-sm">
              U
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white block">
                USKI BACKOFFICE
              </span>
              <span className="text-[10px] text-neutral-1 uppercase font-semibold">
                Toko & Inventaris
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-neutral-1 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin User Info */}
        <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-3 text-xs">
          <div className="w-9 h-9 rounded-full bg-primary/20 text-accent-2 border border-primary/30 flex items-center justify-center font-bold">
            {user?.full_name ? user.full_name[0] : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white truncate">{user?.full_name}</p>
            <span className="text-[10px] font-mono text-accent-2 uppercase block">
              Role: {user?.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-neutral-1 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Return to Storefront */}
        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Toko</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
