import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  FileSpreadsheet,
  ChevronDown,
  Shield,
  Navigation,
  LogOut,
  KeyRound,
  ChevronRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { formatRupiah } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, loginAs, logout } = useAuthStore();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [showManualLoginModal, setShowManualLoginModal] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');

  // Auto-suggest products
  const suggestedProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
            p.sku_master.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.isbn && p.isbn.includes(searchQuery))
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-hairline shadow-sm w-full">
      {/* Main Header Row */}
      <div className="max-w-site mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0 min-w-0">
          <img
            src="/logo.jpg"
            alt="USKI STORE Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-hairline shadow-sm shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <span className="text-base sm:text-xl font-extrabold tracking-tight text-[#0060AE] block leading-none truncate">
              USKI <span className="text-[#2D3033]">STORE</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-body uppercase mt-0.5 truncate hidden sm:block">
              Bookstore & Stationery
            </span>
          </div>
        </Link>

        {/* Category Dropdown Trigger (Desktop) */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#2D3033] hover:text-primary rounded-lg transition-colors border border-hairline hover:border-primary"
          >
            <Menu className="w-4 h-4" />
            <span>Kategori</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Category Dropdown Modal */}
          {categoryMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-hairline py-2 z-50"
              onMouseLeave={() => setCategoryMenuOpen(false)}
            >
              <div className="px-3 py-1.5 text-xs font-bold text-body uppercase tracking-wider border-b border-hairline">
                Semua Kategori Produk
              </div>
              <div className="max-h-96 overflow-y-auto py-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    onClick={() => setCategoryMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-[#2D3033] hover:bg-neutral-2 hover:text-primary transition-colors"
                  >
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Bar (Desktop & Tablet) */}
        <div className="relative flex-1 max-w-2xl hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Cari judul buku, penulis, ISBN, atau ATK..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full h-11 pl-11 pr-4 bg-white border border-hairline rounded-full text-sm text-[#2D3033] placeholder-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <Search className="w-4 h-4 text-body absolute left-4 top-1/2 -translate-y-1/2" />
          </form>

          {/* Live Auto-suggest Dropdown */}
          {showSuggestions && suggestedProducts.length > 0 && (
            <div
              className="absolute left-0 right-0 top-12 bg-white rounded-2xl shadow-xl border border-hairline p-2 z-50 max-h-[75dvh] overflow-y-auto touch-scroll"
              onMouseLeave={() => setShowSuggestions(false)}
            >
              <div className="text-xs font-semibold text-body px-3 py-1.5 border-b border-hairline">
                Produk Terkait
              </div>
              {suggestedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-2 rounded-xl transition-colors"
                >
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-10 h-14 object-cover rounded border border-hairline shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101519] truncate">{p.name}</p>
                    <p className="text-xs text-body">{p.author || p.brand?.name || 'USKI Store'}</p>
                    <p className="text-xs font-bold text-primary">
                      {formatRupiah(p.sale_price ?? p.base_price)}
                    </p>
                  </div>
                </Link>
              ))}
              <div className="pt-1.5 border-t border-hairline text-center">
                <button
                  onClick={handleSearchSubmit}
                  className="text-xs font-bold text-primary hover:underline py-1"
                >
                  Lihat Semua Hasil Pencarian untuk "{searchQuery}"
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Wishlist Link */}
          <Link
            to="/account"
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-neutral-2 text-[#2D3033] transition-colors relative"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
          </Link>

          {/* Cart Trigger */}
          <Link
            to="/cart"
            className="flex items-center gap-1.5 px-3 h-9 sm:h-11 sm:px-3.5 bg-neutral-2 hover:bg-[#E3E4E5] rounded-full text-[#2D3033] font-bold text-xs sm:text-sm transition-colors relative shrink-0"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="hidden sm:inline font-bold">Keranjang</span>
            {itemCount > 0 && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 bg-primary text-white rounded-full text-[10px] sm:text-xs flex items-center justify-center font-extrabold animate-pulse">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Account & Direct Login Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 h-9 sm:h-11 border border-primary/40 bg-primary/5 hover:bg-primary/10 rounded-full text-xs font-bold text-[#101519] transition-all shadow-xs"
              title="Menu Akun & Login Cepat"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] sm:text-[11px] shrink-0">
                {user ? user.full_name[0] : <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <span className="block text-[9px] sm:text-[10px] text-body font-semibold">
                  {user ? 'Akun Aktif' : 'Akses'}
                </span>
                <span className="block text-[11px] sm:text-xs font-extrabold text-primary truncate max-w-[100px]">
                  {user
                    ? user.role === 'super_admin'
                      ? 'Admin'
                      : user.role === 'courier'
                      ? 'Kurir'
                      : user.role === 'staff'
                      ? 'Staf'
                      : user.full_name.split(' ')[0]
                    : 'Masuk'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-body shrink-0" />
            </button>

            {/* Quick 1-Click Direct Login & Account Dropdown */}
            {roleSwitcherOpen && (
              <div
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-3xl shadow-2xl border border-hairline p-4 z-50 animate-slide-up space-y-3 max-h-[85dvh] overflow-y-auto touch-scroll"
                onMouseLeave={() => setRoleSwitcherOpen(false)}
              >
                {/* Active user recap if logged in */}
                {user ? (
                  <div className="p-3 bg-neutral-2/60 rounded-2xl flex items-center justify-between border border-hairline">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {user.full_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-[#101519] truncate">{user.full_name}</p>
                        <span className="inline-block px-2 py-0.2 text-[9px] font-extrabold uppercase rounded bg-primary/15 text-primary">
                          {user.role === 'courier'
                            ? '🏍️ Kurir Toko (Auto GPS)'
                            : user.role === 'super_admin'
                            ? '👑 Super Admin'
                            : user.role === 'staff'
                            ? '📦 Staf Gudang'
                            : '🛍️ Pelanggan'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setRoleSwitcherOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-badge-text hover:bg-red-50 text-xs font-bold transition-colors"
                      title="Keluar / Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-left pb-1 border-b border-hairline">
                    <h3 className="font-extrabold text-sm text-[#101519]">Masuk ke USKI STORE</h3>
                    <p className="text-[11px] text-body">Pilih peran di bawah untuk langsung masuk 1-klik:</p>
                  </div>
                )}

                {/* 1-Click Direct Login Card Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-body">
                      ⚡ Langsung Masuk (1-Klik)
                    </span>
                    <span className="text-[10px] text-green-600 font-bold">Tanpa Password</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Super Admin Card */}
                    <button
                      onClick={() => {
                        loginAs('super_admin');
                        setRoleSwitcherOpen(false);
                        navigate('/admin');
                      }}
                      className="p-2.5 rounded-2xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 hover:border-purple-400 text-left transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">👑</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">
                          Admin
                        </span>
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#101519] block group-hover:text-purple-900">
                          Super Admin
                        </span>
                        <span className="text-[10px] text-body line-clamp-1">Kelola toko & produk</span>
                      </div>
                    </button>

                    {/* Kurir Toko Card */}
                    <button
                      onClick={() => {
                        loginAs('courier');
                        setRoleSwitcherOpen(false);
                        navigate('/courier');
                      }}
                      className="p-2.5 rounded-2xl border border-green-200 bg-green-50/70 hover:bg-green-100 hover:border-green-400 text-left transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">🏍️</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-green-200 text-green-900 animate-pulse">
                          Auto GPS
                        </span>
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#101519] block group-hover:text-green-900">
                          Kurir Toko
                        </span>
                        <span className="text-[10px] text-body line-clamp-1">Antar paket & live GPS</span>
                      </div>
                    </button>

                    {/* Staf Gudang Card */}
                    <button
                      onClick={() => {
                        loginAs('staff');
                        setRoleSwitcherOpen(false);
                        navigate('/admin/inventory');
                      }}
                      className="p-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400 text-left transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">📦</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                          Gudang
                        </span>
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#101519] block group-hover:text-amber-900">
                          Staf Gudang
                        </span>
                        <span className="text-[10px] text-body line-clamp-1">Inventaris & barcode</span>
                      </div>
                    </button>

                    {/* Pelanggan Card */}
                    <button
                      onClick={() => {
                        loginAs('customer');
                        setRoleSwitcherOpen(false);
                        navigate('/account');
                      }}
                      className="p-2.5 rounded-2xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 hover:border-blue-400 text-left transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">🛍️</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-200 text-blue-900">
                          Pembeli
                        </span>
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#101519] block group-hover:text-blue-900">
                          Pelanggan
                        </span>
                        <span className="text-[10px] text-body line-clamp-1">Riwayat belanja & alamat</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Direct quick links */}
                <div className="pt-2 border-t border-hairline space-y-1 text-xs">
                  {user?.role === 'courier' && (
                    <Link
                      to="/courier"
                      onClick={() => setRoleSwitcherOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl bg-green-100/70 text-green-900 font-bold hover:bg-green-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-green-700 animate-spin-slow" />
                        <span>Buka Layar Portal Kurir (Auto GPS)</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}

                  {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'staff') && (
                    <Link
                      to="/admin"
                      onClick={() => setRoleSwitcherOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/15 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Buka Panel Admin Backoffice</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}

                  <Link
                    to="/account"
                    onClick={() => setRoleSwitcherOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-2 text-body font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-body" />
                      <span>Dashboard & Profil Akun</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Manual login prompt trigger */}
                <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-body">
                  <button
                    onClick={() => {
                      setRoleSwitcherOpen(false);
                      setShowManualLoginModal(true);
                    }}
                    className="text-primary hover:underline font-bold flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Ketik Email & Sandi</span>
                  </button>

                  {user && (
                    <button
                      onClick={() => {
                        logout();
                        setRoleSwitcherOpen(false);
                      }}
                      className="text-badge-text hover:underline font-bold"
                    >
                      Keluar / Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-2 text-[#2D3033]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar - Perfectly matches body padding px-4 */}
      <div className="md:hidden px-4 pb-2.5 pt-0">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            placeholder="Cari buku, novel, ATK, kitab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-neutral-2 border border-hairline rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
          />
          <Search className="w-4 h-4 text-body absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-hairline px-4 py-4 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-body uppercase tracking-wider mb-2">Navigasi Utama</p>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#2D3033] hover:text-primary"
            >
              Semua Katalog Produk
            </Link>
            <Link
              to="/bulk-order"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-primary flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Layanan Pesanan Custom & Grosir
            </Link>
            <Link
              to="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#2D3033] hover:text-primary"
            >
              Lacak Pengiriman Pesanan
            </Link>
          </div>

          <div className="pt-2 border-t border-hairline">
            <p className="text-xs font-bold text-body uppercase tracking-wider mb-2">Kategori Pilihan</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#2D3033] hover:text-primary py-1 truncate"
                >
                  • {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Email & Password Login Modal */}
      {showManualLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl max-h-[90dvh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">Masuk ke Akun</h3>
                  <p className="text-[11px] text-body">Gunakan email & kata sandi</p>
                </div>
              </div>
              <button onClick={() => setShowManualLoginModal(false)}>
                <X className="w-5 h-5 text-body" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const em = manualEmail.trim().toLowerCase();
                if (em.includes('admin')) {
                  loginAs('super_admin');
                  navigate('/admin');
                } else if (em.includes('kurir') || em.includes('courier')) {
                  loginAs('courier');
                  navigate('/courier');
                } else if (em.includes('gudang') || em.includes('staff')) {
                  loginAs('staff');
                  navigate('/admin/inventory');
                } else {
                  loginAs('customer');
                  navigate('/account');
                }
                setShowManualLoginModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-body block mb-1">Email Toko / Akun</label>
                <input
                  type="email"
                  required
                  placeholder="admin@uskistore.id / kurir@... / user@..."
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                >
                  Masuk Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
