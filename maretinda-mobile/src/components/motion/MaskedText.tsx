import React, { useEffect } from 'react';
import { type StyleProp, Text, type TextStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { serif } from '@/theme';

import { EASE_OUT, stagger } from './tokens';

function Word({ children, delay, style }: { children: string; delay: number; style?: StyleProp<TextStyle> }) {
  const down = useSharedValue(1);
  useEffect(() => {
    down.value = withDelay(delay, withTiming(0, { duration: 640, easing: EASE_OUT }));
  }, [delay, down]);
  const rising = useAnimatedStyle(() => ({ transform: [{ translateY: `${down.value * 110}%` }] }));
  return (
    <View importantForAccessibility="no-hide-descendants" style={{ overflow: 'hidden' }}>
      <Animated.View style={rising}>
        <Text style={[{ fontFamily: serif }, style]}>{children}</Text>
      </Animated.View>
    </View>
  );
}

/** A heading whose words rise into place one after another. */
export function MaskedText({ text, style, delay = 0 }: { text: string; style?: StyleProp<TextStyle>; delay?: number }) {
  return (
    <View accessibilityLabel={text} accessibilityRole="header" accessible style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {text.split(' ').map((word, i) => (
        <Word delay={delay + stagger(i, 70)} key={`${word}-${i}`} style={style}>
          {word + ' '}
        </Word>
      ))}
    </View>
  );
}
