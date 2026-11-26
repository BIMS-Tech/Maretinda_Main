import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Press, Rise } from '@/components/motion';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/context/auth';
import { listOrders } from '@/lib/orders';
import { colors } from '@/theme';
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
      <ScreenHeader title="My orders" />

      <FlatList
        data={data?.orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, gap: 12, padding: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Rise index={index}>
          <Press onPress={() => router.push(`/order/${item.id}`)} scale={0.98} style={{ backgroundColor: colors.white, borderRadius: 22, gap: 12, padding: 18 }}>
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
          </Press>
          </Rise>
        )}
        ListEmptyComponent={
          <EmptyState action="Start shopping" icon="receipt-outline" onPress={() => router.push('/')} title="No orders yet">
            Once you place an order, it will appear here.
          </EmptyState>
        }
      />
    </SafeAreaView>
  );
}
