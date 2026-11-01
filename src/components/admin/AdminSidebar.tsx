import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  FileSpreadsheet,
  Tag,
  BarChart3,
  Users,
  Settings,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useCustomOrderStore } from '@/store/customOrderStore';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { requests } = useCustomOrderStore();

  const userRole = user?.role || 'staff';
  const isSuperAdmin = userRole === 'super_admin';
  const isAdminOrManager = userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager';
  const isStaff = userRole === 'staff';

  // Dynamic real-time badge counters
  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'awaiting_payment' || o.status === 'processing'
  ).length;
  const pendingRfqCount = requests.filter(
    (r) => r.status === 'pending_review' || r.status === 'checking_supplier'
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.min_stock_alert
  ).length;

  // Role-filtered structured navigation sections
  const navSections: NavSection[] = [
    {
      title: isStaff ? 'OPERASIONAL GUDANG' : 'OPERASIONAL TOKO',
      items: [
        {
          label: isStaff ? 'Dashboard Tugas Staf' : 'Ringkasan Dashboard',
          path: '/admin',
          icon: LayoutDashboard,
        },
        {
          label: isStaff ? 'Pesanan & Packing' : 'Manajemen Pesanan',
          path: '/admin/orders',
          icon: ShoppingBag,
          badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined,
          badgeColor: 'bg-amber-500 text-[#101519]',
        },
        {
          label: isStaff ? 'Stok & Barcode Scanner' : 'Katalog & Inventaris Stok',
          path: '/admin/products',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} Kritis` : undefined,
          badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
        },
      ],
    },
    ...(isAdminOrManager
      ? [
          {
            title: 'PENGADAAN & GROSIR',
            items: [
              {
                label: 'Permintaan Custom & RFQ',
                path: '/admin/bulk-orders',
                icon: FileSpreadsheet,
                badge: pendingRfqCount > 0 ? String(pendingRfqCount) : undefined,
                badgeColor: 'bg-blue-400 text-[#101519]',
              },
            ],
          },
          {
            title: 'KEUANGAN & LAPORAN',
            items: [
              {
                label: 'Laporan Penjualan & Laba',
                path: '/admin/reports',
                icon: BarChart3,
              },
            ],
          },
          {
            title: 'KATALOG & PROMOSI',
            items: [
              {
                label: 'Kategori & Banner Hero',
                path: '/admin/categories',
                icon: Layers,
              },
              {
                label: 'Voucher & Promo Diskon',
                path: '/admin/promos',
                icon: Tag,
              },
            ],
          },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            title: 'PENGATURAN TOKO',
            items: [
              {
                label: 'Akun Staf & Hak Akses',
                path: '/admin/staff',
                icon: Users,
              },
              {
                label: 'Pengaturan Toko & Bank',
                path: '/admin/settings',
                icon: Settings,
              },
            ],
          },
        ]
      : []),
  ];

  // Helper for role badge display
  const getRoleBadgeInfo = () => {
    switch (userRole) {
      case 'super_admin':
        return { label: 'SUPER ADMIN', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'manager':
        return { label: 'MANAJER TOKO', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'admin':
        return { label: 'KASIR / LAYANAN CS', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'staff':
        return { label: 'STAF GUDANG & INVENTARIS', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default:
        return { label: userRole.toUpperCase(), badgeClass: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40' };
    }
  };

  const roleInfo = getRoleBadgeInfo();

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
        className={`fixed lg:sticky top-0 h-screen w-72 max-w-[85vw] bg-[#2D3033] text-white flex flex-col shrink-0 z-50 lg:z-20 overflow-hidden transition-transform duration-300 ease-in-out pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <img
              src="/logo.jpg"
              alt="USKI BACKOFFICE Logo"
              className="w-9 h-9 object-contain shrink-0"
            />
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

        {/* Admin / Staff User Info with Distinct Role Badge */}
        <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-3 text-xs">
          <div className="w-9 h-9 rounded-full bg-primary/20 text-accent-2 border border-primary/30 flex items-center justify-center font-bold shrink-0">
            {user?.full_name ? user.full_name[0] : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white truncate">{user?.full_name}</p>
            <span
              className={`inline-block px-1.5 py-0.5 mt-0.5 text-[9px] font-extrabold rounded tracking-wider border ${roleInfo.badgeClass}`}
            >
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Categorized Nav Menu */}
        <nav className="p-3 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-scroll">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold tracking-wider text-neutral-1/60 uppercase">
                {sec.title}
              </div>

              {sec.items.map((item) => {
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
            </div>
          ))}
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
