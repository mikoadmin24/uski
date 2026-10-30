import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Barcode,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ShieldAlert,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const navLinks = [
    { label: 'Ringkasan Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Katalog Produk & Varian', path: '/admin/products', icon: Package },
    { label: 'Inventaris & Barcode', path: '/admin/inventory', icon: Barcode },
    { label: 'Manajemen Pesanan', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Verifikasi Pembayaran', path: '/admin/payments', icon: CreditCard },
    { label: 'Permintaan Custom & RFQ', path: '/admin/bulk-orders', icon: FileSpreadsheet },
    { label: 'Laporan Penjualan & Laba', path: '/admin/reports', icon: BarChart3 },
    { label: 'Pengaturan Toko', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#2D3033] text-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-base">
            U
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wide text-white block">USKI BACKOFFICE</span>
            <span className="text-[10px] text-neutral-1 uppercase font-semibold">Toko & Inventaris</span>
          </div>
        </Link>
      </div>

      {/* Admin User Info */}
      <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-3 text-xs">
        <div className="w-9 h-9 rounded-full bg-primary/20 text-accent-2 flex items-center justify-center font-bold">
          {user?.full_name ? user.full_name[0] : 'A'}
        </div>
        <div className="min-w-0">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-neutral-1 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
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
  );
};
