import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { requestPasswordReset } from '@/lib/auth';
import { getErrorMessage } from '@/lib/client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-6 pb-8 gap-8">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-surface">
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>

          {sent ? (
            <View className="flex-1 items-center justify-center gap-4">
              <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center">
                <Ionicons name="checkmark-circle" size={36} color="#16a34a" />
              </View>
              <Text className="text-xl font-bold text-gray-900">Email sent!</Text>
              <Text className="text-center text-gray-500">
                Check your inbox for a password reset link.
              </Text>
              <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
            </View>
          ) : (
            <>
              <View className="gap-2">
                <Text className="text-3xl font-bold text-gray-900">Forgot password?</Text>
                <Text className="text-base text-gray-500">
                  Enter your email and we'll send you a reset link.
                </Text>
              </View>
              <View className="gap-4">
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
              </View>
              <View className="mt-auto">
                <Button title="Send Reset Link" loading={loading} onPress={handleSubmit} size="lg" />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
