import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface GoogleSignInButtonProps {
  onSuccess: () => Promise<void>;
  label?: string;
}

export function GoogleSignInButton({
  onSuccess,
  label = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePress() {
    setError('');
    setLoading(true);
    try {
      // Dynamic import to avoid issues if expo-web-browser not ready
      const { signInWithGoogle } = await import('@/lib/google-auth');
      const result = await signInWithGoogle();
      if (result) {
        await onSuccess();
      } else {
        setError('Google sign-in was cancelled or failed');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-2">
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="flex-row items-center justify-center gap-3 border border-border bg-white rounded-xl py-3.5 px-5 active:opacity-80"
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#5B1072" />
        ) : (
          /* Google 'G' icon using colored text */
          <View className="w-5 h-5 items-center justify-center">
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#4285F4', lineHeight: 20 }}>
              G
            </Text>
          </View>
        )}
        <Text className="text-sm font-semibold text-gray-700">{label}</Text>
      </Pressable>
      {error ? (
        <Text className="text-xs text-red-500 text-center">{error}</Text>
      ) : null}
    </View>
  );
}
