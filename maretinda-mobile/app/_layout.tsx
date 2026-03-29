import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

WebBrowser.maybeCompleteAuthSession();

import { AuthProvider } from '@/context/auth';
import { CartProvider } from '@/context/cart';
import { RegionProvider } from '@/context/region';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen
                name="product/[id]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="category/[handle]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="seller/[handle]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="checkout/index"
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="order/[id]"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="orders"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="wishlist"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="settings"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="addresses"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </CartProvider>
        </AuthProvider>
      </RegionProvider>
    </QueryClientProvider>
  );
}
