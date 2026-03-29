import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  addToCart as addToCartFn,
  getCart,
  removeCartItem as removeCartItemFn,
  updateCartItem as updateCartItemFn,
} from '@/lib/cart';
import type { Cart } from '@/types';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const c = await getCart();
      setCart(c);
    } catch {
      setCart(null);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true);
      try {
        const updated = await addToCartFn(variantId, quantity);
        setCart(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      setIsLoading(true);
      try {
        const updated = await updateCartItemFn(lineItemId, quantity);
        setCart(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const removeItem = useCallback(async (lineItemId: string) => {
    setIsLoading(true);
    try {
      const updated = await removeCartItemFn(lineItemId);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const itemCount =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        addToCart,
        updateItem,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
