import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';

// Public Pages
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { BulkOrderPage } from '@/pages/BulkOrderPage';
import { BulkOrderQuotationPage } from '@/pages/BulkOrderQuotationPage';
import { OrderTrackingPage } from '@/pages/OrderTrackingPage';
import { AccountPage } from '@/pages/AccountPage';
import { StaticPolicyPage } from '@/pages/StaticPolicyPage';

// Admin Backoffice Pages
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProducts } from '@/pages/admin/AdminProducts';
import { AdminInventory } from '@/pages/admin/AdminInventory';
import { AdminOrders } from '@/pages/admin/AdminOrders';
import { AdminPayments } from '@/pages/admin/AdminPayments';
import { AdminBulkOrders } from '@/pages/admin/AdminBulkOrders';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminCategories } from '@/pages/admin/AdminCategories';
import { AdminPromos } from '@/pages/admin/AdminPromos';
import { AdminStaff } from '@/pages/admin/AdminStaff';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Public Storefront Layout
function StorefrontLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBFD] pb-16 lg:pb-0">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Storefront Routes */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
          <Route path="/bulk-order" element={<BulkOrderPage />} />
          <Route path="/bulk-order/:reference" element={<BulkOrderQuotationPage />} />
          <Route path="/track-order" element={<OrderTrackingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/policies/:type" element={<StaticPolicyPage />} />
          <Route path="/contact" element={<StaticPolicyPage />} />
          <Route path="/about" element={<StaticPolicyPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>

        {/* Admin Backoffice Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="bulk-orders" element={<AdminBulkOrders />} />
          <Route path="promos" element={<AdminPromos />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
