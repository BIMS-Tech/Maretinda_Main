import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ProductCard } from '@/components/ProductCard';
import { InlineLoading } from '@/components/ui/Loading';
import { useRegion } from '@/context/region';
import { listCategories, listProducts } from '@/lib/products';

export default function HomeScreen() {
  const router = useRouter();
  const { region } = useRegion();

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'featured', region?.id],
    queryFn: () =>
      listProducts({ regionId: region!.id, limit: 8 }),
    enabled: !!region?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const topCategories = categories?.filter((c) => !c.parent_category_id).slice(0, 6) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-3 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-xl font-bold text-gray-900">Maretinda</Text>
              <Text className="text-xs text-gray-400">
                {region?.name ?? 'Philippines'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/cart')}
              className="w-10 h-10 items-center justify-center rounded-full bg-surface"
            >
              <Ionicons name="bag-outline" size={22} color="#374151" />
            </Pressable>
          </View>

          {/* Search bar (tappable redirect) */}
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3"
          >
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <Text className="text-gray-400 flex-1">Search products…</Text>
          </Pressable>
        </View>

        {/* Categories */}
        {topCategories.length > 0 && (
          <View className="mt-4">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text className="text-base font-bold text-gray-900">Categories</Text>
              <Pressable onPress={() => router.push('/category/all')}>
                <Text className="text-sm text-primary">See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {topCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/category/${cat.handle}`)}
                  className="bg-white rounded-2xl px-4 py-3 items-center shadow-sm min-w-[80px]"
                >
                  <Text className="text-sm font-medium text-gray-700 text-center" numberOfLines={2}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900">
              Featured Products
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/search')}>
              <Text className="text-sm text-primary">See all</Text>
            </Pressable>
          </View>

          {loadingProducts ? (
            <InlineLoading />
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {productsData?.products.map((product) => (
                <View key={product.id} style={{ width: '47.5%' }}>
                  <ProductCard
                    product={product}
                    regionCurrencyCode={region?.currency_code}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
