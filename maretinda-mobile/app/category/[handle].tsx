import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductListing } from '@/components/ProductListing';
import { ScreenHeader } from '@/components/ScreenHeader';
import { listCategories } from '@/lib/products';

export default function CategoryScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { data: categories } = useQuery({ queryFn: listCategories, queryKey: ['categories'] });
  const category = categories?.find((c) => c.handle === handle);
  const all = handle === 'all';

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title={all ? 'All products' : (category?.name ?? ' ')} />
      <ProductListing scope={all ? undefined : { category: handle }} />
    </SafeAreaView>
  );
}
