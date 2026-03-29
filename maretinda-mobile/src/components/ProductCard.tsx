import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  regionCurrencyCode?: string;
}

export function ProductCard({ product, regionCurrencyCode = 'PHP' }: ProductCardProps) {
  const router = useRouter();
  const price = product.variants?.[0]?.calculated_price;
  const formattedPrice = price
    ? formatPrice(price.calculated_amount, price.currency_code || regionCurrencyCode)
    : null;

  return (
    <Pressable
      className="bg-white rounded-2xl overflow-hidden shadow-sm active:opacity-80"
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <Image
        source={{ uri: product.thumbnail || 'https://placehold.co/400x400/png' }}
        style={{ width: '100%', aspectRatio: 1 }}
        contentFit="cover"
        transition={200}
      />
      <View className="p-3 gap-1">
        <Text className="text-xs text-gray-400" numberOfLines={1}>
          {product.collection?.title ?? product.categories?.[0]?.name ?? ''}
        </Text>
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
          {product.title}
        </Text>
        {formattedPrice && (
          <Text className="text-base font-bold text-primary">{formattedPrice}</Text>
        )}
      </View>
    </Pressable>
  );
}
