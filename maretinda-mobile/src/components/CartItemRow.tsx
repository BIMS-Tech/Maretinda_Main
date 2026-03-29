import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatPrice } from '@/lib/utils';
import type { CartLineItem } from '@/types';

interface CartItemRowProps {
  item: CartLineItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemRowProps) {
  const currencyCode = 'PHP';

  return (
    <View className="flex-row gap-3 py-4 border-b border-border">
      <Image
        source={{ uri: item.thumbnail || item.variant?.product?.thumbnail || 'https://placehold.co/200x200/png' }}
        style={{ width: 80, height: 80, borderRadius: 12 }}
        contentFit="cover"
      />
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
          {item.product_title ?? item.variant?.product?.title}
        </Text>
        {item.variant_title && item.variant_title !== 'Default Variant' && (
          <Text className="text-xs text-gray-400">{item.variant_title}</Text>
        )}
        <Text className="text-sm font-bold text-primary">
          {formatPrice(item.unit_price, currencyCode)}
        </Text>
        <View className="flex-row items-center gap-3 mt-1">
          <Pressable
            onPress={onDecrease}
            className="w-7 h-7 rounded-full border border-border items-center justify-center"
          >
            <Ionicons name="remove" size={16} color="#374151" />
          </Pressable>
          <Text className="text-sm font-semibold w-5 text-center">
            {item.quantity}
          </Text>
          <Pressable
            onPress={onIncrease}
            className="w-7 h-7 rounded-full border border-border items-center justify-center"
          >
            <Ionicons name="add" size={16} color="#374151" />
          </Pressable>
          <Pressable onPress={onRemove} className="ml-auto">
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
