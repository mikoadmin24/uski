import { create } from 'zustand';
import { Profile, UserRole, Address } from '@/types';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  addresses: Address[];
  staffList: Profile[];
  loginAs: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => void;
  addAddress: (address: Omit<Address, 'id' | 'user_id'>) => void;
  deleteAddress: (id: string) => void;
  setPrimaryAddress: (id: string) => void;
  addStaff: (staff: Omit<Profile, 'id' | 'created_at'>) => void;
  updateStaffRole: (id: string, role: UserRole) => void;
  deleteStaff: (id: string) => void;
}

const initialStaff: Profile[] = [
  {
    id: 'staff-1',
    email: 'admin@uskistore.id',
    full_name: 'Ustadz Ahmad Farhan (Super Admin)',
    phone_number: '0859-6724-9718',
    role: 'super_admin',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'staff-manager',
    email: 'manager@uskistore.id',
    full_name: 'Hj. Siti Fatimah (Manajer Toko USKI)',
    phone_number: '0812-8899-7766',
    role: 'manager',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'staff-2',
    email: 'gudang@uskistore.id',
    full_name: 'Ridwan Kamil (Staf Inventaris & Gudang)',
    phone_number: '0813-9876-5432',
    role: 'staff',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'staff-3',
    email: 'cs@uskistore.id',
    full_name: 'Siti Nurhaliza (Kasir & Layanan CS)',
    phone_number: '0811-2233-4455',
    role: 'admin',
    created_at: '2026-02-01T00:00:00Z',
  },
];

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
  staffList: initialStaff,

  addStaff: (data) => {
    const newStaff: Profile = {
      ...data,
      id: `staff-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set({ staffList: [...get().staffList, newStaff] });
  },

  updateStaffRole: (id, role) => {
    set({
      staffList: get().staffList.map((s) => (s.id === id ? { ...s, role } : s)),
    });
  },

  deleteStaff: (id) => {
    set({
      staffList: get().staffList.filter((s) => s.id !== id),
    });
  },

  loginAs: (role: UserRole) => {
    let name = 'Pelanggan USKI';
    let email = 'customer@example.com';

    if (role === 'super_admin') {
      name = 'Ustadz Ahmad Farhan (Super Admin)';
      email = 'admin@uskistore.id';
    } else if (role === 'manager') {
      name = 'Hj. Siti Fatimah (Manajer Toko)';
      email = 'manager@uskistore.id';
    } else if (role === 'admin') {
      name = 'Siti Nurhaliza (Kasir & Layanan CS)';
      email = 'cs@uskistore.id';
    } else if (role === 'staff') {
      name = 'Ridwan Kamil (Staf Gudang & Inventaris)';
      email = 'gudang@uskistore.id';
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
