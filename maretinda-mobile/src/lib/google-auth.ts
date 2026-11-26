import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { startShopping } from './auth';
import { transferCart } from './cart';
import { isShopperToken } from './session';
import { setToken } from './storage';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<{ token: string } | null> {
  // Deep link that the backend will redirect to after Google OAuth
  const redirectUri = Linking.createURL('/auth/google/callback');

  const authUrl =
    `${BACKEND_URL}/auth/customer/google?` +
    `redirectTo=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success') return null;

  // Extract token from URL params
  const url = result.url;
  const params = new URL(url).searchParams;
  const signIn = params.get('token') ?? params.get('access_token');

  if (!signIn) return null;

  // The first time, Google has signed them in but there is no shopping account yet
  const token = isShopperToken(signIn) ? signIn : await startShopping(signIn);
  await setToken(token);
  await transferCart(token);
  return { token };
}
