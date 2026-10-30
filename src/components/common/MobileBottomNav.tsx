import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, FileSpreadsheet, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());

  const navItems = [
    { label: 'Beranda', path: '/', icon: Home },
    { label: 'Kategori', path: '/products', icon: Grid },
    { label: 'Custom', path: '/bulk-order', icon: FileSpreadsheet, highlight: true },
    { label: 'Keranjang', path: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Akun', path: '/account', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-hairline py-2 px-3 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center text-[10px] font-semibold transition-colors relative py-1 ${
                isActive ? 'text-primary font-bold' : 'text-body hover:text-[#2D3033]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-primary text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
