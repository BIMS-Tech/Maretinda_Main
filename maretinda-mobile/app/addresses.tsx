import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth';
import { client } from '@/lib/client';

async function listAddresses() {
  const { data } = await client.get('/store/customers/me/addresses');
  return data.addresses as any[];
}

async function addAddress(body: Record<string, string>) {
  const { data } = await client.post('/store/customers/me/addresses', body);
  return data;
}

async function deleteAddress(id: string) {
  await client.delete(`/store/customers/me/addresses/${id}`);
}

export default function AddressesScreen() {
  const router = useRouter();
  const { customer } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    province: '',
    postal_code: '',
    country_code: 'PH',
    phone: '',
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: listAddresses,
    enabled: !!customer,
  });

  const addMutation = useMutation({
    mutationFn: addAddress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="bg-white px-5 py-4 flex-row items-center gap-3 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900 flex-1">Saved Addresses</Text>
          <Pressable onPress={() => setShowForm((v) => !v)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#5B1072" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
          {/* Add form */}
          {showForm && (
            <View className="bg-white rounded-2xl p-5 gap-4">
              <Text className="text-sm font-bold text-gray-900">New Address</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="First name" value={form.first_name} onChangeText={(v) => update('first_name', v)} />
                </View>
                <View className="flex-1">
                  <Input label="Last name" value={form.last_name} onChangeText={(v) => update('last_name', v)} />
                </View>
              </View>
              <Input label="Address" value={form.address_1} onChangeText={(v) => update('address_1', v)} />
              <Input label="City" value={form.city} onChangeText={(v) => update('city', v)} />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input label="Province" value={form.province} onChangeText={(v) => update('province', v)} />
                </View>
                <View className="flex-1">
                  <Input label="ZIP" keyboardType="numeric" value={form.postal_code} onChangeText={(v) => update('postal_code', v)} />
                </View>
              </View>
              <Input label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={(v) => update('phone', v)} />
              <Button
                title="Save Address"
                loading={addMutation.isPending}
                onPress={() => addMutation.mutate(form)}
              />
            </View>
          )}

          {/* Address list */}
          {isLoading ? null : (addresses ?? []).length === 0 && !showForm ? (
            <View className="items-center py-16 gap-3">
              <Ionicons name="location-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400">No saved addresses</Text>
              <Button title="Add Address" variant="outline" onPress={() => setShowForm(true)} />
            </View>
          ) : (
            (addresses ?? []).map((addr: any) => (
              <View key={addr.id} className="bg-white rounded-2xl p-5 gap-2">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {addr.first_name} {addr.last_name}
                    </Text>
                    <Text className="text-sm text-gray-500">{addr.address_1}</Text>
                    <Text className="text-sm text-gray-500">
                      {addr.city}, {addr.province} {addr.postal_code}
                    </Text>
                    {addr.phone ? <Text className="text-sm text-gray-500">{addr.phone}</Text> : null}
                  </View>
                  <Pressable onPress={() => deleteMutation.mutate(addr.id)} className="p-1">
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
