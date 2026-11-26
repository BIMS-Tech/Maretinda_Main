import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { EASE_OUT, stagger } from './tokens';

/** Comes up into place when it arrives; give a group its index to arrive one after another. */
export function Rise({
  children,
  index = 0,
  delay = 0,
  style,
  layout = false,
}: {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  /** Slide to a new place when the things around it change */
  layout?: boolean;
}) {
  const wait = delay + stagger(index);
  // Made once: a new one each render would start it again
  const entering = useMemo(() => FadeInDown.duration(520).easing(EASE_OUT).delay(wait), [wait]);
  return (
    <Animated.View
      entering={entering}
      exiting={layout ? FadeOut.duration(160) : undefined}
      layout={layout ? LinearTransition.duration(320).easing(EASE_OUT) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
