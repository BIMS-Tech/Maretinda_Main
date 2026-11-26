import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EASE_OUT } from '@/components/motion';
import { colors } from '@/theme';

/** The purple top and the sheet below it that signing in and signing up share. */
export function AuthScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.white, flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[colors.purple, '#2A1B3E']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={{ alignItems: 'center', paddingBottom: 66, paddingTop: insets.top + 34 }}>
            <Animated.View entering={ZoomIn.duration(520).easing(EASE_OUT)}>
              <Image accessibilityLabel="Maretinda" contentFit="contain" source={require('../../assets/logo.png')} style={{ height: 84, width: 190 }} />
            </Animated.View>
          </LinearGradient>
          <Animated.View entering={FadeInDown.duration(560).easing(EASE_OUT)} style={{ backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 1, marginTop: -32, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, paddingTop: 30 }}>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
