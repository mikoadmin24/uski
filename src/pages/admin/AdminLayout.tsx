import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store/authStore';
import { ShieldAlert, Bell, Eye } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Basic authorization guard check
  const isAuthorized = user && (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-2 flex items-center justify-center p-4">
        <div className="bg-white border border-hairline rounded-3xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-badge-text mx-auto" />
          <h2 className="text-xl font-extrabold text-[#101519]">Akses Terbatas</h2>
          <p className="text-xs text-body leading-relaxed">
            Halaman ini hanya dapat diakses oleh Administrator atau Staf Toko yang berwenang sesuai kebijakan Supabase RLS.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                useAuthStore.getState().loginAs('super_admin');
              }}
              className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl mr-2"
            >
              Aktifkan Akses Demo Admin
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 bg-neutral-2 text-body font-bold text-xs rounded-xl"
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
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Backoffice Header */}
        <header className="h-16 bg-white border-b border-hairline px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-[#101519]">
              Panel Manajemen & Operasional USKI STORE
            </h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
              Sistem Aktif
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-2 hover:bg-neutral-1/40 rounded-lg text-xs font-bold text-[#2D3033] transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Lihat Toko Publik</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
