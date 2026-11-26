import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, ZoomIn } from 'react-native-reanimated';

import { AuthScreen } from '@/components/AuthScreen';
import { FormError } from '@/components/FormError';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { EASE_OUT, MaskedText, Rise } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth';
import { NoShopperAccount } from '@/lib/auth';
import { getErrorMessage } from '@/lib/client';
import { colors } from '@/theme';

const SELLER_URL = process.env.EXPO_PUBLIC_SELLER_URL || 'https://seller.maretinda.com';

export default function LoginScreen() {
  const { login, refreshCustomer } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [other, setOther] = useState<NoShopperAccount | null>(null);

  async function handleLogin() {
    setTries((n) => n + 1);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      if (err instanceof NoShopperAccount) setOther(err);
      else setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen>
      {other ? (
        <OtherAccount
          found={other}
          onBack={() => {
            setOther(null);
            setPassword('');
          }}
        />
      ) : (
        <Animated.View exiting={FadeOutLeft.duration(180)} style={{ gap: 22 }}>
          <View style={{ gap: 4 }}>
            <MaskedText delay={120} style={{ color: colors.ink, fontSize: 34, lineHeight: 40 }} text="Welcome back" />
            <Text style={{ color: colors.muted, fontSize: 14 }}>Sign in to continue</Text>
          </View>

          {error ? <FormError again={tries}>{error}</FormError> : null}

          <Rise index={1} style={{ gap: 14 }}>
            <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" label="Email" onChangeText={setEmail} placeholder="you@example.com" value={email} />
            <Input autoComplete="password" label="Password" onChangeText={setPassword} onSubmitEditing={handleLogin} placeholder="Your password" secureTextEntry value={password} />
            <Link asChild href="/(auth)/forgot-password">
              <Pressable hitSlop={8} style={{ alignSelf: 'flex-end' }}>
                <Text style={{ color: colors.purple, fontSize: 13.5, fontWeight: '600' }}>Forgot password?</Text>
              </Pressable>
            </Link>
          </Rise>

          <Rise index={2}>
            <Button loading={loading} onPress={handleLogin} size="lg" title="Sign in" />
          </Rise>

          <Rise index={3} style={{ gap: 14 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
              <View style={{ backgroundColor: colors.line, flex: 1, height: 1 }} />
              <Text style={{ color: colors.faint, fontSize: 12 }}>or</Text>
              <View style={{ backgroundColor: colors.line, flex: 1, height: 1 }} />
            </View>
            <GoogleSignInButton
              label="Continue with Google"
              onSuccess={async () => {
                await refreshCustomer();
                router.replace('/(tabs)');
              }}
            />
          </Rise>

          <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>No account yet?</Text>
            <Link asChild href="/(auth)/register">
              <Pressable hitSlop={8}>
                <Text style={{ color: colors.purple, fontSize: 14, fontWeight: '700' }}>Create one</Text>
              </Pressable>
            </Link>
          </View>
        </Animated.View>
      )}
    </AuthScreen>
  );
}

/**
 * The password was right, but it opens something other than a shopping
 * account. Says what, and offers to shop with the same sign-in.
 */
function OtherAccount({ found, onBack }: { found: NoShopperAccount; onBack: () => void }) {
  const { startShopping } = useAuth();
  const { account, token } = found;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);
  const isShop = account.kind === 'seller' || account.kind === 'applicant';

  const words = {
    applicant: ['Your shop application', `${account.email ?? 'This email'} is being used to apply for a shop on Maretinda. You can shop with it too, while you wait.`],
    other: ['This sign-in is for work', 'It belongs to the Maretinda team and has no shopping account.'],
    seller: [`This is ${account.shop_name || 'your shop'}’s account`, 'It opens your seller dashboard. You can shop with the same email and password too.'],
    unfinished: ['Almost there', 'Your sign-up never finished. Continue, and your account is ready.'],
  }[account.kind];

  async function start() {
    setTries((n) => n + 1);
    setError('');
    setLoading(true);
    try {
      await startShopping(token);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Animated.View entering={FadeInRight.duration(420).easing(EASE_OUT)} style={{ gap: 18 }}>
      <Animated.View entering={ZoomIn.springify().damping(13).delay(120)} style={{ alignItems: 'center', backgroundColor: colors.lilac, borderRadius: 999, height: 68, justifyContent: 'center', width: 68 }}>
        <Ionicons color={colors.purple} name={isShop ? 'storefront-outline' : 'person-outline'} size={30} />
      </Animated.View>
      <View style={{ gap: 6 }}>
        <MaskedText style={{ color: colors.ink, fontSize: 28, lineHeight: 34 }} text={words[0]} />
        <Text style={{ color: colors.muted, fontSize: 14.5, lineHeight: 21 }}>{words[1]}</Text>
      </View>
      {error ? <FormError again={tries}>{error}</FormError> : null}
      {account.existing_shopper ? (
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>There’s already a shopping account with this email. Sign in with Google, or reset its password.</Text>
      ) : null}
      <View style={{ gap: 10 }}>
        {account.can_shop && <Button loading={loading} onPress={start} size="lg" title={account.kind === 'unfinished' ? 'Finish signing up' : 'Start shopping'} />}
        {isShop && <Button onPress={() => Linking.openURL(SELLER_URL)} size="lg" title="Open Seller Center" variant="outline" />}
        <Button onPress={onBack} title="Use a different account" variant="ghost" />
      </View>
    </Animated.View>
  );
}
