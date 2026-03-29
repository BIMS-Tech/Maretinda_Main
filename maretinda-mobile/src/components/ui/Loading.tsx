import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export function Loading({ message }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <ActivityIndicator size="large" color="#5B1072" />
      {message && <Text className="text-gray-500 text-sm">{message}</Text>}
    </View>
  );
}

export function InlineLoading() {
  return (
    <View className="py-8 items-center">
      <ActivityIndicator size="small" color="#5B1072" />
    </View>
  );
}
