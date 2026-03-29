import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/ProductCard';
import { StarRating } from '@/components/StarRating';
import { Loading } from '@/components/ui/Loading';
import { useRegion } from '@/context/region';
import { listProducts } from '@/lib/products';
import { getSeller, listSellerReviews } from '@/lib/seller';

export default function SellerScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { region } = useRegion();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['seller', handle],
    queryFn: () => getSeller(handle!),
    enabled: !!handle,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'seller', seller?.id, region?.id],
    queryFn: () =>
      listProducts({
        regionId: region!.id,
        limit: 20,
      }),
    enabled: !!seller?.id && !!region?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'seller', seller?.id],
    queryFn: () => listSellerReviews(seller!.id),
    enabled: !!seller?.id,
  });

  if (isLoading) return <Loading />;
  if (!seller)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Seller not found</Text>
      </View>
    );

  const products = productsData?.products ?? [];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 24 }}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {/* Back */}
            <View className="bg-white px-5 py-4 flex-row items-center gap-3 border-b border-border">
              <Pressable
                onPress={() => router.back()}
                className="w-9 h-9 items-center justify-center rounded-full bg-surface"
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </Pressable>
              <Text className="text-lg font-bold text-gray-900 flex-1">Seller</Text>
            </View>

            {/* Seller info */}
            <View className="bg-white px-5 py-6 gap-4">
              <View className="flex-row items-center gap-4">
                {seller.photo ? (
                  <Image
                    source={{ uri: seller.photo }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="storefront-outline" size={28} color="#5B1072" />
                  </View>
                )}
                <View className="flex-1 gap-1">
                  <Text className="text-xl font-bold text-gray-900">{seller.name}</Text>
                  {seller.rating && (
                    <View className="flex-row items-center gap-2">
                      <StarRating rating={seller.rating} />
                      <Text className="text-sm text-gray-500">
                        ({seller.review_count ?? reviews?.length ?? 0} reviews)
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {seller.description && (
                <Text className="text-sm text-gray-500">{seller.description}</Text>
              )}
            </View>

            {/* Products header */}
            <View className="px-5 pt-5 pb-3">
              <Text className="text-base font-bold text-gray-900">
                Products ({products.length})
              </Text>
            </View>
          </>
        )}
        renderItem={({ item, index }) => (
          <View style={{ flex: 1, marginTop: 12, marginLeft: index % 2 === 0 ? 0 : 0 }}>
            <ProductCard product={item} regionCurrencyCode={region?.currency_code} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
