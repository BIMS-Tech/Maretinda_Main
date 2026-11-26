import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaskedText, Press, ProductGridSkeleton, Rise } from '@/components/motion';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/auth';
import { useRegion } from '@/context/region';
import { listCategories, searchProducts, type Sort } from '@/lib/products';
import { colors, groundOf } from '@/theme';
import type { ProductCardData } from '@/types';

const PROMISES = [
  { icon: 'cash-outline', text: 'Cash on delivery' },
  { icon: 'shield-checkmark-outline', text: 'Trusted local sellers' },
  { icon: 'cube-outline', text: 'Free shipping from ₱499' },
  { icon: 'refresh-outline', text: '7-day returns' },
];

function SectionTitle({ title, onAll }: { title: string; onAll?: () => void }) {
  return (
    <View style={{ alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, paddingHorizontal: 16 }}>
      <MaskedText style={{ color: colors.ink, fontSize: 24, lineHeight: 30 }} text={title} />
      {onAll && (
        <Press onPress={onAll} style={{ paddingBottom: 4 }}>
          <Text style={{ color: colors.purple, fontSize: 13.5, fontWeight: '700' }}>See all</Text>
        </Press>
      )}
    </View>
  );
}

/** A row of products to swipe through. */
function ProductRow({ title, sort, on_sale }: { title: string; sort: Sort; on_sale?: boolean }) {
  const router = useRouter();
  const { region } = useRegion();
  const { data } = useQuery({
    enabled: !!region?.id,
    queryFn: () => searchProducts({ in_stock: true, limit: 10, on_sale, regionId: region!.id, sort }),
    queryKey: ['home', sort, on_sale, region?.id],
  });
  if (!data?.products.length) return null;
  return (
    <View style={{ paddingTop: 30 }}>
      <SectionTitle onAll={() => router.push('/category/all')} title={title} />
      <ScrollView contentContainerStyle={{ gap: 14, paddingHorizontal: 16 }} decelerationRate="fast" horizontal showsHorizontalScrollIndicator={false} snapToInterval={170}>
        {data.products.map((p: ProductCardData, i: number) => (
          <Rise index={i} key={p.id} style={{ width: 156 }}>
            <ProductCard product={p} />
          </Rise>
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { region } = useRegion();
  const { customer } = useAuth();
  const [pulled, setPulled] = useState(false);

  const featured = useQuery({
    enabled: !!region?.id,
    queryFn: () => searchProducts({ in_stock: true, limit: 8, regionId: region!.id, sort: 'popular' }),
    queryKey: ['home', 'popular', region?.id],
  });
  const { data: categories } = useQuery({ queryFn: listCategories, queryKey: ['categories'] });
  const top = categories?.filter((c) => !c.parent_category_id).slice(0, 10) ?? [];

  // The banner slips behind the page as it scrolls
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  const behind = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 220], [1, 0.35], Extrapolation.CLAMP),
    transform: [{ translateY: y.value * 0.35 }, { scale: interpolate(y.value, [-160, 0], [1.25, 1], Extrapolation.CLAMP) }],
  }));

  const refresh = async () => {
    setPulled(true);
    await featured.refetch();
    setPulled(false);
  };

  return (
    <View style={{ backgroundColor: colors.cream, flex: 1 }}>
      <Animated.ScrollView onScroll={onScroll} refreshControl={<RefreshControl onRefresh={refresh} refreshing={pulled} tintColor={colors.yellow} />} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
          <Animated.View style={[{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, behind]}>
            <LinearGradient colors={[colors.purple, '#2A1B3E']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={{ flex: 1 }} />
          </Animated.View>
          <View style={{ gap: 18, paddingBottom: 26, paddingHorizontal: 20, paddingTop: insets.top + 10 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Image contentFit="contain" contentPosition="left" source={require('../../assets/logo.png')} style={{ height: 44, width: 128 }} />
              <Press accessibilityLabel="Wishlist" onPress={() => router.push(customer ? '/wishlist' : '/(auth)/login')} scale={0.88} style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, height: 42, justifyContent: 'center', width: 42 }}>
                <Ionicons color={colors.white} name="heart-outline" size={21} />
              </Press>
            </View>
            <View style={{ gap: 8 }}>
              <MaskedText style={{ color: colors.white, fontSize: 38, lineHeight: 44 }} text="Everything local, in one place." />
              <Rise delay={260}>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14.5, lineHeight: 21 }}>From palengke produce to fashion finds, from sellers across the Philippines.</Text>
              </Rise>
            </View>
            <Rise delay={340}>
              <Press accessibilityLabel="Search for products" accessibilityRole="search" onPress={() => router.push('/(tabs)/search')} scale={0.98} style={{ alignItems: 'center', backgroundColor: colors.white, borderRadius: 999, flexDirection: 'row', gap: 10, height: 50, paddingHorizontal: 18 }}>
                <Ionicons color={colors.purple} name="search" size={18} />
                <Text style={{ color: colors.faint, flex: 1, fontSize: 15 }}>Search for products</Text>
              </Press>
            </Rise>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingTop: 16 }} horizontal showsHorizontalScrollIndicator={false}>
          {PROMISES.map((p, i) => (
            <Rise index={i} key={p.text}>
              <View style={{ alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingVertical: 9 }}>
                <Ionicons color={colors.purple} name={p.icon as any} size={16} />
                <Text style={{ color: colors.ink, fontSize: 12.5, fontWeight: '600' }}>{p.text}</Text>
              </View>
            </Rise>
          ))}
        </ScrollView>

        {top.length > 0 && (
          <View style={{ paddingTop: 28 }}>
            <SectionTitle onAll={() => router.push('/category/all')} title="Shop by category" />
            <ScrollView contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }} horizontal showsHorizontalScrollIndicator={false}>
              {top.map((cat, i) => (
                <Rise index={i} key={cat.id}>
                  <Press onPress={() => router.push(`/category/${cat.handle}`)} style={{ backgroundColor: groundOf(cat.id), borderRadius: 22, height: 96, justifyContent: 'flex-end', padding: 14, width: 124 }}>
                    <Text numberOfLines={2} style={{ color: colors.purple, fontSize: 14.5, fontWeight: '700', lineHeight: 18 }}>
                      {cat.name}
                    </Text>
                  </Press>
                </Rise>
              ))}
            </ScrollView>
          </View>
        )}

        <ProductRow on_sale sort="discount" title="On sale now" />

        <View style={{ paddingTop: 30 }}>
          <SectionTitle onAll={() => router.push('/category/all')} title="Popular right now" />
          {featured.isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : featured.isError ? (
            <EmptyState action="Try again" icon="cloud-offline-outline" onPress={() => featured.refetch()} title="We couldn't load the shop">
              Check your connection and try again.
            </EmptyState>
          ) : (
            <View style={{ columnGap: 14, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, rowGap: 22 }}>
              {featured.data?.products.map((p, i) => (
                <Rise index={i} key={p.id} style={{ flexBasis: '46%', flexGrow: 1, maxWidth: '50%' }}>
                  <ProductCard product={p} />
                </Rise>
              ))}
            </View>
          )}
        </View>

        <ProductRow sort="newest" title="Just arrived" />
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}
