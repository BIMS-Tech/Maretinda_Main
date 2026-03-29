import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui/Loading';
import { getOrder } from '@/lib/orders';
import { capitalize, formatDate, formatPrice, orderStatusColor } from '@/lib/utils';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  if (isLoading) return <Loading />;
  if (!order)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    );

  const currencyCode = order.currency_code ?? 'PHP';

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center gap-3 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 flex-1">
          Order #{order.display_id}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View className="bg-white rounded-2xl p-5 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-gray-900">Order Status</Text>
            <Text className={`text-sm font-semibold capitalize ${orderStatusColor(order.status)}`}>
              {capitalize(order.status)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">Date Placed</Text>
            <Text className="text-sm text-gray-700">{formatDate(order.created_at)}</Text>
          </View>
          {order.fulfillment_status && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">Fulfillment</Text>
              <Text className={`text-sm font-medium capitalize ${orderStatusColor(order.fulfillment_status)}`}>
                {capitalize(order.fulfillment_status)}
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View className="bg-white rounded-2xl p-5 gap-4">
          <Text className="text-sm font-bold text-gray-900">Items</Text>
          {order.items?.map((item: any) => (
            <View key={item.id} className="flex-row gap-3">
              <Image
                source={{ uri: item.thumbnail || 'https://placehold.co/100x100/png' }}
                style={{ width: 56, height: 56, borderRadius: 10 }}
                contentFit="cover"
              />
              <View className="flex-1 gap-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                  {item.product_title}
                </Text>
                {item.variant_title && item.variant_title !== 'Default Variant' && (
                  <Text className="text-xs text-gray-400">{item.variant_title}</Text>
                )}
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-400">Qty: {item.quantity}</Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {formatPrice(item.unit_price * item.quantity, currencyCode)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Shipping address */}
        {order.shipping_address && (
          <View className="bg-white rounded-2xl p-5 gap-2">
            <Text className="text-sm font-bold text-gray-900">Shipped to</Text>
            <Text className="text-sm text-gray-500">
              {order.shipping_address.first_name} {order.shipping_address.last_name}
            </Text>
            <Text className="text-sm text-gray-500">
              {order.shipping_address.address_1}
              {order.shipping_address.address_2 ? `, ${order.shipping_address.address_2}` : ''}
            </Text>
            <Text className="text-sm text-gray-500">
              {order.shipping_address.city}, {order.shipping_address.province}{' '}
              {order.shipping_address.postal_code}
            </Text>
          </View>
        )}

        {/* Totals */}
        <View className="bg-white rounded-2xl p-5 gap-3">
          <Text className="text-sm font-bold text-gray-900">Payment Summary</Text>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-500">Total</Text>
            <Text className="text-sm font-bold text-primary">
              {formatPrice(order.total, currencyCode)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
