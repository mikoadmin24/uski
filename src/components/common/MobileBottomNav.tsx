import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, FileSpreadsheet, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());

  // Hide generic mobile bottom nav on product detail page to make way for sticky buy/cart bar
  const isProductDetailPage =
    location.pathname.startsWith('/products/') && location.pathname.split('/').filter(Boolean).length >= 2;

  if (isProductDetailPage) {
    return null;
  }

  const navItems = [
    { label: 'Beranda', path: '/', icon: Home },
    { label: 'Kategori', path: '/products', icon: Grid },
    { label: 'Custom', path: '/bulk-order', icon: FileSpreadsheet, highlight: true },
    { label: 'Keranjang', path: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Akun', path: '/account', icon: User },
  ];

  return (
    <nav
      aria-label="Navigasi Seluler"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-hairline/80 pt-1.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] text-[10px] font-semibold transition-all select-none active:scale-95 ${
                isActive ? 'text-primary font-bold' : 'text-body hover:text-[#2D3033]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-primary stroke-[2.5]' : ''
                  } ${item.highlight && !isActive ? 'text-primary' : ''}`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-primary text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`mt-0.5 tracking-tight ${isActive ? 'font-extrabold text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
