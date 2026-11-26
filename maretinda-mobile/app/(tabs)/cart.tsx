import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartItemRow } from '@/components/CartItemRow';
import { CountUp, EASE_OUT, MaskedText } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useCart } from '@/context/cart';
import { useToast } from '@/context/toast';
import { getErrorMessage } from '@/lib/client';
import { colors } from '@/theme';

export default function CartScreen() {
  const router = useRouter();
  const notify = useToast();
  const { cart, isLoading, itemCount, updateItem, removeItem } = useCart();

  if (isLoading && !cart) return <Loading message="Loading cart…" />;

  const currency = cart?.currency_code ?? 'PHP';
  const tell = (err: unknown) => notify(getErrorMessage(err), { tone: 'error' });
  const items = cart?.items ?? [];
  const Row = ({ label, amount }: { label: string; amount: number }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.muted, fontSize: 14 }}>{label}</Text>
      <CountUp amount={amount} currency={currency} style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View style={{ paddingBottom: 10, paddingHorizontal: 20, paddingTop: 10 }}>
        <MaskedText style={{ color: colors.ink, fontSize: 32, lineHeight: 38 }} text="Your cart" />
        {itemCount > 0 && <Text style={{ color: colors.muted, fontSize: 13.5 }}>{itemCount === 1 ? '1 item' : `${itemCount} items`}</Text>}
      </View>

      {!items.length ? (
        <EmptyState action="Start shopping" icon="bag-outline" onPress={() => router.push('/')} title="Your cart is empty">
          Find something you love: it will wait for you here.
        </EmptyState>
      ) : (
        <>
          <Animated.ScrollView contentContainerStyle={{ gap: 12, padding: 16 }} showsVerticalScrollIndicator={false}>
            {items.map((item, i) => (
              <CartItemRow
                currency={currency}
                index={i}
                item={item}
                key={item.id}
                onChange={(quantity) => updateItem(item.id, quantity).catch(tell)}
                onRemove={() => removeItem(item.id).catch(tell)}
              />
            ))}
            <Animated.View layout={LinearTransition.duration(320).easing(EASE_OUT)} style={{ backgroundColor: colors.white, borderRadius: 22, gap: 12, marginTop: 4, padding: 18 }}>
              <Row amount={cart?.subtotal ?? 0} label="Subtotal" />
              {(cart?.shipping_total ?? 0) > 0 && <Row amount={cart!.shipping_total} label="Shipping" />}
              <View style={{ backgroundColor: colors.line, height: 1 }} />
              <View style={{ alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>Total</Text>
                <CountUp amount={cart?.total ?? 0} currency={currency} style={{ color: colors.purple, fontSize: 22, fontWeight: '800' }} />
              </View>
            </Animated.View>
          </Animated.ScrollView>

          <Animated.View entering={FadeInUp.duration(420).easing(EASE_OUT).delay(160)} style={{ backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 14 }}>
            <Button onPress={() => router.push('/checkout')} size="lg" title="Check out" variant="accent" />
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}
