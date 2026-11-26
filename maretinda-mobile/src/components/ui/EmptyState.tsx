import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Rise } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme';

/** What a screen says while there is nothing in it, and what to do next. */
export function EmptyState({ icon, title, children, action, onPress }: { icon: string; title: string; children?: React.ReactNode; action?: string; onPress?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', backgroundColor: colors.lilac, borderRadius: 999, height: 84, justifyContent: 'center', marginBottom: 18, width: 84 }}>
        <Ionicons color={colors.purple} name={icon as any} size={36} />
      </Animated.View>
      <Rise delay={80}>
        <Text className="text-center text-[17px] font-bold text-gray-900">{title}</Text>
        {children ? <Text className="mt-1.5 text-center text-[13.5px] leading-5 text-gray-500">{children}</Text> : null}
      </Rise>
      {action && onPress && (
        <Rise delay={160} style={{ marginTop: 22 }}>
          <Button onPress={onPress} title={action} />
        </Rise>
      )}
    </View>
  );
}
