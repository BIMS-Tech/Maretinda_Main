import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { SPRING } from './tokens';

type Props = PressableProps & {
  /** How far it gives under a finger */
  scale?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

/** Something to press: it gives a little under the finger and springs back. */
export function Press({ scale = 0.96, containerStyle, onPressIn, onPressOut, ...props }: Props) {
  const down = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(down.value ? scale : 1, SPRING) }] }));
  return (
    <Animated.View style={[containerStyle, style]}>
      <Pressable
        accessibilityRole="button"
        {...props}
        onPressIn={(e) => {
          down.value = 1;
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          down.value = 0;
          onPressOut?.(e);
        }}
      />
    </Animated.View>
  );
}
