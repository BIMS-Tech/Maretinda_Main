import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/AuthScreen';
import { CaptchaCheck, type CaptchaState } from '@/components/CaptchaCheck';
import { FormError } from '@/components/FormError';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { MaskedText, Rise } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/auth';
import { getErrorMessage } from '@/lib/client';
import { PASSWORD_RULE, passwordChecks, passwordOk } from '@/lib/password';
import { colors } from '@/theme';

export default function RegisterScreen() {
  const { register, refreshCustomer } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<CaptchaState>({ required: null, token: '' });
  const [captchaKey, setCaptchaKey] = useState(0);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    setTries((n) => n + 1);
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setError('Please fill in all required fields');
      return;
    }
    if (!passwordOk(form.password)) {
      setError(PASSWORD_RULE);
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (captcha.required !== false && !captcha.token) {
      setError(
        captcha.required === null
          ? 'Please wait for the verification check to load'
          : 'Please complete the verification check',
      );
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
        captcha_token: captcha.token || undefined,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      // A token works once: get a fresh check for the next try
      setCaptchaKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  const checks = passwordChecks(form.password);

  return (
    <AuthScreen>
      <View style={{ gap: 20 }}>
        <View style={{ gap: 4 }}>
          <MaskedText delay={120} style={{ color: colors.ink, fontSize: 34, lineHeight: 40 }} text="Create account" />
          <Text style={{ color: colors.muted, fontSize: 14 }}>Join Maretinda today</Text>
        </View>

        {error ? <FormError again={tries}>{error}</FormError> : null}

        <Rise index={1} style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input autoCapitalize="words" label="First name" onChangeText={(v) => update('first_name', v)} placeholder="Juan" value={form.first_name} />
            </View>
            <View style={{ flex: 1 }}>
              <Input autoCapitalize="words" label="Last name" onChangeText={(v) => update('last_name', v)} placeholder="Dela Cruz" value={form.last_name} />
            </View>
          </View>
          <Input autoCapitalize="none" autoComplete="email" keyboardType="email-address" label="Email" onChangeText={(v) => update('email', v)} placeholder="you@example.com" value={form.email} />
          <Input keyboardType="phone-pad" label="Phone (optional)" onChangeText={(v) => update('phone', v)} placeholder="+63 912 345 6789" value={form.phone} />
          <View style={{ gap: 8 }}>
            <Input label="Password" onChangeText={(v) => update('password', v)} placeholder="At least 8 characters" secureTextEntry value={form.password} />
            {form.password.length > 0 && (
              <View style={{ columnGap: 14, flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 }}>
                <Check label="8+ characters" met={checks.long} />
                <Check label="Uppercase" met={checks.upper} />
                <Check label="Lowercase" met={checks.lower} />
                <Check label="Number or symbol" met={checks.digitOrSymbol} />
              </View>
            )}
          </View>
          <Input label="Confirm password" onChangeText={(v) => update('confirm_password', v)} placeholder="Type it again" secureTextEntry value={form.confirm_password} />
          <CaptchaCheck onChange={setCaptcha} resetKey={captchaKey} />
        </Rise>

        <Rise index={2}>
          <Button loading={loading} onPress={handleRegister} size="lg" title="Create account" />
        </Rise>

        <Rise index={3} style={{ gap: 14 }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
            <View style={{ backgroundColor: colors.line, flex: 1, height: 1 }} />
            <Text style={{ color: colors.faint, fontSize: 12 }}>or</Text>
            <View style={{ backgroundColor: colors.line, flex: 1, height: 1 }} />
          </View>
          <GoogleSignInButton
            label="Sign up with Google"
            onSuccess={async () => {
              await refreshCustomer();
              router.replace('/(tabs)');
            }}
          />
        </Rise>

        <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>Already have an account?</Text>
          <Link asChild href="/(auth)/login">
            <Pressable hitSlop={8}>
              <Text style={{ color: colors.purple, fontSize: 14, fontWeight: '700' }}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthScreen>
  );
}

function Check({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 5 }}>
      <Ionicons color={met ? colors.green : '#CFC8D6'} name={met ? 'checkmark-circle' : 'ellipse-outline'} size={14} />
      <Text style={{ color: met ? colors.green : colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
