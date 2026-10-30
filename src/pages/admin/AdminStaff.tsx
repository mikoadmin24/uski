import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  X,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole, Profile } from '@/types';
import { formatDate } from '@/lib/utils';

export const AdminStaff: React.FC = () => {
  const { user, staffList, addStaff, updateStaffRole, deleteStaff } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    addStaff({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phone.trim() || undefined,
      role,
    });

    setShowModal(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('staff');
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          desc: 'Akses penuh seluruh sistem, pengaturan, laporan laba, & staf',
        };
      case 'manager':
        return {
          label: 'Manajer Operasional Toko',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          desc: 'Analisis omset & laba rugi, persetujuan RFQ kustom, & monitoring toko',
        };
      case 'admin':
        return {
          label: 'Kasir & Layanan CS',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          desc: 'Verifikasi bayar, proses pesanan, & tangani RFQ pelanggan',
        };
      case 'staff':
        return {
          label: 'Staf Gudang & Logistik',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          desc: 'Kelola inventaris, barcode, packing & cetak resi pengiriman',
        };
      case 'courier':
        return {
          label: 'Kurir Toko USKI',
          bg: 'bg-green-100 text-green-800 border-green-200',
          desc: 'Antar barang kurir internal & update status sampai',
        };
      default:
        return {
          label: 'Pelanggan',
          bg: 'bg-neutral-2 text-body',
          desc: 'Akses belanja publik',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#101519]">
            Akun Staf & Hak Akses Toko
          </h1>
          <p className="text-xs text-body mt-1">
            Atur staf operasional, penanggung jawab inventaris, kasir layanan pelanggan, dan kurir toko
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Staf</span>
        </button>
      </div>

      {/* Permissions Matrix Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(['super_admin', 'admin', 'staff', 'courier'] as UserRole[]).map((r) => {
          const badge = getRoleBadge(r);
          return (
            <div
              key={r}
              className="bg-white border border-hairline rounded-2xl p-4 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${badge.bg}`}>
                  {badge.label}
                </span>
                <Shield className="w-4 h-4 text-body" />
              </div>
              <p className="text-[11px] text-body leading-relaxed">{badge.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-hairline rounded-3xl overflow-hidden shadow-sm">
        <div className="md:hidden px-4 py-2 bg-neutral-2/50 border-b border-hairline text-[10px] text-body flex items-center justify-between font-semibold">
          <span>👈 Geser tabel ke kanan untuk melihat rincian staf 👉</span>
        </div>
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left min-w-[650px]">
            <thead className="bg-neutral-2/60 border-b border-hairline text-body font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Lengkap & Kontak</th>
                <th className="py-3 px-4">Peran (Role Hak Akses)</th>
                <th className="py-3 px-4">Terdaftar Sejak</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ubah Role</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {staffList.map((st) => {
                const badge = getRoleBadge(st.role);
                const isCurrent = user?.id === st.id;

                return (
                  <tr key={st.id} className="hover:bg-neutral-2/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                          {st.full_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-[#101519] flex items-center gap-2">
                            <span>{st.full_name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 text-[9px] bg-neutral-2 text-primary rounded font-bold">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-body">{st.email}</p>
                          {st.phone_number && (
                            <p className="text-[10px] text-body">{st.phone_number}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-body font-mono text-[11px]">
                      {formatDate(st.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded text-[10px]">
                        Aktif
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={st.role}
                        onChange={(e) => updateStaffRole(st.id, e.target.value as UserRole)}
                        disabled={st.role === 'super_admin' && staffList.filter((s) => s.role === 'super_admin').length <= 1}
                        className="h-8 px-2 bg-neutral-2 border border-hairline rounded-lg text-xs font-semibold focus:outline-none focus:border-primary"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="manager">Manajer Toko</option>
                        <option value="admin">Kasir / CS</option>
                        <option value="staff">Staf Gudang</option>
                        <option value="courier">Kurir Toko</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        title="Hapus Akun Staf"
                        onClick={() => {
                          if (st.role === 'super_admin') {
                            alert('Super Admin utama tidak dapat dihapus.');
                            return;
                          }
                          if (confirm(`Hapus akun staf "${st.full_name}"?`)) {
                            deleteStaff(st.id);
                          }
                        }}
                        disabled={st.role === 'super_admin'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          st.role === 'super_admin'
                            ? 'text-neutral-1 cursor-not-allowed'
                            : 'hover:text-badge-text text-body hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-base font-extrabold text-[#101519]">Tambah Akun Staf Baru</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Nama Lengkap Staf *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Ilham"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Alamat Email Toko *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staf@uskistore.id"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Nomor WhatsApp Staf</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Hak Akses (Role) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                >
                  <option value="staff">Staf Gudang & Logistik</option>
                  <option value="admin">Kasir & Layanan CS</option>
                  <option value="manager">Manajer Operasional Toko</option>
                  <option value="courier">Kurir Toko USKI</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="pt-3 border-t border-hairline flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
