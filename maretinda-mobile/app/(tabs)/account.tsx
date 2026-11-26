import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaskedText, Press, Rise } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/auth';
import { getInitials } from '@/lib/utils';
import { colors, serif } from '@/theme';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
}

function MenuItem({ icon, label, onPress, badge }: MenuItemProps) {
  return (
    <Press onPress={onPress} scale={0.98} style={{ alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 13 }}>
      <View style={{ alignItems: 'center', backgroundColor: colors.lilac, borderRadius: 999, height: 42, justifyContent: 'center', width: 42 }}>
        <Ionicons color={colors.purple} name={icon as any} size={19} />
      </View>
      <Text style={{ color: colors.ink, flex: 1, fontSize: 15.5, fontWeight: '600' }}>{label}</Text>
      {badge && (
        <View style={{ backgroundColor: colors.yellow, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: colors.purple, fontSize: 12, fontWeight: '800' }}>{badge}</Text>
        </View>
      )}
      <Ionicons color={colors.faint} name="chevron-forward" size={17} />
    </Press>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customer, logout, isLoading } = useAuth();

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View style={{ alignItems: 'center', flex: 1, gap: 22, justifyContent: 'center', paddingHorizontal: 28 }}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', backgroundColor: colors.lilac, borderRadius: 999, height: 88, justifyContent: 'center', width: 88 }}>
            <Ionicons color={colors.purple} name="person-outline" size={38} />
          </Animated.View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <MaskedText style={{ color: colors.ink, fontSize: 30, lineHeight: 36 }} text="Good to see you" />
            <Text style={{ color: colors.muted, fontSize: 14.5, textAlign: 'center' }}>Sign in to follow your orders and keep a wishlist.</Text>
          </View>
          <Rise delay={140} style={{ alignSelf: 'stretch', gap: 10 }}>
            <Button onPress={() => router.push('/(auth)/login')} size="lg" title="Sign in" />
            <Button onPress={() => router.push('/(auth)/register')} size="lg" title="Create account" variant="outline" />
          </Rise>
        </View>
      </SafeAreaView>
    );
  }

  const menu = [
    { href: '/orders', icon: 'receipt-outline', label: 'My orders' },
    { href: '/wishlist', icon: 'heart-outline', label: 'Wishlist' },
    { href: '/addresses', icon: 'location-outline', label: 'Saved addresses' },
    { href: '/settings', icon: 'settings-outline', label: 'Account settings' },
  ] as const;

  return (
    <View style={{ backgroundColor: colors.cream, flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.purple, '#2A1B3E']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, gap: 14, paddingBottom: 30, paddingHorizontal: 22, paddingTop: insets.top + 22 }}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', backgroundColor: colors.yellow, borderRadius: 999, height: 66, justifyContent: 'center', width: 66 }}>
            <Text style={{ color: colors.purple, fontFamily: serif, fontSize: 26 }}>{getInitials(customer.first_name, customer.last_name) || customer.email[0]?.toUpperCase()}</Text>
          </Animated.View>
          <View>
            <MaskedText style={{ color: colors.white, fontSize: 30, lineHeight: 36 }} text={`Hello, ${customer.first_name || 'there'}`} />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5 }}>{customer.email}</Text>
          </View>
        </LinearGradient>

        <View style={{ backgroundColor: colors.white, borderRadius: 24, margin: 16, paddingHorizontal: 16, paddingVertical: 6 }}>
          {menu.map((item, i) => (
            <Rise index={i} key={item.href}>
              <MenuItem icon={item.icon} label={item.label} onPress={() => router.push(item.href)} />
            </Rise>
          ))}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <Button loading={isLoading} onPress={logout} size="lg" title="Sign out" variant="outline" />
        </View>
      </ScrollView>
    </View>
  );
}
