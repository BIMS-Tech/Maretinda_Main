import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-xl font-bold text-gray-900">Page not found</Text>
        <Link href="/" className="text-primary">
          Go home
        </Link>
      </View>
    </>
  );
}
