import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPRING } from '@/components/motion';
import { useCart } from '@/context/cart';
import { colors } from '@/theme';

const ICONS: Record<string, [string, string]> = {
  account: ['person', 'person-outline'],
  cart: ['bag', 'bag-outline'],
  index: ['home', 'home-outline'],
  search: ['search', 'search-outline'],
};

/** How many are in the cart; it jumps when one more goes in. */
function CartCount() {
  const { itemCount } = useCart();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (itemCount) scale.value = withSequence(withTiming(1.45, { duration: 120 }), withSpring(1, { damping: 9, stiffness: 260 }));
  }, [itemCount, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (!itemCount) return null;
  return (
    <Animated.View entering={ZoomIn.springify()} style={[{ alignItems: 'center', backgroundColor: colors.yellow, borderRadius: 999, height: 17, justifyContent: 'center', minWidth: 17, paddingHorizontal: 3, position: 'absolute', right: -9, top: -6 }, style]}>
      <Text style={{ color: colors.purple, fontSize: 10, fontWeight: '800' }}>{itemCount > 99 ? '99+' : itemCount}</Text>
    </Animated.View>
  );
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -1.5 * lift.value }, { scale: 1 + 0.06 * lift.value }] }));
  return (
    <Animated.View style={style}>
      <Ionicons color={focused ? colors.purple : '#9A94A3'} name={(ICONS[name]?.[focused ? 0 : 1] ?? 'ellipse-outline') as any} size={23} />
      {name === 'cart' && <CartCount />}
    </Animated.View>
  );
}

/** The bar along the bottom; a soft pill slides to the tab being shown. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const tab = width / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(state.index * tab, SPRING);
  }, [state.index, tab, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={{ backgroundColor: colors.white, borderTopColor: colors.line, borderTopWidth: 1, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8 }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: 'row' }}>
        {tab > 0 && (
          <Animated.View pointerEvents="none" style={[{ alignItems: 'center', bottom: 0, position: 'absolute', top: 0, width: tab }, pill]}>
            <View style={{ backgroundColor: colors.lilac, borderRadius: 18, height: '100%', width: Math.min(84, tab - 12) }} />
          </Animated.View>
        )}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const label = (descriptors[route.key].options.title ?? route.name) as string;
          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ canPreventDefault: true, target: route.key, type: 'tabPress' });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={{ alignItems: 'center', flex: 1, gap: 3, paddingVertical: 6 }}
            >
              <TabIcon focused={focused} name={route.name} />
              <Text style={{ color: focused ? colors.purple : '#9A94A3', fontSize: 11, fontWeight: focused ? '700' : '500' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
