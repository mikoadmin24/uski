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
    <header className="sticky top-0 z-50 bg-white border-b border-hairline shadow-sm">
      {/* Main Header */}
      <div className="max-w-site mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-xl shadow-sm tracking-wider">
            U
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-[#0060AE] block leading-none">
              USKI <span className="text-[#2D3033]">STORE</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-body uppercase block mt-0.5">
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

        {/* Search Bar (Pill Shaped - Gramedia Token) */}
        <div className="relative flex-1 max-w-2xl">
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
              className="absolute left-0 right-0 top-12 bg-white rounded-2xl shadow-xl border border-hairline p-2 z-50"
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
        <div className="flex items-center gap-2">
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
            className="flex items-center gap-2 px-3.5 h-11 bg-neutral-2 hover:bg-[#E3E4E5] rounded-full text-[#2D3033] font-bold text-sm transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline font-bold">Keranjang</span>
            {itemCount > 0 && (
              <span className="w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center font-extrabold animate-pulse">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Account & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center gap-1.5 px-3 h-11 border border-hairline rounded-full hover:border-primary text-sm font-semibold text-[#2D3033] transition-colors"
            >
              <User className="w-4 h-4 text-primary" />
              <span className="hidden md:inline max-w-[100px] truncate">
                {user ? user.full_name : 'Masuk'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-body" />
            </button>

            {/* Account / Role Dropdown */}
            {roleSwitcherOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-hairline py-2 z-50"
                onMouseLeave={() => setRoleSwitcherOpen(false)}
              >
                <div className="px-4 py-2 border-b border-hairline">
                  <p className="text-xs font-semibold text-body">Sedang Aktif Sebagai:</p>
                  <p className="text-sm font-bold text-[#101519]">{user?.full_name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-primary/10 text-primary">
                    Peran: {user?.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/account"
                    onClick={() => setRoleSwitcherOpen(false)}
                    className="block px-4 py-2 text-sm text-[#2D3033] hover:bg-neutral-2"
                  >
                    Dashboard Akun
                  </Link>

                  {/* Admin Direct Links if Admin */}
                  {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'staff') && (
                    <Link
                      to="/admin"
                      onClick={() => setRoleSwitcherOpen(false)}
                      className="block px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 flex items-center gap-1.5"
                    >
                      <Shield className="w-4 h-4" />
                      Panel Admin / Backoffice
                    </Link>
                  )}

                  {user?.role === 'courier' && (
                    <Link
                      to="/courier"
                      onClick={() => setRoleSwitcherOpen(false)}
                      className="block px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50 flex items-center gap-1.5"
                    >
                      <Navigation className="w-4 h-4 text-green-600 animate-spin-slow" />
                      Portal Kurir (Auto GPS Aktif)
                    </Link>
                  )}
                </div>

                {/* Role Switcher Demo Bar */}
                <div className="px-4 pt-2 pb-1 border-t border-hairline bg-neutral-2/50">
                  <p className="text-[11px] font-bold text-body uppercase tracking-wider mb-1.5">
                    Mode Pengujian Role:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <button
                      onClick={() => {
                        loginAs('customer');
                        setRoleSwitcherOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-left ${user?.role === 'customer' ? 'bg-primary text-white font-bold' : 'hover:bg-white'}`}
                    >
                      Pelanggan
                    </button>
                    <button
                      onClick={() => {
                        loginAs('super_admin');
                        setRoleSwitcherOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-left ${user?.role === 'super_admin' ? 'bg-primary text-white font-bold' : 'hover:bg-white'}`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => {
                        loginAs('staff');
                        setRoleSwitcherOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-left ${user?.role === 'staff' ? 'bg-primary text-white font-bold' : 'hover:bg-white'}`}
                    >
                      Staf Toko
                    </button>
                    <button
                      onClick={() => {
                        loginAs('courier');
                        setRoleSwitcherOpen(false);
                        navigate('/courier');
                      }}
                      className={`px-2 py-1 rounded text-left ${user?.role === 'courier' ? 'bg-primary text-white font-bold' : 'hover:bg-white'}`}
                    >
                      Kurir (Auto GPS)
                    </button>
                  </div>
                </div>

                <div className="pt-1 border-t border-hairline">
                  <button
                    onClick={() => {
                      logout();
                      setRoleSwitcherOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-badge-text hover:bg-badge-bg font-semibold"
                  >
                    Keluar / Logout
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
    </header>
  );
};
