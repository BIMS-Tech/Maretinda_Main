import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, FadeIn, FadeInUp, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CountUp, EASE_OUT, Press, Rise, SPRING } from '@/components/motion';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/context/auth';
import { useCart } from '@/context/cart';
import { useRegion } from '@/context/region';
import { useToast } from '@/context/toast';
import { getErrorMessage } from '@/lib/client';
import { type Choice, choiceOf, openingVariant, pickValue, plainText, variantFor, variantInStock } from '@/lib/product';
import { getProduct } from '@/lib/products';
import { addToWishlist, listWishlist, removeFromWishlist } from '@/lib/seller';
import { formatPrice } from '@/lib/utils';
import { colors, groundOf, serif } from '@/theme';
import type { Product, ProductVariant } from '@/types';

function Dot({ on }: { on: boolean }) {
  const style = useAnimatedStyle(() => ({ opacity: withSpring(on ? 1 : 0.28, SPRING), width: withSpring(on ? 22 : 7, SPRING) }));
  return <Animated.View style={[{ backgroundColor: colors.purple, borderRadius: 999, height: 7 }, style]} />;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { region } = useRegion();

  const { data: product, isLoading, isError, refetch } = useQuery<Product>({
    enabled: !!id && !!region?.id,
    queryFn: () => getProduct(id!, region!.id),
    queryKey: ['product', id, region?.id],
  });

  if (isLoading) return <Loading />;
  if (!product || isError) {
    return (
      <View style={{ backgroundColor: colors.cream, flex: 1, paddingTop: insets.top }}>
        <EmptyState action="Try again" icon="cube-outline" onPress={() => refetch()} title="We couldn't open this product">
          It may have been taken down, or the connection dropped.
        </EmptyState>
      </View>
    );
  }

  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const router = useRouter();
  const notify = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { addToCart } = useCart();

  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  // The picture follows at half the speed of the page
  const behind = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(y.value, [-200, 0, 400], [-70, 0, 140], Extrapolation.CLAMP) }, { scale: interpolate(y.value, [-200, 0], [1.3, 1], Extrapolation.CLAMP) }],
  }));
  const [shown, setShown] = useState(0);
  const images = product.images?.length ? product.images.map((i) => i.url) : product.thumbnail ? [product.thumbnail] : [];

  const variants = product.variants ?? [];
  const [choice, setChoice] = useState<Choice>(() => choiceOf(openingVariant(variants)));
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const variant = variants.length === 1 ? variants[0] : variantFor(variants, choice);
  const price = variant?.calculated_price;
  const inStock = !!variant && variantInStock(variant);
  const canBuy = inStock && price?.calculated_amount != null;

  async function add() {
    if (!variant) return;
    setState('busy');
    try {
      await addToCart(variant.id);
      setState('done');
      notify(`${product.title} added to your cart`, { action: { label: 'View cart', onPress: () => router.push('/(tabs)/cart') } });
      setTimeout(() => setState('idle'), 1800);
    } catch (err) {
      setState('idle');
      notify(getErrorMessage(err), { tone: 'error' });
    }
  }

  return (
    <View style={{ backgroundColor: colors.white, flex: 1 }}>
      <Animated.ScrollView contentContainerStyle={{ paddingBottom: 24 }} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: groundOf(product.id), height: width + insets.top, overflow: 'hidden', paddingTop: insets.top }}>
          <Animated.View entering={FadeIn.duration(320)} style={behind}>
            <ScrollView horizontal onScroll={(e) => setShown(Math.round(e.nativeEvent.contentOffset.x / width))} pagingEnabled scrollEventThrottle={16} showsHorizontalScrollIndicator={false}>
              {images.map((url) => (
                <View key={url} style={{ alignItems: 'center', height: width, justifyContent: 'center', width }}>
                  <Image accessibilityLabel={product.title} contentFit="contain" source={{ uri: url }} style={{ height: width * 0.82, width: width * 0.82 }} transition={320} />
                </View>
              ))}
              {!images.length && (
                <View style={{ alignItems: 'center', height: width, justifyContent: 'center', width }}>
                  <Ionicons color="#CFC6DA" name="image-outline" size={64} />
                </View>
              )}
            </ScrollView>
          </Animated.View>
          {images.length > 1 && (
            <View pointerEvents="none" style={{ bottom: 40, flexDirection: 'row', gap: 6, justifyContent: 'center', left: 0, position: 'absolute', right: 0 }}>
              {images.map((url, i) => (
                <Dot key={url} on={i === shown} />
              ))}
            </View>
          )}
        </View>
        <Details choice={choice} inStock={inStock} onPick={(name, value) => setChoice((c) => pickValue(variants, c, name, value))} price={price} product={product} />
      </Animated.ScrollView>

      <Animated.View entering={FadeInUp.duration(420).easing(EASE_OUT).delay(180)} style={{ backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, paddingBottom: Math.max(insets.bottom, 14), paddingHorizontal: 20, paddingTop: 14 }}>
        <Button disabled={!canBuy} done={state === 'done' ? 'Added to cart' : false} loading={state === 'busy'} onPress={add} size="lg" title={canBuy ? 'Add to cart' : inStock ? 'Unavailable' : 'Out of stock'} />
      </Animated.View>

      <View pointerEvents="box-none" style={{ flexDirection: 'row', justifyContent: 'space-between', left: 16, position: 'absolute', right: 16, top: insets.top + 8 }}>
        <RoundButton icon="arrow-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <WishlistHeart productId={product.id} />
      </View>
    </View>
  );
}

