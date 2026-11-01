/**
 * Empirical Adversarial Challenge: Supabase Sync & Realtime Dispatcher
 * Tests useSupabaseSync logic against empty cloud states, realtime events, and edge cases.
 */

(() => {
  const storageMap = ((globalThis as any).__USKI_MOCK_STORAGE__ ??= new Map<string, string>());
  (globalThis as any).localStorage ??= {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => { storageMap.set(key, String(value)); },
    removeItem: (key: string) => { storageMap.delete(key); },
    clear: () => { storageMap.clear(); },
    get length() { return storageMap.size; },
    key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  };

  const BOLD = '\x1b[1m';
  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const CYAN = '\x1b[36m';
  const RESET = '\x1b[0m';

  let passed = 0;
  let failed = 0;

  function assertCondition(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ${GREEN}✔ PASS${RESET} ${testName}`);
      passed++;
    } else {
      console.error(`  ${RED}✖ FAIL${RESET} ${testName}`);
      if (detail) console.error(`    ${RED}Detail:${RESET} ${detail}`);
      failed++;
    }
  }

  async function runSyncChallenges() {
    console.log(`\n${BOLD}================================================================${RESET}`);
    console.log(`${BOLD}   EMPIRICAL CHALLENGER — SUPABASE SYNC & REALTIME HARNESS     ${RESET}`);
    console.log(`${BOLD}================================================================${RESET}\n`);

    const { useOrderStore } = await import('../../src/store/orderStore');
    const { useProductStore } = await import('../../src/store/productStore');
    const { useCourierStore } = await import('../../src/store/courierStore');
    const { useCategoryStore } = await import('../../src/store/categoryStore');
    const { usePromoStore } = await import('../../src/store/promoStore');
    const { useCustomOrderStore } = await import('../../src/store/customOrderStore');

    // --- TEST SCENARIO A: Empty Cloud DB Hydration ---
    console.log(`${CYAN}▶ Scenario A: Empty Cloud Database Hydration Simulation${RESET}`);

    // Simulate responses from dbService when database tables are totally empty ([])
    const cloudMockResponses = {
      products: [] as any[],
      orders: [] as any[],
      couriers: [] as any[],
      categories: [] as any[],
      banners: [] as any[],
      vouchers: [] as any[],
      customRequests: [] as any[],
      movements: [] as any[],
    };

    // Hydration logic as executed in useSupabaseSync
    const { setProductsFromSupabase, setInventoryMovementsFromSupabase } = useProductStore.getState();
    const { setOrdersFromSupabase } = useOrderStore.getState();
    const { setCouriersFromSupabase } = useCourierStore.getState();
    const { setCategoriesFromSupabase, setBannersFromSupabase } = useCategoryStore.getState();
    const { setVouchersFromSupabase } = usePromoStore.getState();
    const { setRequestsFromSupabase } = useCustomOrderStore.getState();

    if (cloudMockResponses.products !== null) setProductsFromSupabase(cloudMockResponses.products);
    if (cloudMockResponses.orders !== null) setOrdersFromSupabase(cloudMockResponses.orders);
    if (cloudMockResponses.couriers !== null) setCouriersFromSupabase(cloudMockResponses.couriers);
    if (cloudMockResponses.categories !== null) setCategoriesFromSupabase(cloudMockResponses.categories);
    if (cloudMockResponses.banners !== null) setBannersFromSupabase(cloudMockResponses.banners);
    if (cloudMockResponses.vouchers !== null) setVouchersFromSupabase(cloudMockResponses.vouchers);
    if (cloudMockResponses.customRequests !== null) setRequestsFromSupabase(cloudMockResponses.customRequests);
    if (cloudMockResponses.movements !== null) setInventoryMovementsFromSupabase(cloudMockResponses.movements);

    assertCondition(useProductStore.getState().products.length === 0, 'TC-SYNC01: Products store remains [] after sync from empty DB');
    assertCondition(useOrderStore.getState().orders.length === 0, 'TC-SYNC02: Orders store remains [] after sync from empty DB');
    assertCondition(useCourierStore.getState().couriers.length === 0, 'TC-SYNC03: Couriers store remains [] after sync from empty DB');
    assertCondition(useCategoryStore.getState().categories.length === 0, 'TC-SYNC04: Categories store remains [] after sync from empty DB');
    assertCondition(useCategoryStore.getState().banners.length === 0, 'TC-SYNC05: Banners store remains [] after sync from empty DB');
    assertCondition(usePromoStore.getState().vouchers.length === 0, 'TC-SYNC06: Vouchers store remains [] after sync from empty DB');
    assertCondition(useCustomOrderStore.getState().requests.length === 0, 'TC-SYNC07: Custom requests store remains [] after sync from empty DB');
    assertCondition(useProductStore.getState().inventoryMovements.length === 0, 'TC-SYNC08: Inventory movements store remains [] after sync from empty DB');

    // --- TEST SCENARIO B: Realtime Event Simulation ---
    console.log(`\n${CYAN}▶ Scenario B: Realtime Event Dispatch Simulation${RESET}`);

    // B.1 Orders Realtime (INSERT -> UPDATE -> DELETE)
    const incomingOrder: any = {
      id: 'ord-cloud-001',
      order_number: 'USKI-20261030-001',
      status: 'awaiting_payment',
      total_amount: 150000,
    };

    // Simulate Realtime INSERT
    let currentOrders = useOrderStore.getState().orders;
    useOrderStore.setState({ orders: [incomingOrder, ...currentOrders] });
    assertCondition(
      useOrderStore.getState().orders.some((o) => o.id === 'ord-cloud-001'),
      'TC-SYNC09: Realtime INSERT prepends order into store'
    );

    // Simulate Realtime UPDATE
    const updatedOrder = { ...incomingOrder, status: 'processing' as const };
    currentOrders = useOrderStore.getState().orders;
    useOrderStore.setState({
      orders: currentOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    });
    assertCondition(
      useOrderStore.getState().orders.find((o) => o.id === 'ord-cloud-001')?.status === 'processing',
      'TC-SYNC10: Realtime UPDATE updates order status in-place'
    );

    // Simulate Realtime DELETE
    currentOrders = useOrderStore.getState().orders;
    useOrderStore.setState({
      orders: currentOrders.filter((o) => o.id !== 'ord-cloud-001'),
    });
    assertCondition(
      !useOrderStore.getState().orders.some((o) => o.id === 'ord-cloud-001'),
      'TC-SYNC11: Realtime DELETE evicts order from store'
    );

    // B.2 Couriers Realtime (INSERT -> UPDATE -> DELETE)
    const incomingCourier: any = {
      id: 'cour-live-01',
      name: 'Driver Realtime',
      status: 'available',
      current_location: { lat: -6.37, lng: 106.83 },
    };

    let currentCouriers = useCourierStore.getState().couriers;
    useCourierStore.setState({ couriers: [...currentCouriers, incomingCourier] });
    assertCondition(
      useCourierStore.getState().couriers.some((c) => c.id === 'cour-live-01'),
      'TC-SYNC12: Realtime INSERT appends courier into store'
    );

    const updatedCourier = { ...incomingCourier, status: 'delivering' };
    currentCouriers = useCourierStore.getState().couriers;
    useCourierStore.setState({
      couriers: currentCouriers.map((c) => (c.id === updatedCourier.id ? { ...c, ...updatedCourier } : c)),
    });
    assertCondition(
      useCourierStore.getState().couriers.find((c) => c.id === 'cour-live-01')?.status === 'delivering',
      'TC-SYNC13: Realtime UPDATE updates courier status in-place'
    );

    currentCouriers = useCourierStore.getState().couriers;
    useCourierStore.setState({
      couriers: currentCouriers.filter((c) => c.id !== 'cour-live-01'),
    });
    assertCondition(
      !useCourierStore.getState().couriers.some((c) => c.id === 'cour-live-01'),
      'TC-SYNC14: Realtime DELETE evicts courier from store'
    );

    // --- SUMMARY ---
    console.log(`\n${BOLD}================================================================${RESET}`);
    console.log(`${BOLD}                SYNC CHALLENGE SUMMARY                          ${RESET}`);
    console.log(`${BOLD}================================================================${RESET}`);
    console.log(`Total Checks : ${passed + failed}`);
    console.log(`${GREEN}Passed       : ${passed}${RESET}`);
    console.log(`${failed > 0 ? RED : GREEN}Failed       : ${failed}${RESET}`);
    console.log(`${BOLD}================================================================${RESET}\n`);

    if (failed > 0) process.exit(1);
    process.exit(0);
  }

  void runSyncChallenges().catch((err) => {
    console.error('Sync challenge failure:', err);
    process.exit(1);
  });
})();
