import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { MaskedText, Press } from '@/components/motion';
import { colors } from '@/theme';

/** The top of a screen: the way back, its title, and whatever goes beside it. */
export function ScreenHeader({ title, note, onBack, aside }: { title: string; note?: string; onBack?: () => void; aside?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-3 bg-surface px-4 pb-3 pt-2">
      <Press accessibilityLabel="Back" hitSlop={8} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} scale={0.9} style={{ alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: 999, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 }}>
        <Ionicons color={colors.ink} name="arrow-back" size={20} />
      </Press>
      <View className="flex-1">
        <MaskedText key={title} style={{ color: colors.ink, fontSize: 24, lineHeight: 30 }} text={title} />
        {note ? <Text className="text-[12.5px] text-gray-500">{note}</Text> : null}
      </View>
      {aside}
    </View>
  );
}
