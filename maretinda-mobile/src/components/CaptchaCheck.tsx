import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const STOREFRONT_URL = (process.env.EXPO_PUBLIC_STOREFRONT_URL || 'https://maretinda.com').replace(/\/$/, '');

/**
 * What the sign-up needs from the check:
 * - `required: false` when the check is switched off (no Turnstile site key on
 *   the storefront) or couldn't load; the server has the final say either way.
 * - `token` once the person passes; empty while they haven't or it expired.
 */
export type CaptchaState = { required: boolean | null; token: string };

/**
 * Cloudflare Turnstile ("verify you are human") for the sign-up form, shown
 * from the storefront's /api/mobile-captcha page so it runs on an allowed
 * hostname. Change `resetKey` after each sign-up attempt: a token works once.
 */
export function CaptchaCheck({
  onChange,
  resetKey = 0,
}: {
  onChange: (state: CaptchaState) => void;
  resetKey?: number;
}) {
  const [hidden, setHidden] = useState(false);
  // Try again on each new attempt, in case it failed to load the first time
  useEffect(() => setHidden(false), [resetKey]);

  if (hidden) return null;
  return (
    <View style={{ height: 70, alignItems: 'center' }}>
      <WebView
        key={resetKey}
        source={{ uri: `${STOREFRONT_URL}/api/mobile-captcha` }}
        style={{ width: 310, height: 70, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => onChange({ required: null, token: '' })}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'off') {
              setHidden(true);
              onChange({ required: false, token: '' });
            } else if (message.type === 'token') {
              onChange({ required: true, token: String(message.token) });
            } else {
              onChange({ required: true, token: '' });
            }
          } catch {
            // Not ours
          }
        }}
        onError={() => {
          setHidden(true);
          onChange({ required: false, token: '' });
        }}
        onHttpError={() => {
          setHidden(true);
          onChange({ required: false, token: '' });
        }}
      />
    </View>
  );
}
