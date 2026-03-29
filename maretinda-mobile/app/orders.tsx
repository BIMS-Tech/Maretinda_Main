import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/context/auth';
import { listOrders } from '@/lib/orders';
import { capitalize, formatDate, formatPrice, orderStatusColor } from '@/lib/utils';

export default function OrdersScreen() {
  const router = useRouter();
  const { customer } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => listOrders(),
    enabled: !!customer,
  });

  if (isLoading) return <Loading />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="bg-white px-5 py-4 flex-row items-center gap-3 border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-surface"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">My Orders</Text>
      </View>

      <FlatList
        data={data?.orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/order/${item.id}`)}
            className="bg-white rounded-2xl p-5 gap-3 active:opacity-80"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-900">
                Order #{item.display_id}
              </Text>
              <Text className={`text-xs font-semibold capitalize ${orderStatusColor(item.status)}`}>
                {capitalize(item.status)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">{formatDate(item.created_at)}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-500">
                {item.items?.length ?? 0} item{item.items?.length !== 1 ? 's' : ''}
              </Text>
              <Text className="text-sm font-bold text-primary">
                {formatPrice(item.total, item.currency_code ?? 'PHP')}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-16 gap-3">
            <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400">No orders yet</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
