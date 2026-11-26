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
import { startShopping as startShoppingFn } from '@/lib/auth';
import type { LoginParams, RegisterParams } from '@/lib/auth';
import { transferCart } from '@/lib/cart';
import { statusOf } from '@/lib/client';
import { isShopperToken } from '@/lib/session';
import { getToken, removeToken } from '@/lib/storage';
import type { Customer } from '@/types';

interface AuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  /** Adds a shopping account to a seller's sign-in and opens it */
  startShopping: (signIn: string) => Promise<void>;
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
      // A token no shopper account answers to is no session at all
      if (token && !isShopperToken(token)) await removeToken();
      if (!isShopperToken(token)) {
        setCustomer(null);
        return;
      }
      const c = await getCustomer();
      setCustomer(c);
    } catch (err) {
      if (statusOf(err) === 401) await removeToken();
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

  const startShopping = useCallback(
    async (signIn: string) => {
      const token = await startShoppingFn(signIn);
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
      value={{ customer, isLoading, login, logout, refreshCustomer, register, startShopping }}
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
