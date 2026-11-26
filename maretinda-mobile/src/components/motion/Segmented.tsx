import React, { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors } from '@/theme';

import { SPRING } from './tokens';

/** A row of choices with a pill that slides to the one picked. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const [places, setPlaces] = useState<Record<string, { x: number; width: number }>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const place = places[value];
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (!place) return;
    // The first time it is simply there
    x.value = width.value ? withSpring(place.x, SPRING) : place.x;
    width.value = width.value ? withSpring(place.width, SPRING) : place.width;
    // Bring the one picked into view, with some of the one before it
    scroller.current?.scrollTo({ animated: true, x: Math.max(0, place.x - 72) });
  }, [place, x, width]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: width.value }));
  const note = (key: string) => (e: LayoutChangeEvent) => {
    const { x: left, width: wide } = e.nativeEvent.layout;
    setPlaces((all) => (all[key]?.x === left && all[key]?.width === wide ? all : { ...all, [key]: { width: wide, x: left } }));
  };

  return (
    <ScrollView accessibilityLabel={label} accessibilityRole="tablist" contentContainerStyle={{ paddingHorizontal: 16 }} horizontal ref={scroller} showsHorizontalScrollIndicator={false}>
      <View style={{ backgroundColor: '#F1EDF6', borderRadius: 999, flexDirection: 'row', padding: 4 }}>
        <Animated.View style={[{ backgroundColor: colors.purple, borderRadius: 999, bottom: 4, left: 0, position: 'absolute', top: 4 }, pill]} />
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={option.value}
              onLayout={note(option.value)}
              onPress={() => onChange(option.value)}
              style={{ height: 34, justifyContent: 'center', paddingHorizontal: 14 }}
            >
              <Text style={{ color: active ? colors.white : '#5B5B5B', fontSize: 13, fontWeight: '600' }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
