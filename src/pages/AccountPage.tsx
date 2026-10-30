import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { formatRupiah, formatDate } from '@/lib/utils';

export const AccountPage: React.FC = () => {
  const { user, addresses, addAddress, deleteAddress, setPrimaryAddress } = useAuthStore();
  const { orders } = useOrderStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // New address form state
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !phoneNumber || !streetAddress || !city) return;

    addAddress({
      recipient_name: recipientName,
      phone_number: phoneNumber,
      street_address: streetAddress,
      district,
      city,
      province,
      postal_code: postalCode,
      is_primary: addresses.length === 0,
    });

    setShowAddAddress(false);
    setRecipientName('');
    setPhoneNumber('');
    setStreetAddress('');
    setDistrict('');
    setCity('');
    setProvince('');
    setPostalCode('');
  };

  return (
    <div className="max-w-site mx-auto px-4 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="bg-white border border-hairline rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-extrabold text-2xl">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#101519]">{user?.full_name}</h1>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-body mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Direct Admin Access Button if Admin */}
        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'staff') && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-all shadow-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Buka Panel Admin Toko</span>
          </Link>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar (3 cols) */}
        <aside className="lg:col-span-3">
          <div className="bg-white border border-hairline rounded-2xl p-2 space-y-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'orders' ? 'bg-primary text-white' : 'text-[#2D3033] hover:bg-neutral-2'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Riwayat Pesanan ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'addresses' ? 'bg-primary text-white' : 'text-[#2D3033] hover:bg-neutral-2'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Daftar Alamat ({addresses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'profile' ? 'bg-primary text-white' : 'text-[#2D3033] hover:bg-neutral-2'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Detail Profil</span>
            </button>
          </div>
        </aside>

        {/* Content Area (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          {/* Orders History Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-[#101519]">Riwayat Pesanan Belanja</h2>

              {orders.length === 0 ? (
                <div className="bg-white border border-hairline rounded-2xl p-12 text-center text-xs text-body">
                  Belum ada transaksi pesanan.
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="bg-white border border-hairline rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-hairline text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{ord.order_number}</span>
                        <span className="text-body">•</span>
                        <span className="text-body">{formatDate(ord.created_at)}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-bold rounded-full uppercase text-[10px] self-start sm:self-center">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ord.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-[#101519]">{it.product_name}</p>
                            <p className="text-body text-[11px]">{it.quantity} x {formatRupiah(it.price)}</p>
                          </div>
                          <span className="font-bold text-[#101519]">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-body">Total Pembayaran: </span>
                        <span className="font-extrabold text-primary text-sm">{formatRupiah(ord.total_amount)}</span>
                      </div>
                      <Link
                        to={`/track-order?ref=${ord.order_number}`}
                        className="px-4 py-2 bg-neutral-2 hover:bg-neutral-1/40 font-bold text-[#2D3033] rounded-xl transition-colors text-center"
                      >
                        Lacak Pengiriman
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#101519]">Buku Alamat Pengiriman</h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Alamat Baru</span>
                </button>
              </div>

              {/* Add Address Form Modal / Inline */}
              {showAddAddress && (
                <form onSubmit={handleCreateAddress} className="bg-white border border-hairline rounded-2xl p-6 space-y-4 text-xs">
                  <h3 className="font-extrabold text-sm text-[#101519]">Alamat Pengiriman Baru</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-body block mb-1">Nama Penerima *</label>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-body block mb-1">Nomor Telepon / WA *</label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-body block mb-1">Alamat Lengkap *</label>
                    <textarea
                      rows={2}
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full p-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-body block mb-1">Kecamatan</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-body block mb-1">Kota / Kab *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-body block mb-1">Provinsi</label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-body block mb-1">Kode Pos</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-white font-bold rounded-xl"
                    >
                      Simpan Alamat
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="px-4 py-2 bg-neutral-2 text-body font-bold rounded-xl"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* List of Addresses */}
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white border border-hairline rounded-2xl p-5 flex items-start justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#101519]">{addr.recipient_name}</span>
                        {addr.is_primary && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 font-bold rounded text-[10px]">
                            Alamat Utama
                          </span>
                        )}
                      </div>
                      <p className="text-body">{addr.phone_number}</p>
                      <p className="text-[#2D3033] font-medium">{addr.street_address}, {addr.district}, {addr.city}, {addr.province} {addr.postal_code}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!addr.is_primary && (
                        <button
                          onClick={() => setPrimaryAddress(addr.id)}
                          className="text-primary font-bold hover:underline"
                        >
                          Jadikan Utama
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="text-body hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-hairline rounded-2xl p-6 space-y-4 text-xs">
              <h2 className="text-lg font-extrabold text-[#101519]">Data Akun Pelanggan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="font-bold text-body block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    disabled
                    value={user?.full_name || ''}
                    className="w-full h-10 px-3 bg-neutral-2 rounded-xl text-body font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-body block mb-1">Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full h-10 px-3 bg-neutral-2 rounded-xl text-body font-semibold cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-[11px] text-body pt-2">
                Hak Akses: <strong className="text-primary uppercase">{user?.role}</strong> (Terlindungi oleh Supabase Auth & RLS).
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
