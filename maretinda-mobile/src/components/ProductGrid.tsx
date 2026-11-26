import React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Rise } from '@/components/motion';
import { ProductCard } from '@/components/ProductCard';
import { colors } from '@/theme';
import type { ProductCardData } from '@/types';

/** Products in two columns, each arriving just after the one before it. */
export function ProductGrid({
  products,
  header,
  empty,
  onEnd,
  loadingMore,
  onRemove,
  refreshKey,
}: {
  products: ProductCardData[];
  header?: React.ReactElement | null;
  empty?: React.ReactElement;
  onEnd?: () => void;
  loadingMore?: boolean;
  onRemove?: (product: ProductCardData) => void;
  /** A new one starts the list again from the top */
  refreshKey?: string;
}) {
  return (
    <FlatList
      columnWrapperStyle={{ gap: 14, paddingHorizontal: 16 }}
      contentContainerStyle={{ flexGrow: 1, gap: 20, paddingBottom: 32 }}
      data={products}
      key={refreshKey}
      keyExtractor={(p) => p.id}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={empty}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.purple} style={{ marginVertical: 16 }} /> : null}
      ListHeaderComponent={header}
      numColumns={2}
      onEndReached={onEnd}
      onEndReachedThreshold={0.6}
      renderItem={({ item, index }) => (
        <Rise index={index % 8} layout style={{ flex: 1, maxWidth: '50%' }}>
          <ProductCard onRemove={onRemove && (() => onRemove(item))} product={item} />
        </Rise>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
