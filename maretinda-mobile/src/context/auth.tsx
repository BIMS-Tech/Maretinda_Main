import { useRouter } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getCustomer,
  login as loginFn,
  logout as logoutFn,
  register as registerFn,
} from '@/lib/auth';
import type { LoginParams, RegisterParams } from '@/lib/auth';
import { transferCart } from '@/lib/cart';
import { getToken } from '@/lib/storage';
import type { Customer } from '@/types';

interface AuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshCustomer = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setCustomer(null);
        return;
      }
      const c = await getCustomer();
      setCustomer(c);
    } catch {
      setCustomer(null);
    }
  }, []);

  useEffect(() => {
    refreshCustomer().finally(() => setIsLoading(false));
  }, [refreshCustomer]);

  const login = useCallback(
    async (params: LoginParams) => {
      const token = await loginFn(params);
      await transferCart(token);
      await refreshCustomer();
      router.replace('/(tabs)');
    },
    [refreshCustomer, router],
  );

  const register = useCallback(
    async (params: RegisterParams) => {
      const token = await registerFn(params);
      await transferCart(token);
      await refreshCustomer();
      router.replace('/(tabs)');
    },
    [refreshCustomer, router],
  );

  const logout = useCallback(async () => {
    await logoutFn();
    setCustomer(null);
    router.replace('/(auth)/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ customer, isLoading, login, register, logout, refreshCustomer }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
