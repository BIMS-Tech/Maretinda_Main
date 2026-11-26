import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Rise } from '@/components/motion';
import { ProductListing } from '@/components/ProductListing';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { getSeller } from '@/lib/seller';
import { plainText } from '@/lib/product';
import { colors } from '@/theme';

export default function SellerScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const [broken, setBroken] = useState(false);
  const { data: seller, isLoading } = useQuery({
    enabled: !!handle,
    queryFn: () => getSeller(handle!),
    queryKey: ['seller', handle],
  });

  if (isLoading) return <Loading />;
  if (!seller) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <ScreenHeader title="Shop" />
        <EmptyState icon="storefront-outline" title="This shop isn't here">
          It may have closed, or its address may have changed.
        </EmptyState>
      </SafeAreaView>
    );
  }

  const about = plainText(seller.description);
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScreenHeader title={seller.name} />
      <ProductListing
        header={
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 14, paddingBottom: 6, paddingHorizontal: 16 }}>
            <Animated.View entering={ZoomIn.springify().damping(15)} style={{ alignItems: 'center', backgroundColor: colors.lilac, borderRadius: 999, height: 64, justifyContent: 'center', overflow: 'hidden', width: 64 }}>
              {seller.photo && !broken ? (
                <Image contentFit="cover" onError={() => setBroken(true)} source={{ uri: seller.photo }} style={{ height: 64, width: 64 }} transition={240} />
              ) : (
                <Text style={{ color: colors.purple, fontSize: 24, fontWeight: '700' }}>{seller.name?.[0]?.toUpperCase()}</Text>
              )}
            </Animated.View>
            <Rise delay={80} style={{ flex: 1 }}>
              {(seller as any).verification_status === 'verified' && (
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}>
                  <Ionicons color={colors.purple} name="checkmark-circle" size={15} />
                  <Text style={{ color: colors.purple, fontSize: 12.5, fontWeight: '700' }}>Verified shop</Text>
                </View>
              )}
              {about ? (
                <Text numberOfLines={2} style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                  {about}
                </Text>
              ) : null}
            </Rise>
          </View>
        }
        scope={{ seller: handle }}
      />
    </SafeAreaView>
  );
}
