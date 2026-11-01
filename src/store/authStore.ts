import { create } from 'zustand';
import { Profile, UserRole, Address } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  addresses: Address[];
  staffList: Profile[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  loginAs: (role: UserRole) => void;
  logout: () => Promise<void>;
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

const AUTH_STORAGE_KEY = 'uski_auth_user_v1';

const getInitialUserState = (): { user: Profile | null; isAuthenticated: boolean } => {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      if (saved === 'logged_out') {
        return { user: null, isAuthenticated: false };
      }
      const parsed = JSON.parse(saved);
      // Clean up legacy mock dummy session 'usr-1' or 'admin@uskistore.id'
      if (parsed && (parsed.id === 'usr-1' || parsed.email === 'admin@uskistore.id')) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return { user: null, isAuthenticated: false };
      }
      if (parsed && parsed.id) {
        return { user: parsed, isAuthenticated: true };
      }
    }
  } catch {
    // fallback
  }

  // Production Default: Guests are NOT automatically logged in
  return {
    user: null,
    isAuthenticated: false,
  };
};

const initialAuth = getInitialUserState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialAuth.user,
  isAuthenticated: initialAuth.isAuthenticated,
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

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!normalizedEmail || !cleanPassword) {
      return { success: false, error: 'Email dan kata sandi wajib diisi.' };
    }

    // 1. Supabase Auth Verification (Real credentials)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: cleanPassword,
        });

        if (error || !data.user) {
          // STRICT REJECTION: Do NOT fall through to mock login on invalid credentials!
          const errorMsg =
            error?.message === 'Invalid login credentials'
              ? 'Email atau kata sandi salah. Silakan periksa kembali kredensial Anda.'
              : error?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
          return { success: false, error: errorMsg };
        }

        // Successfully authenticated against Supabase Auth
        const userMeta = data.user.user_metadata || {};
        const staffMatch = get().staffList.find(
          (s) => s.email.toLowerCase() === normalizedEmail
        );

        const role: UserRole =
          (userMeta.role as UserRole) ||
          (staffMatch ? staffMatch.role : normalizedEmail.includes('admin') ? 'super_admin' : 'customer');

        const authenticatedUser: Profile = {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          full_name: userMeta.full_name || staffMatch?.full_name || normalizedEmail.split('@')[0],
          phone_number: userMeta.phone || staffMatch?.phone_number || undefined,
          role,
          avatar_url:
            staffMatch?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          created_at: data.user.created_at || new Date().toISOString(),
        };

        set({ user: authenticatedUser, isAuthenticated: true });
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
        } catch {
          // ignore
        }
        return { success: true };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Terjadi gangguan jaringan saat otentikasi ke server Supabase.',
        };
      }
    }

    // 2. Offline / Demo Mode fallback (ONLY if Supabase client is not configured)
    const staffMatch = get().staffList.find(
      (s) => s.email.toLowerCase() === normalizedEmail
    );

    if (staffMatch) {
      if (cleanPassword !== 'password123') {
        return { success: false, error: 'Kata sandi salah. (Kata sandi staf demo: password123)' };
      }
      set({ user: staffMatch, isAuthenticated: true });
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(staffMatch));
      } catch {
        // ignore
      }
      return { success: true };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter.' };
    }

    const demoCustomer: Profile = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      full_name: normalizedEmail.split('@')[0],
      role: 'customer',
      created_at: new Date().toISOString(),
    };

    set({ user: demoCustomer, isAuthenticated: true });
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoCustomer));
    } catch {
      // ignore
    }
    return { success: true };
  },

  register: async ({
    email,
    password,
    fullName,
    phone,
  }): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();
    const cleanPhone = phone?.trim();

    if (!normalizedEmail || !cleanPassword || !cleanName) {
      return { success: false, error: 'Harap lengkapi semua bidang wajib.' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              role: 'customer',
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const userId = data.user?.id || `usr-${Date.now()}`;
        const newUser: Profile = {
          id: userId,
          email: normalizedEmail,
          full_name: cleanName,
          phone_number: cleanPhone || undefined,
          role: 'customer',
          created_at: data.user?.created_at || new Date().toISOString(),
        };

        set({ user: newUser, isAuthenticated: true });
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        } catch {
          // ignore
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Gagal mendaftar akun ke Supabase.' };
      }
    }

    const localUser: Profile = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      full_name: cleanName,
      phone_number: cleanPhone || undefined,
      role: 'customer',
      created_at: new Date().toISOString(),
    };

    set({ user: localUser, isAuthenticated: true });
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(localUser));
    } catch {
      // ignore
    }
    return { success: true };
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'logged_out');
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false });
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

    const switchedUser: Profile = {
      id: `usr-${role}`,
      email,
      full_name: name,
      role,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      created_at: '2026-01-01T00:00:00Z',
    };

    set({
      user: switchedUser,
      isAuthenticated: true,
    });
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(switchedUser));
    } catch {
      // ignore
    }
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
