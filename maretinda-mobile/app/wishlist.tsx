import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/ProductCard';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/context/auth';
import { useRegion } from '@/context/region';
import { listWishlist, removeFromWishlist } from '@/lib/seller';

export default function WishlistScreen() {
  const router = useRouter();
  const { customer } = useAuth();
  const { region } = useRegion();
  const qc = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: listWishlist,
    enabled: !!customer,
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
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
        <Text className="text-lg font-bold text-gray-900">Wishlist</Text>
      </View>

      <FlatList
        data={products ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProductCard product={item} regionCurrencyCode={region?.currency_code} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-16 gap-3">
            <Ionicons name="heart-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400">Your wishlist is empty</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
