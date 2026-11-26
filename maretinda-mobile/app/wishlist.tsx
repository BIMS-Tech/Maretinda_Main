import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductGridSkeleton } from '@/components/motion';
import { ProductGrid } from '@/components/ProductGrid';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { getErrorMessage } from '@/lib/client';
import { toCard } from '@/lib/product';
import { addToWishlist, listWishlist, removeFromWishlist } from '@/lib/seller';
import type { Product, ProductCardData } from '@/types';

export default function WishlistScreen() {
  const router = useRouter();
  const notify = useToast();
  const client = useQueryClient();
  const { customer } = useAuth();
  const { data, isLoading } = useQuery<Product[]>({ enabled: !!customer, queryFn: listWishlist, queryKey: ['wishlist'] });
  const products = (data ?? []).map(toCard);

  async function remove(product: ProductCardData) {
    const before = data;
    client.setQueryData<Product[]>(['wishlist'], (list) => list?.filter((p) => p.id !== product.id));
    try {
      await removeFromWishlist(product.id);
      notify('Removed from your wishlist', {
        action: {
          label: 'Undo',
          onPress: () => {
            client.setQueryData(['wishlist'], before);
            addToWishlist(product.id)
              .catch((err) => notify(getErrorMessage(err), { tone: 'error' }))
              .finally(() => client.invalidateQueries({ queryKey: ['wishlist'] }));
          },
        },
      });
    } catch (err) {
      client.setQueryData(['wishlist'], before);
      notify(getErrorMessage(err), { tone: 'error' });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader note={products.length ? `${products.length} saved` : undefined} title="Wishlist" />
      {isLoading ? (
        <ProductGridSkeleton />
      ) : (
        <ProductGrid
          empty={
            <EmptyState action="Find something you love" icon="heart-outline" onPress={() => router.push('/')} title="Your wishlist is empty">
              Tap the heart on anything you like and it will be kept here.
            </EmptyState>
          }
          onRemove={remove}
          products={products}
        />
      )}
    </SafeAreaView>
  );
}
