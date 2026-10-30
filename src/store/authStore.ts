import { create } from 'zustand';
import { Profile, UserRole, Address } from '@/types';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  addresses: Address[];
  loginAs: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  addAddress: (address: Omit<Address, 'id' | 'user_id'>) => void;
  deleteAddress: (id: string) => void;
  setPrimaryAddress: (id: string) => void;
}

const defaultAddresses: Address[] = [
  {
    id: 'addr-default-1',
    user_id: 'usr-default',
    recipient_name: 'Budi Santoso',
    phone_number: '081234567890',
    street_address: 'Jl. Margonda Raya No. 102, Beji',
    district: 'Beji',
    city: 'Kota Depok',
    province: 'Jawa Barat',
    postal_code: '16424',
    is_primary: true,
  },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: 'usr-1',
    email: 'admin@uskistore.id',
    full_name: 'Super Admin USKI',
    role: 'super_admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    created_at: '2026-01-01T00:00:00Z',
  },
  isAuthenticated: true,
  addresses: defaultAddresses,

  loginAs: (role: UserRole) => {
    let name = 'Pelanggan USKI';
    let email = 'customer@example.com';

    if (role === 'super_admin' || role === 'admin') {
      name = 'Super Admin USKI';
      email = 'admin@uskistore.id';
    } else if (role === 'staff') {
      name = 'Staf Operasional Toko';
      email = 'staff@uskistore.id';
    } else if (role === 'courier') {
      name = 'Kurir Toko USKI';
      email = 'courier@uskistore.id';
    }

    set({
      user: {
        id: `usr-${role}`,
        email,
        full_name: name,
        role,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        created_at: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (data) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },

  addAddress: (newAddr) => {
    const address: Address = {
      ...newAddr,
      id: `addr-${Date.now()}`,
      user_id: get().user?.id || 'guest',
      is_primary: get().addresses.length === 0 ? true : newAddr.is_primary,
    };

    let updated = [...get().addresses];
    if (address.is_primary) {
      updated = updated.map((a) => ({ ...a, is_primary: false }));
    }
    updated.push(address);
    set({ addresses: updated });
  },

  deleteAddress: (id) => {
    set({ addresses: get().addresses.filter((a) => a.id !== id) });
  },

  setPrimaryAddress: (id) => {
    set({
      addresses: get().addresses.map((a) => ({
        ...a,
        is_primary: a.id === id,
      })),
    });
  },
}));