function RoundButton({ icon, label, onPress, color = colors.ink }: { icon: string; label: string; onPress: () => void; color?: string }) {
  return (
    <Press accessibilityLabel={label} hitSlop={8} onPress={onPress} scale={0.88} style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999, boxShadow: '0 4px 14px rgba(42,27,62,0.12)', height: 42, justifyContent: 'center', width: 42 }}>
      <Animated.View entering={ZoomIn.springify().damping(13)} key={icon}>
        <Ionicons color={color} name={icon as any} size={21} />
      </Animated.View>
    </Press>
  );
}

function WishlistHeart({ productId }: { productId: string }) {
  const router = useRouter();
  const notify = useToast();
  const client = useQueryClient();
  const { customer } = useAuth();
  const { data } = useQuery({ enabled: !!customer, queryFn: listWishlist, queryKey: ['wishlist'] });
  const [pending, setPending] = useState<boolean | null>(null);
  const saved = pending ?? !!data?.some((p) => p.id === productId);

  async function toggle() {
    if (!customer) {
      router.push('/(auth)/login');
      return;
    }
    setPending(!saved);
    try {
      await (saved ? removeFromWishlist(productId) : addToWishlist(productId));
      await client.invalidateQueries({ queryKey: ['wishlist'] });
      notify(saved ? 'Removed from your wishlist' : 'Saved to your wishlist');
    } catch (err) {
      notify(getErrorMessage(err), { tone: 'error' });
    } finally {
      setPending(null);
    }
  }
  return <RoundButton color={saved ? colors.red : colors.ink} icon={saved ? 'heart' : 'heart-outline'} label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onPress={toggle} />;
}

