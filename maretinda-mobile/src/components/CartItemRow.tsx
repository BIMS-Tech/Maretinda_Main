import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { CountUp, EASE_OUT, Press, Rise } from '@/components/motion';
import { formatPrice } from '@/lib/utils';
import { colors, groundOf } from '@/theme';
import type { CartLineItem } from '@/types';

interface CartItemRowProps {
  item: CartLineItem;
  index: number;
  currency: string;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}

function Step({ icon, label, onPress, disabled }: { icon: string; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Press accessibilityLabel={label} disabled={disabled} hitSlop={4} onPress={onPress} scale={0.85} style={{ alignItems: 'center', borderRadius: 999, height: 34, justifyContent: 'center', opacity: disabled ? 0.3 : 1, width: 34 }}>
      <Ionicons color={colors.purple} name={icon as any} size={17} />
    </Press>
  );
}

export function CartItemRow({ item, index, currency, onChange, onRemove }: CartItemRowProps) {
  const [broken, setBroken] = useState(false);
  const image = broken ? null : item.thumbnail || item.variant?.product?.thumbnail;
  const variant = item.variant_title && !/^default/i.test(item.variant_title) ? item.variant_title : null;
  return (
    <Animated.View exiting={FadeOutLeft.duration(260)} layout={LinearTransition.duration(320).easing(EASE_OUT)}>
      <Rise index={index}>
        <View style={{ backgroundColor: colors.white, borderRadius: 22, flexDirection: 'row', gap: 14, padding: 12 }}>
          <View style={{ alignItems: 'center', backgroundColor: groundOf(item.id), borderRadius: 16, height: 92, justifyContent: 'center', width: 92 }}>
            {image ? (
              <Image contentFit="contain" onError={() => setBroken(true)} source={{ uri: image }} style={{ height: 76, width: 76 }} transition={240} />
            ) : (
              <Ionicons color="#CFC6DA" name="image-outline" size={28} />
            )}
          </View>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 14, fontWeight: '600', lineHeight: 19 }}>
                  {item.product_title ?? item.variant?.product?.title}
                </Text>
                {variant && <Text style={{ color: colors.muted, fontSize: 12 }}>{variant}</Text>}
              </View>
              <Press accessibilityLabel="Remove" hitSlop={8} onPress={onRemove} scale={0.85}>
                <Ionicons color={colors.faint} name="close" size={19} />
              </Press>
            </View>
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', borderColor: '#EAE5F0', borderRadius: 999, borderWidth: 1, flexDirection: 'row' }}>
                <Step disabled={item.quantity <= 1} icon="remove" label="One fewer" onPress={() => onChange(item.quantity - 1)} />
                {/* The number rolls over */}
                <View accessibilityLabel={`Quantity ${item.quantity}`} accessible style={{ alignItems: 'center', height: 24, justifyContent: 'center', overflow: 'hidden', width: 26 }}>
                  <Animated.View entering={FadeInDown.duration(240).easing(EASE_OUT)} exiting={FadeOutUp.duration(160)} key={item.quantity}>
                    <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{item.quantity}</Text>
                  </Animated.View>
                </View>
                <Step icon="add" label="One more" onPress={() => onChange(item.quantity + 1)} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <CountUp amount={item.unit_price * item.quantity} currency={currency} style={{ color: colors.purple, fontSize: 15, fontWeight: '800' }} />
                {item.quantity > 1 && <Text style={{ color: colors.faint, fontSize: 11 }}>{formatPrice(item.unit_price, currency)} each</Text>}
              </View>
            </View>
          </View>
        </View>
      </Rise>
    </Animated.View>
  );
}
