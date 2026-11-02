import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  X,
  Key,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserRole, Profile } from '@/types';
import { formatDate } from '@/lib/utils';

export const AdminStaff: React.FC = () => {
  const { user, staffList, addStaff, updateStaffRole, deleteStaff, updateStaffPassword } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [initialPassword, setInitialPassword] = useState('password123');

  // Staff password popup modal state
  const [selectedStaffForPassword, setSelectedStaffForPassword] = useState<Profile | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Profile | null>(null);
  const [staffNewPassword, setStaffNewPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');
  const [staffShowPassword, setStaffShowPassword] = useState(false);
  const [staffPasswordError, setStaffPasswordError] = useState<string | null>(null);
  const [staffPasswordSuccess, setStaffPasswordSuccess] = useState<string | null>(null);
  const [staffPasswordLoading, setStaffPasswordLoading] = useState(false);

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
    setInitialPassword('password123');
  };

  const handleUpdateStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPassword) return;

    setStaffPasswordError(null);
    setStaffPasswordSuccess(null);

    if (staffNewPassword.length < 6) {
      setStaffPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (staffNewPassword !== staffConfirmPassword) {
      setStaffPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setStaffPasswordLoading(true);
    try {
      const res = await updateStaffPassword(selectedStaffForPassword.id, staffNewPassword);
      if (res.success) {
        setStaffPasswordSuccess(`Kata sandi akun "${selectedStaffForPassword.full_name}" berhasil diperbarui!`);
        setStaffNewPassword('');
        setStaffConfirmPassword('');
        setTimeout(() => {
          setSelectedStaffForPassword(null);
          setStaffPasswordSuccess(null);
        }, 1800);
      } else {
        setStaffPasswordError(res.error || 'Gagal memperbarui kata sandi staf.');
      }
    } catch (err: any) {
      setStaffPasswordError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setStaffPasswordLoading(false);
    }
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
          <span>Geser tabel ke samping untuk melihat rincian staf</span>
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Ubah Kata Sandi Staf"
                          onClick={() => {
                            setSelectedStaffForPassword(st);
                            setStaffNewPassword('');
                            setStaffConfirmPassword('');
                            setStaffPasswordError(null);
                            setStaffPasswordSuccess(null);
                          }}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Hapus Akun Staf"
                          onClick={() => {
                            if (st.role === 'super_admin') {
                              alert('Super Admin utama tidak dapat dihapus.');
                              return;
                            }
                            setStaffToDelete(st);
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
                      </div>
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

              <div>
                <label className="font-bold text-body block mb-1">Kata Sandi Awal Akun *</label>
                <input
                  type="text"
                  required
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Minimal 6 karakter (default: password123)"
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary"
                />
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

      {/* Staff Password Popup Modal */}
      {selectedStaffForPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-hairline animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">Ubah Kata Sandi Staf</h3>
                  <p className="text-[11px] text-body">{selectedStaffForPassword.full_name} ({selectedStaffForPassword.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaffForPassword(null)}
                className="p-1 rounded-lg text-body hover:text-[#101519] hover:bg-neutral-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffPasswordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{staffPasswordError}</span>
              </div>
            )}

            {staffPasswordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{staffPasswordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStaffPassword} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-body block mb-1">Kata Sandi Baru *</label>
                <div className="relative">
                  <input
                    type={staffShowPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={staffNewPassword}
                    onChange={(e) => setStaffNewPassword(e.target.value)}
                    className="w-full h-11 pl-3.5 pr-10 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setStaffShowPassword(!staffShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-primary"
                    tabIndex={-1}
                  >
                    {staffShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Konfirmasi Kata Sandi Baru *</label>
                <input
                  type={staffShowPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi kata sandi baru"
                  value={staffConfirmPassword}
                  onChange={(e) => setStaffConfirmPassword(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForPassword(null)}
                  className="px-4 py-2.5 bg-neutral-2 hover:bg-neutral-1/40 text-body font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={staffPasswordLoading}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>{staffPasswordLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi Staf'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE STAFF CONFIRMATION POPUP MODAL                                     */}
      {/* ========================================================================= */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-hairline space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-[#101519]">Hapus Akun Staf / Admin?</h3>
              <p className="text-xs text-body leading-relaxed">
                Anda yakin ingin menghapus hak akses untuk <strong className="text-[#101519]">{staffToDelete.full_name}</strong> ({staffToDelete.email})? Akun ini tidak akan bisa login lagi ke panel admin.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-hairline text-xs font-bold text-body hover:bg-neutral-2 transition-colors touch-manipulation"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStaff(staffToDelete.id);
                  setStaffToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs touch-manipulation flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
