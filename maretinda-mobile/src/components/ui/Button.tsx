import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, type PressableProps, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Press } from '@/components/motion';
import { colors } from '@/theme';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  /** Shows a tick and these words for a moment */
  done?: string | false;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const LOOK = {
  accent: { background: colors.yellow, border: colors.yellow, text: colors.purple },
  ghost: { background: 'transparent', border: 'transparent', text: colors.purple },
  outline: { background: 'transparent', border: colors.purple, text: colors.purple },
  primary: { background: colors.purple, border: colors.purple, text: colors.white },
};
const HEIGHT = { lg: 54, md: 48, sm: 38 };

export function Button({ title, loading, done, variant = 'primary', size = 'md', disabled, ...props }: ButtonProps) {
  const look = done ? { background: colors.green, border: colors.green, text: colors.white } : LOOK[variant];
  const off = disabled || loading || !!done;
  const key = loading ? 'busy' : done ? 'done' : 'idle';
  return (
    <Press
      accessibilityLabel={title}
      accessibilityState={{ busy: !!loading, disabled: !!off }}
      disabled={off}
      scale={0.97}
      style={{
        alignItems: 'center',
        backgroundColor: look.background,
        borderColor: look.border,
        borderRadius: 999,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        height: HEIGHT[size],
        justifyContent: 'center',
        opacity: disabled && !loading && !done ? 0.45 : 1,
        paddingHorizontal: size === 'sm' ? 16 : 24,
      }}
      {...props}
    >
      {/* What it says crossfades as its state changes */}
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} key={key} style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        {loading && <ActivityIndicator color={look.text} size="small" />}
        {done && <Ionicons color={look.text} name="checkmark" size={20} />}
        <Text style={{ color: look.text, fontSize: size === 'lg' ? 16 : size === 'md' ? 15 : 13, fontWeight: '700' }}>{done || title}</Text>
      </Animated.View>
    </Press>
  );
}
