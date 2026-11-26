import React, { useEffect, useRef, useState } from 'react';
import { type StyleProp, Text, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { formatPrice } from '@/lib/utils';

/** An amount that counts to its new value when it changes. */
export function CountUp({ amount, currency = 'PHP', style, className }: { amount: number; currency?: string; style?: StyleProp<TextStyle>; className?: string }) {
  const still = useReducedMotion();
  const [shown, setShown] = useState(amount);
  const from = useRef(amount);

  useEffect(() => {
    if (still || from.current === amount) {
      from.current = amount;
      setShown(amount);
      return;
    }
    const start = from.current;
    const began = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - began) / 480);
      const eased = 1 - (1 - t) ** 3;
      from.current = t === 1 ? amount : start + (amount - start) * eased;
      setShown(from.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [amount, still]);

  // Whole pesos while it counts, the exact amount once it's there
  return (
    <Text accessibilityLabel={formatPrice(amount, currency)} className={className} style={style}>
      {formatPrice(shown === amount ? amount : Math.round(shown), currency)}
    </Text>
  );
}
