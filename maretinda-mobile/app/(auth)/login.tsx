import { Image } from 'expo-image';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth';
import { getErrorMessage } from '@/lib/client';

export default function LoginScreen() {
  const { login, refreshCustomer } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Purple header with logo */}
          <View
            className="items-center justify-center pb-10 pt-14"
            style={{ backgroundColor: '#5B1072' }}
          >
            <Image
              source={require('../../assets/splash-icon.png')}
              style={{ width: 90, height: 90 }}
              contentFit="contain"
            />
            <Text className="text-white text-2xl font-bold mt-3">Maretinda</Text>
            <Text className="text-white/70 text-sm mt-1">Your marketplace</Text>
          </View>

          <View className="flex-1 px-6 pt-8 pb-8 gap-6">
            {/* Title */}
            <View className="gap-1">
              <Text className="text-2xl font-bold text-gray-900">Welcome back</Text>
              <Text className="text-sm text-gray-500">Sign in to continue</Text>
            </View>

            {/* Google Sign In */}
            <GoogleSignInButton
              label="Continue with Google"
              onSuccess={refreshCustomer}
            />

            {/* Divider */}
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-xs text-gray-400">or sign in with email</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Email/Password form */}
            <View className="gap-4">
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                label="Password"
                placeholder="Your password"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />
              {error ? (
                <Text className="text-sm text-red-500">{error}</Text>
              ) : null}
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable className="self-end">
                  <Text className="text-sm text-primary">Forgot password?</Text>
                </Pressable>
              </Link>
            </View>

            {/* Actions */}
            <View className="gap-4 mt-auto">
              <Button title="Sign In" loading={loading} onPress={handleLogin} size="lg" />
              <View className="flex-row justify-center gap-1">
                <Text className="text-gray-500">Don't have an account?</Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text className="text-primary font-semibold">Sign up</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
