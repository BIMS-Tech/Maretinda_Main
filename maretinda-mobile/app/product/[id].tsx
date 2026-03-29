import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useCart } from '@/context/cart';
import { useRegion } from '@/context/region';
import { getProduct } from '@/lib/products';
import { listProductReviews } from '@/lib/seller';
import { formatPrice } from '@/lib/utils';
import type { ProductVariant } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { region } = useRegion();
  const { addToCart, isLoading: cartLoading } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id, region?.id],
    queryFn: () => getProduct(id!, region!.id),
    enabled: !!id && !!region?.id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'product', id],
    queryFn: () => listProductReviews(id!),
    enabled: !!id,
  });

  if (isLoading || !product) return <Loading />;

  const images = product.images?.length ? product.images : [{ url: product.thumbnail }];
  const selectedVariant: ProductVariant | undefined =
    product.variants?.find((v: ProductVariant) => v.id === selectedVariantId) ??
    product.variants?.[0];

  const price = selectedVariant?.calculated_price;
  const hasMultipleVariants = product.variants?.length > 1;

  async function handleAddToCart() {
    if (!selectedVariant) return;
    await addToCart(selectedVariant.id);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-12 left-4 z-10 w-9 h-9 bg-white/90 rounded-full items-center justify-center shadow-sm"
      >
        <Ionicons name="arrow-back" size={20} color="#374151" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentImage(idx);
          }}
          scrollEventThrottle={16}
        >
          {images.map((img: { url: string }, i: number) => (
            <Image
              key={i}
              source={{ uri: img.url }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {/* Image dots */}
        {images.length > 1 && (
          <View className="flex-row justify-center gap-1.5 mt-2">
            {images.map((_: unknown, i: number) => (
              <View
                key={i}
                className={`rounded-full ${currentImage === i ? 'w-4 h-2 bg-primary' : 'w-2 h-2 bg-gray-300'}`}
              />
            ))}
          </View>
        )}

        <View className="px-5 pt-4 pb-8 gap-4">
          {/* Title & price */}
          <View className="gap-1">
            {product.collection && (
              <Text className="text-xs text-gray-400 uppercase tracking-wide">
                {product.collection.title}
              </Text>
            )}
            <Text className="text-xl font-bold text-gray-900">{product.title}</Text>
            {price && (
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-primary">
                  {formatPrice(price.calculated_amount, price.currency_code)}
                </Text>
                {price.original_amount > price.calculated_amount && (
                  <Text className="text-base text-gray-400 line-through">
                    {formatPrice(price.original_amount, price.currency_code)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Seller */}
          {product.seller && (
            <Pressable
              onPress={() => router.push(`/seller/${product.seller.handle}`)}
              className="flex-row items-center gap-2"
            >
              <Ionicons name="storefront-outline" size={16} color="#9ca3af" />
              <Text className="text-sm text-primary font-medium">
                {product.seller.name}
              </Text>
            </Pressable>
          )}

          {/* Variants */}
          {hasMultipleVariants && product.options?.map((opt: any) => (
            <View key={opt.id} className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">{opt.title}</Text>
              <View className="flex-row flex-wrap gap-2">
                {product.variants
                  ?.filter((v: ProductVariant) =>
                    v.options?.some((o: any) => o.option?.title === opt.title),
                  )
                  .map((v: ProductVariant) => {
                    const optValue = v.options?.find(
                      (o: any) => o.option?.title === opt.title,
                    )?.value;
                    const isSelected = selectedVariantId === v.id || (!selectedVariantId && product.variants?.[0]?.id === v.id);
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => setSelectedVariantId(v.id)}
                        className={`px-4 py-2 rounded-xl border ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? 'text-primary' : 'text-gray-700'
                          }`}
                        >
                          {optValue}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </View>
          ))}

          {/* Description */}
          {product.description && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-700">Description</Text>
              <Text className="text-sm text-gray-500 leading-relaxed">
                {product.description}
              </Text>
            </View>
          )}

          {/* Reviews preview */}
          {reviews && reviews.length > 0 && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-gray-700">
                Reviews ({reviews.length})
              </Text>
              {reviews.slice(0, 2).map((rev: any) => (
                <View key={rev.id} className="bg-surface rounded-xl p-4 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-800">
                      {rev.customer?.first_name} {rev.customer?.last_name}
                    </Text>
                    <StarRating rating={rev.rating} />
                  </View>
                  {rev.customer_note && (
                    <Text className="text-sm text-gray-500">{rev.customer_note}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to cart */}
      <View className="bg-white border-t border-border px-5 py-4">
        <Button
          title={addedToCart ? 'Added to Cart!' : 'Add to Cart'}
          size="lg"
          loading={cartLoading}
          onPress={handleAddToCart}
        />
      </View>
    </SafeAreaView>
  );
}
