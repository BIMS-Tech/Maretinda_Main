import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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

import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth';
import { updateCustomer } from '@/lib/auth';
import { getErrorMessage } from '@/lib/client';

export default function SettingsScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const [form, setForm] = useState({
    first_name: customer?.first_name ?? '',
    last_name: customer?.last_name ?? '',
    phone: customer?.phone ?? '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: async () => {
      await refreshCustomer();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScreenHeader title="Account settings" />

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View className="bg-white rounded-[22px] p-5 gap-4">
            <Text className="text-sm font-bold text-gray-900">Profile</Text>
            <Input
              label="First name"
              value={form.first_name}
              onChangeText={(v) => update('first_name', v)}
            />
            <Input
              label="Last name"
              value={form.last_name}
              onChangeText={(v) => update('last_name', v)}
            />
            <Input
              label="Phone"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
            />
            {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
            {success ? (
              <Text className="text-sm text-green-600">Profile updated!</Text>
            ) : null}
          </View>

          <View className="bg-white rounded-[22px] p-5 gap-3">
            <Text className="text-sm font-bold text-gray-900">Email</Text>
            <Text className="text-sm text-gray-500">{customer?.email}</Text>
            <Text className="text-xs text-gray-400">Email cannot be changed</Text>
          </View>
        </ScrollView>

        <View className="bg-white border-t border-border px-5 py-4">
          <Button
            title={success ? 'Saved!' : 'Save Changes'}
            size="lg"
            loading={mutation.isPending}
            onPress={() => mutation.mutate(form)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
