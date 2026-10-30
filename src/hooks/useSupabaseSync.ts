import { useEffect } from 'react';
import { supabase, isSupabaseConfigured, dbService, ensureAuthSession } from '@/lib/supabase';
import { useProductStore } from '@/store/productStore';
import { useOrderStore } from '@/store/orderStore';
import { useCourierStore } from '@/store/courierStore';
import { useCategoryStore } from '@/store/categoryStore';
import { usePromoStore } from '@/store/promoStore';
import { useCustomOrderStore } from '@/store/customOrderStore';

/**
 * Global Realtime Synchronization Hook
 * Syncs Supabase database and live GPS telemetry across devices
 */
export function useSupabaseSync() {
  const { setProductsFromSupabase, setInventoryMovementsFromSupabase } = useProductStore.getState();
  const { setOrdersFromSupabase } = useOrderStore.getState();
  const { setCouriersFromSupabase } = useCourierStore.getState();
  const { setCategoriesFromSupabase, setBannersFromSupabase } = useCategoryStore.getState();
  const { setVouchersFromSupabase } = usePromoStore.getState();
  const { setRequestsFromSupabase } = useCustomOrderStore.getState();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let isMounted = true;

    // 1. Initial Load from Supabase Cloud with verified session
    async function loadInitialData() {
      try {
        await ensureAuthSession();
        const [
          products,
          orders,
          couriers,
          categories,
          banners,
          vouchers,
          customRequests,
          movements,
        ] = await Promise.all([
          dbService.products.getAll(),
          dbService.orders.getAll(),
          dbService.couriers.getAll(),
          dbService.categories.getAll(),
          dbService.banners.getAll(),
          dbService.vouchers.getAll(),
          dbService.bulkOrders.getAll(),
          dbService.inventoryMovements.getAll(),
        ]);

        if (!isMounted) return;

        // Populate stores directly from database response without discarding empty arrays
        if (products !== null && setProductsFromSupabase) setProductsFromSupabase(products);
        if (orders !== null && setOrdersFromSupabase) setOrdersFromSupabase(orders);
        if (couriers !== null && setCouriersFromSupabase) setCouriersFromSupabase(couriers);
        if (categories !== null && setCategoriesFromSupabase) setCategoriesFromSupabase(categories);
        if (banners !== null && setBannersFromSupabase) setBannersFromSupabase(banners);
        if (vouchers !== null && setVouchersFromSupabase) setVouchersFromSupabase(vouchers);
        if (customRequests !== null && setRequestsFromSupabase) setRequestsFromSupabase(customRequests);
        if (movements !== null && setInventoryMovementsFromSupabase) setInventoryMovementsFromSupabase(movements);
      } catch (err) {
        console.warn('Initial Supabase sync error:', err);
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
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const updatedOrder = payload.new as any;
              if (!updatedOrder || typeof updatedOrder !== 'object' || !updatedOrder.id) return;
              const currentOrders = useOrderStore.getState().orders;
              const exists = currentOrders.some((o) => o.id === updatedOrder.id);
              if (exists) {
                useOrderStore.setState({
                  orders: currentOrders.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o)),
                });
              } else {
                useOrderStore.setState({ orders: [updatedOrder, ...currentOrders] });
              }
            } else if (payload.eventType === 'DELETE') {
              const oldOrder = payload.old as any;
              if (!oldOrder || typeof oldOrder !== 'object' || !oldOrder.id) return;
              const currentOrders = useOrderStore.getState().orders;
              useOrderStore.setState({
                orders: currentOrders.filter((o) => o.id !== oldOrder.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on orders:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couriers' },
        (payload) => {
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT') {
              const newCourier = payload.new as any;
              if (!newCourier || typeof newCourier !== 'object' || !newCourier.id) return;
              const currentCouriers = useCourierStore.getState().couriers;
              if (!currentCouriers.some((c) => c.id === newCourier.id)) {
                useCourierStore.setState({ couriers: [...currentCouriers, newCourier] });
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedCourier = payload.new as any;
              if (!updatedCourier || typeof updatedCourier !== 'object' || !updatedCourier.id) return;
              const currentCouriers = useCourierStore.getState().couriers;
              useCourierStore.setState({
                couriers: currentCouriers.map((c) =>
                  c.id === updatedCourier.id ? { ...c, ...updatedCourier } : c
                ),
              });
            } else if (payload.eventType === 'DELETE') {
              const oldCourier = payload.old as any;
              if (!oldCourier || typeof oldCourier !== 'object' || !oldCourier.id) return;
              const currentCouriers = useCourierStore.getState().couriers;
              useCourierStore.setState({
                couriers: currentCouriers.filter((c) => c.id !== oldCourier.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on couriers:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const updatedProd = payload.new as any;
              if (!updatedProd || typeof updatedProd !== 'object' || !updatedProd.id) return;
              const currentProds = useProductStore.getState().products;
              const exists = currentProds.some((p) => p.id === updatedProd.id);
              if (exists) {
                useProductStore.setState({
                  products: currentProds.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p)),
                });
              } else {
                useProductStore.setState({ products: [updatedProd, ...currentProds] });
              }
            } else if (payload.eventType === 'DELETE') {
              const oldProd = payload.old as any;
              if (!oldProd || typeof oldProd !== 'object' || !oldProd.id) return;
              const currentProds = useProductStore.getState().products;
              useProductStore.setState({
                products: currentProds.filter((p) => p.id !== oldProd.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on products:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const cat = payload.new as any;
              if (!cat || typeof cat !== 'object' || !cat.id) return;
              const currentCats = useCategoryStore.getState().categories;
              const exists = currentCats.some((c) => c.id === cat.id);
              if (exists) {
                useCategoryStore.setState({
                  categories: currentCats.map((c) => (c.id === cat.id ? { ...c, ...cat } : c)),
                });
              } else {
                useCategoryStore.setState({ categories: [...currentCats, cat] });
              }
            } else if (payload.eventType === 'DELETE') {
              const oldCat = payload.old as any;
              if (!oldCat || typeof oldCat !== 'object' || !oldCat.id) return;
              const currentCats = useCategoryStore.getState().categories;
              useCategoryStore.setState({
                categories: currentCats.filter((c) => c.id !== oldCat.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on categories:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        (payload) => {
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const banner = payload.new as any;
              if (!banner || typeof banner !== 'object' || !banner.id) return;
              const currentBanners = useCategoryStore.getState().banners;
              const exists = currentBanners.some((b) => b.id === banner.id);
              if (exists) {
                useCategoryStore.setState({
                  banners: currentBanners.map((b) => (b.id === banner.id ? { ...b, ...banner } : b)),
                });
              } else {
                useCategoryStore.setState({ banners: [...currentBanners, banner] });
              }
            } else if (payload.eventType === 'DELETE') {
              const oldBanner = payload.old as any;
              if (!oldBanner || typeof oldBanner !== 'object' || !oldBanner.id) return;
              const currentBanners = useCategoryStore.getState().banners;
              useCategoryStore.setState({
                banners: currentBanners.filter((b) => b.id !== oldBanner.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on banners:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vouchers' },
        (payload) => {
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const voucher = payload.new as any;
              if (!voucher || typeof voucher !== 'object' || !voucher.id) return;
              const currentVouchers = usePromoStore.getState().vouchers;
              const exists = currentVouchers.some((v) => v.id === voucher.id);
              if (exists) {
                usePromoStore.setState({
                  vouchers: currentVouchers.map((v) => (v.id === voucher.id ? { ...v, ...voucher } : v)),
                });
              } else {
                usePromoStore.setState({ vouchers: [voucher, ...currentVouchers] });
              }
            } else if (payload.eventType === 'DELETE') {
              const oldVoucher = payload.old as any;
              if (!oldVoucher || typeof oldVoucher !== 'object' || !oldVoucher.id) return;
              const currentVouchers = usePromoStore.getState().vouchers;
              usePromoStore.setState({
                vouchers: currentVouchers.filter((v) => v.id !== oldVoucher.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on vouchers:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_requests' },
        (payload) => {
          if (!isMounted || !payload || typeof payload !== 'object') return;
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const req = payload.new as any;
              if (!req || typeof req !== 'object' || !req.id) return;
              const currentReqs = useCustomOrderStore.getState().requests;
              const exists = currentReqs.some((r) => r.id === req.id);
              if (exists) {
                useCustomOrderStore.setState({
                  requests: currentReqs.map((r) => (r.id === req.id ? { ...r, ...req } : r)),
                });
              } else {
                useCustomOrderStore.setState({ requests: [req, ...currentReqs] });
              }
            } else if (payload.eventType === 'DELETE') {
              const oldReq = payload.old as any;
              if (!oldReq || typeof oldReq !== 'object' || !oldReq.id) return;
              const currentReqs = useCustomOrderStore.getState().requests;
              useCustomOrderStore.setState({
                requests: currentReqs.filter((r) => r.id !== oldReq.id),
              });
            }
          } catch (err) {
            console.warn('Realtime sync handler error on custom_requests:', err);
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
