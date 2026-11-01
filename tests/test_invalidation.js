import { createServer } from 'vite';

class MemoryLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

async function test() {
  const mockStorage = new MemoryLocalStorage();
  globalThis.localStorage = mockStorage;

  const server = await createServer({
    appType: 'custom',
    server: { middlewareMode: true },
  });

  mockStorage.setItem('uski_products_v2', JSON.stringify([{ id: 'prod-1', name: 'Kitab 1' }]));
  const mod1 = await server.ssrLoadModule('./src/store/productStore.ts');
  console.log('Initial load products length:', mod1.useProductStore.getState().products.length);

  // Invalidate and reload with 3 products
  server.moduleGraph.invalidateAll();
  mockStorage.setItem('uski_products_v2', JSON.stringify([
    { id: 'prod-1', name: 'Kitab 1' },
    { id: 'prod-2', name: 'Kitab 2' },
    { id: 'prod-3', name: 'Kitab 3' },
  ]));
  const mod2 = await server.ssrLoadModule('./src/store/productStore.ts');
  console.log('Reload after invalidateAll products length:', mod2.useProductStore.getState().products.length);

  await server.close();
}

test().catch(console.error);
