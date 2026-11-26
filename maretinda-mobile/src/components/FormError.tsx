import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

/** What went wrong with a form. Shakes its head each time. */
export function FormError({ children, again = 0 }: { children: string; again?: number }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSequence(...[-7, 6, -4, 2, 0].map((to) => withTiming(to, { duration: 70 })));
  }, [again, children, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View accessibilityLiveRegion="polite" accessibilityRole="alert" entering={FadeIn.duration(200)} style={[{ alignItems: 'flex-start', backgroundColor: '#FDF0EF', borderRadius: 14, flexDirection: 'row', gap: 8, padding: 12 }, style]}>
      <Ionicons color="#C43131" name="alert-circle" size={18} />
      <Text style={{ color: '#9B2C2C', flex: 1, fontSize: 13.5, lineHeight: 19 }}>{children}</Text>
    </Animated.View>
  );
}
