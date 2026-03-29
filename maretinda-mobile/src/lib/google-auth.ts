import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { setToken } from './storage';
import { transferCart } from './cart';

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
  const token = params.get('token') ?? params.get('access_token');

  if (!token) return null;

  await setToken(token);
  await transferCart(token);
  return { token };
}
