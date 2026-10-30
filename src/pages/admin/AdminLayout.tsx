import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, Bell, Eye, Menu, UserCheck } from 'lucide-react';
import { UserRole } from '@/types';

export const AdminLayout: React.FC = () => {
  const { user, loginAs } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  // Auto-scroll admin content back to top when switching menu
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  // Authorization check
  const isAuthorized =
    user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'manager' || user.role === 'staff');

  // Role-based route authorization
  const currentPath = location.pathname;
  const isStaffRestricted =
    user?.role === 'staff' &&
    (currentPath.startsWith('/admin/reports') ||
      currentPath.startsWith('/admin/settings') ||
      currentPath.startsWith('/admin/staff') ||
      currentPath.startsWith('/admin/payments') ||
      currentPath.startsWith('/admin/promos') ||
      currentPath.startsWith('/admin/categories'));

  const isManagerRestricted =
    user?.role === 'manager' &&
    (currentPath.startsWith('/admin/settings') || currentPath.startsWith('/admin/staff'));

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-2 flex items-center justify-center p-4">
        <div className="bg-white border border-hairline rounded-3xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-badge-text mx-auto" />
          <h2 className="text-xl font-extrabold text-[#101519]">Akses Terbatas</h2>
          <p className="text-xs text-body leading-relaxed">
            Halaman ini hanya dapat diakses oleh Administrator atau Staf Toko yang berwenang sesuai
            kebijakan Supabase RLS.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Link
              to="/account"
              className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm hover:bg-primary-dark transition-all"
            >
              Masuk Akun Admin
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl hover:bg-neutral-1/30 transition-all"
            >
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F9FBFD] font-urbanist text-[#101519]">
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Backoffice Header - Sticky on Top */}
        <header className="sticky top-0 z-30 h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-hairline px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-hairline hover:bg-neutral-2 text-[#101519] transition-colors shrink-0"
              title="Buka Menu Admin"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#101519] truncate">
                  Panel Operasional USKI STORE
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded shrink-0">
                  Sistem Aktif
                </span>
              </div>
              <p className="text-[11px] text-body hidden md:block truncate">
                Toko Buku, ATK, Kitab & Perlengkapan Umum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Authenticated Staff Profile Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-neutral-2/80 px-3 py-1.5 rounded-xl border border-hairline text-xs">
              <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {user?.full_name ? user.full_name[0] : 'A'}
              </div>
              <div className="flex flex-col text-left leading-none min-w-0">
                <span className="font-extrabold text-[#101519] text-[11px] truncate max-w-[130px]">
                  {user?.full_name || 'Administrator'}
                </span>
                <span className="text-[9px] font-bold text-primary uppercase mt-0.5">
                  {user?.role === 'super_admin'
                    ? 'Super Admin'
                    : user?.role === 'manager'
                    ? 'Manajer Toko'
                    : user?.role === 'admin'
                    ? 'Kasir / Layanan CS'
                    : 'Staf Gudang & Logistik'}
                </span>
              </div>
            </div>

            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-2 hover:bg-neutral-1/40 rounded-xl text-xs font-bold text-[#2D3033] transition-colors border border-hairline shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Lihat Toko Publik</span>
              <span className="sm:hidden">Toko</span>
            </Link>
          </div>
        </header>

        {/* Content Body with 100% Fluid Natural Scroll & Route Guard */}
        <main
          ref={mainScrollRef}
          className="flex-1 p-4 sm:p-6 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
        >
          {isStaffRestricted ? (
            <div className="bg-white border border-hairline rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 my-8 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-lg font-extrabold text-[#101519]">Akses Khusus Manajer & Admin</h2>
              <p className="text-xs text-body leading-relaxed">
                Halaman ini memuat data finansial & pengaturan manajerial yang hanya dapat dikelola oleh Manajer atau Super Admin Toko.
              </p>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all"
              >
                <span>Kembali ke Dashboard Tugas Staf</span>
              </Link>
            </div>
          ) : isManagerRestricted ? (
            <div className="bg-white border border-hairline rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 my-8 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-purple-600 mx-auto" />
              <h2 className="text-lg font-extrabold text-[#101519]">Akses Khusus Super Admin</h2>
              <p className="text-xs text-body leading-relaxed">
                Pengaturan sistem master, rekening bank toko, dan hak akses akun staf hanya dapat diubah oleh Super Admin.
              </p>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all"
              >
                <span>Kembali ke Dashboard Manajer</span>
              </Link>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
