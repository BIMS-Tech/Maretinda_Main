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

export default function RegisterScreen() {
  const { register, refreshCustomer } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || undefined,
      });
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
            className="items-center justify-center pb-8 pt-12"
            style={{ backgroundColor: '#5B1072' }}
          >
            <Image
              source={require('../../assets/splash-icon.png')}
              style={{ width: 70, height: 70 }}
              contentFit="contain"
            />
            <Text className="text-white text-xl font-bold mt-2">Maretinda</Text>
          </View>

          <View className="px-6 pt-6 pb-8 gap-5">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-gray-900">Create account</Text>
              <Text className="text-sm text-gray-500">Join Maretinda today</Text>
            </View>

            {/* Google Sign Up */}
            <GoogleSignInButton
              label="Sign up with Google"
              onSuccess={refreshCustomer}
            />

            {/* Divider */}
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-xs text-gray-400">or sign up with email</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Form */}
            <View className="gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="First name *"
                    placeholder="Juan"
                    autoCapitalize="words"
                    value={form.first_name}
                    onChangeText={(v) => update('first_name', v)}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Last name *"
                    placeholder="Dela Cruz"
                    autoCapitalize="words"
                    value={form.last_name}
                    onChangeText={(v) => update('last_name', v)}
                  />
                </View>
              </View>
              <Input
                label="Email *"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => update('email', v)}
              />
              <Input
                label="Phone (optional)"
                placeholder="+63 912 345 6789"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
              />
              <Input
                label="Password *"
                placeholder="Min. 8 characters"
                secureTextEntry
                value={form.password}
                onChangeText={(v) => update('password', v)}
              />
              <Input
                label="Confirm password *"
                placeholder="Repeat password"
                secureTextEntry
                value={form.confirm_password}
                onChangeText={(v) => update('confirm_password', v)}
              />
              {error ? (
                <Text className="text-sm text-red-500">{error}</Text>
              ) : null}
            </View>

            <View className="gap-4">
              <Button
                title="Create Account"
                loading={loading}
                onPress={handleRegister}
                size="lg"
              />
              <View className="flex-row justify-center gap-1">
                <Text className="text-gray-500">Already have an account?</Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text className="text-primary font-semibold">Sign in</Text>
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
