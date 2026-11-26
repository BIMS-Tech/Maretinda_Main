import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Press } from '@/components/motion';
import { useCart } from '@/context/cart';
import { useToast } from '@/context/toast';
import { getErrorMessage } from '@/lib/client';
import { discountPercent } from '@/lib/product';
import { formatPrice } from '@/lib/utils';
import { colors, groundOf } from '@/theme';
import type { ProductCardData } from '@/types';

export function ProductCard({ product, onRemove }: { product: ProductCardData; onRemove?: () => void }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const notify = useToast();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [broken, setBroken] = useState(false);
  const off = discountPercent(product);
  const image = broken ? null : product.thumbnail;
  const canAdd = !onRemove && product.in_stock && !!product.variant_id;

  const open = () => router.push(`/product/${product.id}`);

  async function quickAdd() {
    setState('busy');
    try {
      await addToCart(product.variant_id!);
      setState('done');
      notify(`${product.title} added to your cart`, { action: { label: 'View cart', onPress: () => router.push('/(tabs)/cart') } });
      setTimeout(() => setState('idle'), 1600);
    } catch (err) {
      setState('idle');
      notify(getErrorMessage(err), { tone: 'error' });
    }
  }

  return (
    <View>
      <Press accessibilityLabel={product.title} accessibilityRole="link" onPress={open} scale={0.97}>
        <View style={{ alignItems: 'center', aspectRatio: 1, backgroundColor: groundOf(product.id), borderRadius: 20, justifyContent: 'center', overflow: 'hidden' }}>
          {image ? (
            <Image contentFit="contain" onError={() => setBroken(true)} source={{ uri: image }} style={{ height: '82%', opacity: product.in_stock ? 1 : 0.45, width: '82%' }} transition={320} />
          ) : (
            <Ionicons color="#CFC6DA" name="image-outline" size={38} />
          )}
          <View pointerEvents="none" style={{ gap: 6, left: 10, position: 'absolute', top: 10 }}>
            {off > 0 && (
              <View style={{ alignSelf: 'flex-start', backgroundColor: product.flash_sale ? '#D94040' : colors.purple, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{product.flash_sale ? `Flash −${off}%` : `−${off}%`}</Text>
              </View>
            )}
            {!product.in_stock && (
              <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text style={{ color: '#5B5B5B', fontSize: 11, fontWeight: '700' }}>Sold out</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ gap: 2, paddingHorizontal: 4, paddingTop: 10 }}>
          {(product.brand || product.category || product.seller) && (
            <Text numberOfLines={1} style={{ color: '#8A8493', fontSize: 11.5 }}>
              {product.brand || product.category?.name || product.seller?.name}
            </Text>
          )}
          <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 13.5, fontWeight: '600', lineHeight: 18 }}>
            {product.title}
          </Text>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: 6, paddingTop: 2 }}>
            <Text style={{ color: product.flash_sale ? colors.red : colors.purple, fontSize: 15, fontWeight: '700' }}>
              {product.price != null ? formatPrice(product.price, product.currency_code) : 'View price'}
            </Text>
            {off > 0 && <Text style={{ color: colors.faint, fontSize: 12, textDecorationLine: 'line-through' }}>{formatPrice(product.original_price as number, product.currency_code)}</Text>}
          </View>
          {(product.review_count > 0 || product.sold > 0) && (
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}>
              {product.review_count > 0 && (
                <>
                  <Ionicons color={colors.yellow} name="star" size={12} />
                  <Text style={{ color: colors.muted, fontSize: 11.5 }}>
                    {product.rating.toFixed(1)} ({product.review_count})
                  </Text>
                </>
              )}
              {product.sold > 0 && <Text style={{ color: colors.muted, fontSize: 11.5 }}>{product.sold} sold</Text>}
            </View>
          )}
        </View>
      </Press>

      {canAdd && (
        <View style={{ position: 'absolute', right: 8, top: 0, aspectRatio: 1, width: '100%' }} pointerEvents="box-none">
          <Press
            accessibilityLabel={`Add ${product.title} to cart`}
            containerStyle={{ bottom: 8, position: 'absolute', right: 0 }}
            disabled={state === 'busy'}
            hitSlop={6}
            onPress={quickAdd}
            scale={0.86}
            style={{ alignItems: 'center', backgroundColor: state === 'done' ? colors.green : colors.purple, borderRadius: 999, boxShadow: '0 6px 16px rgba(67,44,99,0.35)', height: 38, justifyContent: 'center', width: 38 }}
          >
            {state === 'busy' ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Animated.View entering={ZoomIn.springify().damping(13)} key={state}>
                <Ionicons color={colors.white} name={state === 'done' ? 'checkmark' : 'add'} size={20} />
              </Animated.View>
            )}
          </Press>
        </View>
      )}
      {onRemove && (
        <Press accessibilityLabel="Remove from wishlist" containerStyle={{ position: 'absolute', right: 10, top: 10 }} hitSlop={6} onPress={onRemove} scale={0.86} style={{ alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 }}>
          <Ionicons color={colors.purple} name="close" size={18} />
        </Press>
      )}
    </View>
  );
}
