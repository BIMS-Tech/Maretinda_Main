import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartItemRow } from '@/components/CartItemRow';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useCart } from '@/context/cart';
import { formatPrice } from '@/lib/utils';

export default function CartScreen() {
  const router = useRouter();
  const { cart, isLoading, updateItem, removeItem } = useCart();

  if (isLoading && !cart) return <Loading message="Loading cart…" />;

  const isEmpty = !cart || cart.items?.length === 0;
  const currencyCode = cart?.currency_code ?? 'PHP';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white px-5 py-4 border-b border-border">
        <Text className="text-xl font-bold text-gray-900">My Cart</Text>
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center gap-4">
          <Ionicons name="bag-outline" size={64} color="#d1d5db" />
          <Text className="text-lg font-semibold text-gray-500">
            Your cart is empty
          </Text>
          <Button
            title="Start Shopping"
            onPress={() => router.push('/')}
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onIncrease={() => updateItem(item.id, item.quantity + 1)}
                onDecrease={() => {
                  if (item.quantity > 1) updateItem(item.id, item.quantity - 1);
                  else removeItem(item.id);
                }}
                onRemove={() => removeItem(item.id)}
              />
            ))}

            {/* Order summary */}
            <View className="bg-white rounded-2xl p-5 mt-4 gap-3">
              <Text className="text-base font-bold text-gray-900">
                Order Summary
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Subtotal</Text>
                <Text className="font-medium">
                  {formatPrice(cart.subtotal ?? 0, currencyCode)}
                </Text>
              </View>
              {(cart.shipping_total ?? 0) > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Shipping</Text>
                  <Text className="font-medium">
                    {formatPrice(cart.shipping_total ?? 0, currencyCode)}
                  </Text>
                </View>
              )}
              <View className="h-px bg-border" />
              <View className="flex-row justify-between">
                <Text className="font-bold text-gray-900">Total</Text>
                <Text className="font-bold text-primary text-lg">
                  {formatPrice(cart.total ?? 0, currencyCode)}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Checkout CTA */}
          <View className="bg-white px-5 py-4 border-t border-border">
            <Button
              title={`Checkout · ${formatPrice(cart.total ?? 0, currencyCode)}`}
              size="lg"
              onPress={() => router.push('/checkout')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
