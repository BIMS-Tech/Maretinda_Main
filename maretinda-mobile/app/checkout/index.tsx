import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/context/cart';
import {
  addShippingAddress,
  completeCart,
} from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { getCartId } from '@/lib/storage';

interface AddressForm {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, refreshCart } = useCart();
  const [step, setStep] = useState<'address' | 'review'>('address');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AddressForm>({
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    province: '',
    postal_code: '',
    country_code: 'PH',
    phone: '',
  });

  function update(field: keyof AddressForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleContinue() {
    if (!form.first_name || !form.last_name || !form.address_1 || !form.city) {
      setError('Please fill in required fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const cartId = await getCartId();
      if (!cartId) throw new Error('No cart found');
      await addShippingAddress(cartId, form as unknown as Record<string, unknown>);
      await refreshCart();
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    setLoading(true);
    try {
      const cartId = await getCartId();
      if (!cartId) throw new Error('No cart found');
      const result = await completeCart(cartId);
      const orderId = result?.order?.id ?? result?.order_set?.id;
      if (orderId) {
        router.replace(`/order/${orderId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  const currencyCode = cart?.currency_code ?? 'PHP';

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className="bg-white px-5 py-4 flex-row items-center gap-3 border-b border-border">
          <Pressable onPress={() => (step === 'review' ? setStep('address') : router.back())} className="w-9 h-9 items-center justify-center rounded-full bg-surface">
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">
            {step === 'address' ? 'Shipping Address' : 'Review Order'}
          </Text>
        </View>

        {/* Step indicator */}
        <View className="bg-white px-5 py-3 flex-row items-center gap-2 border-b border-border">
          <View className={`h-1 flex-1 rounded-full ${step === 'address' || step === 'review' ? 'bg-primary' : 'bg-border'}`} />
          <View className={`h-1 flex-1 rounded-full ${step === 'review' ? 'bg-primary' : 'bg-border'}`} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'address' ? (
            <>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="First name *" value={form.first_name} onChangeText={(v) => update('first_name', v)} />
                </View>
                <View className="flex-1">
                  <Input label="Last name *" value={form.last_name} onChangeText={(v) => update('last_name', v)} />
                </View>
              </View>
              <Input label="Address *" placeholder="House no., Street, Barangay" value={form.address_1} onChangeText={(v) => update('address_1', v)} />
              <Input label="City *" value={form.city} onChangeText={(v) => update('city', v)} />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Province" value={form.province} onChangeText={(v) => update('province', v)} />
                </View>
                <View className="flex-1">
                  <Input label="ZIP Code" keyboardType="numeric" value={form.postal_code} onChangeText={(v) => update('postal_code', v)} />
                </View>
              </View>
              <Input label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} />
              {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
            </>
          ) : (
            <>
              {/* Address review */}
              <View className="bg-white rounded-2xl p-5 gap-2">
                <Text className="text-sm font-bold text-gray-900">Shipping to</Text>
                <Text className="text-sm text-gray-500">
                  {form.first_name} {form.last_name}
                </Text>
                <Text className="text-sm text-gray-500">
                  {form.address_1}, {form.city}, {form.province} {form.postal_code}
                </Text>
                {form.phone ? <Text className="text-sm text-gray-500">{form.phone}</Text> : null}
              </View>

              {/* Order items */}
              <View className="bg-white rounded-2xl p-5 gap-3">
                <Text className="text-sm font-bold text-gray-900">Items</Text>
                {cart?.items?.map((item) => (
                  <View key={item.id} className="flex-row justify-between">
                    <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>
                      {item.product_title} × {item.quantity}
                    </Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {formatPrice(item.total, currencyCode)}
                    </Text>
                  </View>
                ))}
                <View className="h-px bg-border" />
                <View className="flex-row justify-between">
                  <Text className="font-bold text-gray-900">Total</Text>
                  <Text className="font-bold text-primary">
                    {formatPrice(cart?.total ?? 0, currencyCode)}
                  </Text>
                </View>
              </View>

              {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

              <Text className="text-xs text-gray-400 text-center">
                Payment will be collected upon delivery (COD) or via Stripe after order placement.
              </Text>
            </>
          )}
        </ScrollView>

        <View className="bg-white border-t border-border px-5 py-4">
          {step === 'address' ? (
            <Button title="Continue to Review" size="lg" loading={loading} onPress={handleContinue} />
          ) : (
            <Button title="Place Order" size="lg" loading={loading} onPress={handlePlaceOrder} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
