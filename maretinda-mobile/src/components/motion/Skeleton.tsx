import React, { useEffect } from 'react';
import { type DimensionValue, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from './tokens';

/** Where something will be, while it's on its way. */
export function Skeleton({ width = '100%', height, radius = 12 }: { width?: DimensionValue; height: DimensionValue; radius?: number }) {
  const breath = useSharedValue(0.55);
  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 900, easing: EASE_OUT }), -1, true);
  }, [breath]);
  const style = useAnimatedStyle(() => ({ opacity: breath.value }));
  return <Animated.View style={[{ backgroundColor: '#EFEAF4', borderRadius: radius, height, width }, style]} />;
}

/** A page of product cards on its way. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading products" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, padding: 16 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ gap: 8, width: '47.5%' }}>
          <View style={{ aspectRatio: 1 }}>
            <Skeleton height="100%" radius={20} />
          </View>
          <Skeleton height={12} width="80%" />
          <Skeleton height={14} width="45%" />
        </View>
      ))}
    </View>
  );
}
