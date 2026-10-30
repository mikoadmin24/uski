import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, Bell, Eye, Menu, UserCheck } from 'lucide-react';
import { UserRole } from '@/types';

export const AdminLayout: React.FC = () => {
  const { user, loginAs } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Authorization check
  const isAuthorized =
    user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff');

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
            <button
              onClick={() => {
                useAuthStore.getState().loginAs('super_admin');
              }}
              className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm hover:bg-primary-dark transition-all"
            >
              Aktifkan Akses Demo Admin
            </button>
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
    <div className="flex min-h-screen bg-[#F9FBFD] font-urbanist text-[#101519]">
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Backoffice Header */}
        <header className="h-16 bg-white border-b border-hairline px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-hairline hover:bg-neutral-2 text-[#101519] transition-colors"
              title="Buka Menu Admin"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#101519] truncate">
                  Panel Operasional USKI STORE
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                  Sistem Aktif
                </span>
              </div>
              <p className="text-[11px] text-body hidden md:block">
                Toko Buku, ATK, Kitab & Perlengkapan Umum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Demo Switcher */}
            <div className="hidden sm:flex items-center gap-1.5 bg-neutral-2 px-2.5 py-1 rounded-xl border border-hairline text-[11px]">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-body font-bold">Role:</span>
              <select
                value={user?.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  loginAs(newRole);
                  if (newRole === 'courier') {
                    navigate('/courier');
                  }
                }}
                className="bg-transparent font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin / CS</option>
                <option value="staff">Staf Gudang</option>
                <option value="courier">Kurir Toko (Auto GPS)</option>
              </select>
            </div>

            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-2 hover:bg-neutral-1/40 rounded-xl text-xs font-bold text-[#2D3033] transition-colors border border-hairline"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Lihat Toko Publik</span>
              <span className="sm:hidden">Toko</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
