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
import { ToastProvider } from '@/context/toast';

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
  const [loaded, failed] = useFonts({ DMSerifDisplay_400Regular: require('../assets/fonts/DMSerifDisplay-Regular.ttf') });

  useEffect(() => {
    // Without the heading font the app still opens, in the phone's own
    if (loaded || failed) {
      SplashScreen.hideAsync();
    }
  }, [loaded, failed]);

  if (!loaded && !failed) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <RegionProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
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
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </RegionProvider>
    </QueryClientProvider>
  );
}
