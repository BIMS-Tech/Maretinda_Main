import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '@/components/motion';
import { colors } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, secureTextEntry, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const line = error ? '#F09A9A' : focused ? colors.purple : '#EAE5F0';
  const box = useAnimatedStyle(() => ({
    backgroundColor: withTiming(focused ? '#FFFFFF' : '#FBFAFC', { duration: 220, easing: EASE_OUT }),
    borderColor: withTiming(line, { duration: 220, easing: EASE_OUT }),
  }));
  return (
    <View className="gap-1.5">
      {label && <Text className="text-[13px] font-semibold text-gray-800">{label}</Text>}
      <Animated.View style={[{ alignItems: 'center', borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', height: 50 }, box]}>
        <TextInput
          accessibilityLabel={label}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          placeholderTextColor="#A39DAC"
          secureTextEntry={secureTextEntry && !shown}
          style={{ color: colors.ink, flex: 1, fontSize: 15, height: '100%', paddingHorizontal: 16 }}
          {...props}
        />
        {secureTextEntry && (
          <Pressable accessibilityLabel={shown ? 'Hide password' : 'Show password'} accessibilityRole="button" hitSlop={10} onPress={() => setShown((v) => !v)} style={{ paddingRight: 14 }}>
            <Ionicons color="#9B9B9B" name={shown ? 'eye-off-outline' : 'eye-outline'} size={20} />
          </Pressable>
        )}
      </Animated.View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
