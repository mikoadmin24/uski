import { useEffect } from 'react';
import { supabase, isSupabaseConfigured, dbService } from '@/lib/supabase';
import { useProductStore } from '@/store/productStore';
import { useOrderStore } from '@/store/orderStore';
import { useCourierStore } from '@/store/courierStore';
import { useCategoryStore } from '@/store/categoryStore';
import { usePromoStore } from '@/store/promoStore';

/**
 * Global Realtime Synchronization Hook
 * Syncs Supabase database and live GPS telemetry across devices
 */
export function useSupabaseSync() {
  const { setProductsFromSupabase } = useProductStore as any;
  const { setOrdersFromSupabase } = useOrderStore as any;
  const { setCouriersFromSupabase } = useCourierStore as any;
  const { setCategoriesFromSupabase, setBannersFromSupabase } = useCategoryStore as any;
  const { setVouchersFromSupabase } = usePromoStore as any;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let isMounted = true;

    // 1. Initial Load from Supabase Cloud
    async function loadInitialData() {
      try {
        const [products, orders, couriers, categories, banners, vouchers] = await Promise.all([
          dbService.products.getAll(),
          dbService.orders.getAll(),
          dbService.couriers.getAll(),
          dbService.categories.getAll(),
          dbService.banners.getAll(),
          dbService.vouchers.getAll(),
        ]);

        if (!isMounted) return;

        if (products && setProductsFromSupabase) setProductsFromSupabase(products);
        if (orders && setOrdersFromSupabase) setOrdersFromSupabase(orders);
        if (couriers && setCouriersFromSupabase) setCouriersFromSupabase(couriers);
        if (categories && setCategoriesFromSupabase) setCategoriesFromSupabase(categories);
        if (banners && setBannersFromSupabase) setBannersFromSupabase(banners);
        if (vouchers && setVouchersFromSupabase) setVouchersFromSupabase(vouchers);
      } catch (err) {
        console.warn('Initial Supabase sync skipped, using local cache:', err);
      }
    }

    loadInitialData();

    // 2. Realtime Subscriptions for live updates
    const channel = supabase
      .channel('public:live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const currentOrders = useOrderStore.getState().orders;
            const updatedOrder = payload.new as any;
            const exists = currentOrders.some((o) => o.id === updatedOrder.id);
            if (exists) {
              useOrderStore.setState({
                orders: currentOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
              });
            } else {
              useOrderStore.setState({ orders: [updatedOrder, ...currentOrders] });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couriers' },
        (payload) => {
          if (!isMounted) return;
          const updatedCourier = payload.new as any;
          const currentCouriers = useCourierStore.getState().couriers;
          useCourierStore.setState({
            couriers: currentCouriers.map((c) =>
              c.id === updatedCourier.id ? { ...c, ...updatedCourier } : c
            ),
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedProd = payload.new as any;
            const currentProds = useProductStore.getState().products;
            const exists = currentProds.some((p) => p.id === updatedProd.id);
            if (exists) {
              useProductStore.setState({
                products: currentProds.map((p) => (p.id === updatedProd.id ? updatedProd : p)),
              });
            } else {
              useProductStore.setState({ products: [updatedProd, ...currentProds] });
            }
          } else if (payload.eventType === 'DELETE') {
            const currentProds = useProductStore.getState().products;
            useProductStore.setState({
              products: currentProds.filter((p) => p.id !== (payload.old as any).id),
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);
}
