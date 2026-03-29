import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/ProductCard';
import { InlineLoading } from '@/components/ui/Loading';
import { useRegion } from '@/context/region';
import { listCategories, listProducts } from '@/lib/products';

export default function CategoryScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { region } = useRegion();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const category = categories?.find((c) => c.handle === handle);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['products', 'category', handle, region?.id],
      queryFn: ({ pageParam = 1 }) =>
        listProducts({
          regionId: region!.id,
          category_id: category?.id,
          pageParam: pageParam as number,
          limit: 12,
        }),
      getNextPageParam: (last) => last.nextPage ?? undefined,
      enabled: !!region?.id,
      initialPageParam: 1,
    });

  const products = data?.pages.flatMap((p) => p.products) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center gap-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center rounded-full bg-surface">
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 flex-1">
          {category?.name ?? (handle === 'all' ? 'All Products' : handle)}
        </Text>
      </View>

      {isLoading ? (
        <InlineLoading />
      ) : (
        <FlatList
          data={products}
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
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#5B1072" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-16">
              <Text className="text-gray-400">No products in this category</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