function Details({
  product,
  choice,
  price,
  inStock,
  onPick,
}: {
  product: Product;
  choice: Choice;
  price: ProductVariant['calculated_price'];
  inStock: boolean;
  onPick: (option: string, value: string) => void;
}) {
  const router = useRouter();
  const variants = product.variants ?? [];
  const options = variants.length > 1 ? (product.options ?? []) : [];
  const reviews = (product.reviews ?? []).filter((r) => r && typeof r.rating === 'number');
  const about = plainText(product.description);

  return (
    <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, gap: 22, marginTop: -28, paddingHorizontal: 20, paddingTop: 26 }}>
      <Rise style={{ gap: 6 }}>
        {product.categories?.[0] && <Text style={{ color: '#8A8493', fontSize: 12.5 }}>{product.categories[0].name}</Text>}
        <Text accessibilityRole="header" style={{ color: colors.ink, fontFamily: serif, fontSize: 28, lineHeight: 34 }}>
          {product.title}
        </Text>
        <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 10 }}>
          {price ? (
            <>
              <CountUp amount={price.calculated_amount} currency={price.currency_code} style={{ color: colors.purple, fontSize: 25, fontWeight: '800' }} />
              {price.original_amount > price.calculated_amount && (
                <Text style={{ color: colors.faint, fontSize: 15, textDecorationLine: 'line-through' }}>{formatPrice(price.original_amount, price.currency_code)}</Text>
              )}
            </>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 15 }}>Not for sale right now</Text>
          )}
        </View>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
          <View style={{ backgroundColor: inStock ? '#36B37E' : '#E26A6A', borderRadius: 999, height: 7, width: 7 }} />
          <Text style={{ color: inStock ? colors.green : colors.red, fontSize: 13, fontWeight: '600' }}>{inStock ? 'In stock' : 'Out of stock'}</Text>
        </View>
      </Rise>

      {options.map((option, o) => {
        const name = option.title.toLowerCase();
        return (
          <Rise index={o + 1} key={option.id} style={{ gap: 10 }}>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>
              {option.title} <Text style={{ color: colors.muted, fontWeight: '500' }}>{choice[name]}</Text>
            </Text>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {option.values.map(({ value }) => {
                const on = choice[name] === value;
                const match = variantFor(variants, { ...choice, [name]: value });
                const faded = !variants.some((v) => choiceOf(v)[name] === value && variantInStock(v)) || (match && !variantInStock(match));
                return (
                  <Press
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    key={value}
                    onPress={() => onPick(name, value)}
                    scale={0.93}
                    style={{ backgroundColor: on ? colors.purple : '#F6F3F9', borderRadius: 999, minWidth: 50, opacity: faded && !on ? 0.5 : 1, paddingHorizontal: 17, paddingVertical: 10 }}
                  >
                    <Text style={{ color: on ? colors.white : colors.ink, fontSize: 14, fontWeight: '600', textAlign: 'center', textDecorationLine: faded ? 'line-through' : 'none' }}>{value}</Text>
                  </Press>
                );
              })}
            </View>
          </Rise>
        );
      })}

      {product.seller && (
        <Rise index={options.length + 2}>
          <Press onPress={() => router.push(`/seller/${product.seller!.handle}`)} scale={0.98} style={{ alignItems: 'center', backgroundColor: colors.lilac, borderRadius: 20, flexDirection: 'row', gap: 12, padding: 14 }}>
            <View style={{ alignItems: 'center', backgroundColor: colors.purple, borderRadius: 999, height: 42, justifyContent: 'center', width: 42 }}>
              <Text style={{ color: colors.white, fontSize: 17, fontWeight: '700' }}>{product.seller.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Sold by</Text>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>{product.seller.name}</Text>
            </View>
            <Ionicons color={colors.purple} name="chevron-forward" size={18} />
          </Press>
        </Rise>
      )}

      {about ? (
        <Rise index={options.length + 3} style={{ gap: 8 }}>
          <Text style={{ color: colors.ink, fontFamily: serif, fontSize: 20 }}>About this product</Text>
          <Text style={{ color: '#5B5563', fontSize: 14.5, lineHeight: 22 }}>{about}</Text>
        </Rise>
      ) : null}

      {reviews.length > 0 && (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.ink, fontFamily: serif, fontSize: 20 }}>Reviews ({reviews.length})</Text>
          {reviews.slice(0, 3).map((r, i) => (
            <Rise index={i} key={r.id}>
              <View style={{ backgroundColor: colors.cream, borderRadius: 18, gap: 6, padding: 16 }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>{[r.customer?.first_name, r.customer?.last_name?.[0]].filter(Boolean).join(' ') || 'A shopper'}</Text>
                  <StarRating rating={r.rating} />
                </View>
                {r.customer_note ? <Text style={{ color: '#5B5563', fontSize: 13.5, lineHeight: 19 }}>{r.customer_note}</Text> : null}
              </View>
            </Rise>
          ))}
        </View>
      )}
    </View>
  );
}
