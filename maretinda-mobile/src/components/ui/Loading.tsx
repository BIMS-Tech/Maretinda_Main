import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@/theme';

export function Loading({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-surface">
      <ActivityIndicator color={colors.purple} size="large" />
      {message && <Text className="text-sm text-gray-500">{message}</Text>}
    </View>
  );
}

export function InlineLoading() {
  return (
    <View className="items-center py-8">
      <ActivityIndicator color={colors.purple} size="small" />
    </View>
  );
}
