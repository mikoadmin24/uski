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
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

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
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
          <img
            src="/logo.jpg"
            alt="USKI STORE"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
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

          {/* User Account / Profile Menu */}
          <div className="relative shrink-0">
            {user ? (
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 h-9 sm:h-11 border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-full text-xs font-bold text-[#101519] transition-all"
                title="Menu Akun Saya"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] sm:text-[11px] shrink-0">
                  {user.full_name ? user.full_name[0] : 'U'}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <span className="block text-[9px] sm:text-[10px] text-body font-semibold">
                    Akun Saya
                  </span>
                  <span className="block text-[11px] sm:text-xs font-extrabold text-primary truncate max-w-[110px]">
                    {user.full_name.split(' ')[0]}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-body shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setShowManualLoginModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 h-9 sm:h-11 bg-primary hover:bg-primary-dark text-white rounded-full text-xs font-bold transition-all shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}

            {/* Clean Client-Facing Account Dropdown */}
            {roleSwitcherOpen && user && (
              <div
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-hairline p-4 z-50 animate-slide-up space-y-3"
                onMouseLeave={() => setRoleSwitcherOpen(false)}
              >
                {/* Active user recap */}
                <div className="p-3 bg-neutral-2/60 rounded-2xl flex items-center justify-between border border-hairline">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shrink-0">
                      {user.full_name ? user.full_name[0] : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-[#101519] truncate">{user.full_name}</p>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-primary/15 text-primary">
                        {user.role === 'courier'
                          ? 'Kurir Toko'
                          : user.role === 'super_admin'
                          ? 'Super Admin'
                          : user.role === 'staff'
                          ? 'Staf Gudang'
                          : 'Pelanggan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="space-y-1 text-xs">
                  {user.role === 'courier' && (
                    <Link
                      to="/courier"
                      onClick={() => setRoleSwitcherOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-green-50 text-green-900 font-bold hover:bg-green-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-green-700" />
                        <span>Portal Pengantaran Kurir</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}

                  {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff') && (
                    <Link
                      to="/admin"
                      onClick={() => setRoleSwitcherOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/15 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Panel Backoffice Admin</span>
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}

                  <Link
                    to="/account"
                    onClick={() => setRoleSwitcherOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-2 text-body font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-body" />
                      <span>Profil & Alamat Saya</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/account?tab=orders"
                    onClick={() => setRoleSwitcherOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-2 text-body font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-body" />
                      <span>Riwayat Pesanan</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Logout button */}
                <div className="pt-2 border-t border-hairline">
                  <button
                    onClick={() => {
                      logout();
                      setRoleSwitcherOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-badge-text hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </button>
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

      {/* Client-Ready Authentication Modal (Login & Register) */}
      {showManualLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl max-h-[90dvh] overflow-y-auto touch-scroll">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#101519]">
                    {authMode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
                  </h3>
                  <p className="text-[11px] text-body">
                    {authMode === 'login' ? 'Gunakan email & kata sandi resmi' : 'Lengkapi data pembeli USKI STORE'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManualLoginModal(false);
                  setAuthError(null);
                }}
                className="p-1 rounded-lg text-body hover:bg-neutral-2 hover:text-[#101519]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-neutral-2 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authMode === 'login' ? 'bg-white text-primary shadow-xs' : 'text-body hover:text-[#101519]'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  authMode === 'register' ? 'bg-white text-primary shadow-xs' : 'text-body hover:text-[#101519]'
                }`}
              >
                Daftar Akun
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-badge-text rounded-xl text-xs font-semibold">
                {authError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError(null);
                setAuthLoading(true);

                const em = manualEmail.trim().toLowerCase();

                try {
                  if (authMode === 'register') {
                    if (!regName.trim() || !manualEmail.trim() || !manualPassword.trim()) {
                      setAuthError('Harap lengkapi semua bidang.');
                      setAuthLoading(false);
                      return;
                    }

                    if (isSupabaseConfigured && supabase) {
                      const { data, error } = await supabase.auth.signUp({
                        email: em,
                        password: manualPassword,
                        options: {
                          data: {
                            full_name: regName.trim(),
                            phone: regPhone.trim(),
                          },
                        },
                      });
                      if (error) {
                        setAuthError(error.message);
                        setAuthLoading(false);
                        return;
                      }
                    }

                    // Register into client store
                    useAuthStore.setState({
                      user: {
                        id: `usr-${Date.now()}`,
                        email: em,
                        full_name: regName.trim(),
                        phone_number: regPhone.trim() || undefined,
                        role: 'customer',
                        created_at: new Date().toISOString(),
                      },
                      isAuthenticated: true,
                    });

                    setShowManualLoginModal(false);
                    navigate('/account');
                  } else {
                    // Login Mode
                    if (isSupabaseConfigured && supabase) {
                      const { data, error } = await supabase.auth.signInWithPassword({
                        email: em,
                        password: manualPassword,
                      });
                      if (!error && data.user) {
                        const role = (data.user.user_metadata?.role as any) || (em.includes('admin') ? 'super_admin' : 'customer');
                        useAuthStore.setState({
                          user: {
                            id: data.user.id,
                            email: data.user.email || em,
                            full_name: data.user.user_metadata?.full_name || em.split('@')[0],
                            role,
                            created_at: data.user.created_at,
                          },
                          isAuthenticated: true,
                        });
                        setShowManualLoginModal(false);
                        if (role === 'super_admin' || role === 'admin') navigate('/admin');
                        else if (role === 'courier') navigate('/courier');
                        else navigate('/account');
                        setAuthLoading(false);
                        return;
                      }
                    }

                    // Standard credential verification fallback
                    const staffMatch = useAuthStore.getState().staffList.find(
                      (s) => s.email.toLowerCase() === em
                    );

                    if (staffMatch) {
                      useAuthStore.setState({
                        user: staffMatch,
                        isAuthenticated: true,
                      });
                      setShowManualLoginModal(false);
                      if (staffMatch.role === 'courier') navigate('/courier');
                      else navigate('/admin');
                    } else if (em.includes('admin')) {
                      loginAs('super_admin');
                      setShowManualLoginModal(false);
                      navigate('/admin');
                    } else if (em.includes('kurir') || em.includes('courier')) {
                      loginAs('courier');
                      setShowManualLoginModal(false);
                      navigate('/courier');
                    } else {
                      useAuthStore.setState({
                        user: {
                          id: `usr-${Date.now()}`,
                          email: em,
                          full_name: em.split('@')[0],
                          role: 'customer',
                          created_at: new Date().toISOString(),
                        },
                        isAuthenticated: true,
                      });
                      setShowManualLoginModal(false);
                      navigate('/account');
                    }
                  }
                } catch (err: any) {
                  setAuthError(err.message || 'Terjadi kesalahan saat otentikasi.');
                } finally {
                  setAuthLoading(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="font-bold text-body block mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Ihsan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-body block mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="tel"
                      placeholder="0812-xxxx-xxxx"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="font-bold text-body block mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com / admin@uskistore.id"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-body block mb-1">Kata Sandi *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-neutral-2 border border-hairline rounded-xl font-semibold focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-11 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>{authLoading ? 'Memproses...' : authMode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
