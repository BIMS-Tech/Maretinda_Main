import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProductCard } from '@/components/ProductCard';
import { InlineLoading } from '@/components/ui/Loading';
import { useRegion } from '@/context/region';
import { listProducts } from '@/lib/products';

function useLocalDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const { region } = useRegion();
  const [query, setQuery] = useState('');
  const debouncedQuery = useLocalDebounce(query, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', 'search', debouncedQuery, region?.id],
    queryFn: () =>
      listProducts({
        regionId: region!.id,
        q: debouncedQuery || undefined,
        limit: 20,
      }),
    enabled: !!region?.id,
  });

  const products = data?.products ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Search bar */}
      <View className="bg-white px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3 bg-surface rounded-xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search products…"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color="#9ca3af"
              onPress={() => setQuery('')}
            />
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading || isFetching ? (
        <InlineLoading />
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Ionicons name="search-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-base">
            {debouncedQuery ? 'No products found' : 'Start typing to search'}
          </Text>
        </View>
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
              <ProductCard
                product={item}
                regionCurrencyCode={region?.currency_code}
              />
            </View>
          )}
          ListFooterComponent={() => (
            <Text className="text-center text-xs text-gray-400 py-4">
              {data?.count} product{data?.count !== 1 ? 's' : ''} found
            </Text>
          )}
        />
      )}
    </SafeAreaView>
  );
}
