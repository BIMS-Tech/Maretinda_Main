import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/auth';
import { getInitials } from '@/lib/utils';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
}

function MenuItem({ icon, label, onPress, badge }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 py-4 border-b border-border active:bg-surface"
    >
      <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
        <Ionicons name={icon as any} size={18} color="#5B1072" />
      </View>
      <Text className="flex-1 text-base text-gray-800">{label}</Text>
      {badge && (
        <View className="bg-primary rounded-full px-2 py-0.5">
          <Text className="text-white text-xs font-bold">{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { customer, logout, isLoading } = useAuth();

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6 gap-6">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <Ionicons name="person-outline" size={40} color="#5B1072" />
          </View>
          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-gray-900">
              Sign in to your account
            </Text>
            <Text className="text-center text-gray-500">
              Track orders, save your wishlist and more
            </Text>
          </View>
          <View className="w-full gap-3">
            <Button
              title="Sign In"
              size="lg"
              onPress={() => router.push('/(auth)/login')}
            />
            <Button
              title="Create Account"
              variant="outline"
              size="lg"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="bg-white px-5 py-6 flex-row items-center gap-4">
          <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-xl font-bold">
              {getInitials(customer.first_name, customer.last_name)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {customer.first_name} {customer.last_name}
            </Text>
            <Text className="text-sm text-gray-500">{customer.email}</Text>
          </View>
        </View>

        {/* Menu */}
        <View className="bg-white mt-3 px-5">
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push('/orders')}
          />
          <MenuItem
            icon="heart-outline"
            label="Wishlist"
            onPress={() => router.push('/wishlist')}
          />
          <MenuItem
            icon="location-outline"
            label="Saved Addresses"
            onPress={() => router.push('/addresses')}
          />
          <MenuItem
            icon="settings-outline"
            label="Account Settings"
            onPress={() => router.push('/settings')}
          />
        </View>

        <View className="px-5 mt-6 mb-8">
          <Button
            title="Sign Out"
            variant="outline"
            size="lg"
            loading={isLoading}
            onPress={logout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
