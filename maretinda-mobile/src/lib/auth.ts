import { client } from './client';
import { removeCartId, removeToken, setToken } from './storage';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  /** Cloudflare Turnstile token, when the sign-up check is switched on */
  captcha_token?: string;
}

export async function login({ email, password }: LoginParams): Promise<string> {
  const { data } = await client.post('/auth/customer/emailpass', {
    email,
    password,
  });
  const token = data.token as string;
  await setToken(token);
  return token;
}

export async function register({
  email,
  password,
  first_name,
  last_name,
  phone,
  captcha_token,
}: RegisterParams): Promise<string> {
  // Step 1: Register credentials → get token
  const { data: registerData } = await client.post(
    '/auth/customer/emailpass/register',
    { email, password },
    captcha_token ? { headers: { 'x-captcha-token': captcha_token } } : undefined,
  );
  const token = registerData.token as string;
  await setToken(token);

  // Step 2: Create customer profile
  await client.post(
    '/store/customers',
    { email, first_name, last_name, phone },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  // Step 3: Login to get a fresh session token
  const { data: loginData } = await client.post('/auth/customer/emailpass', {
    email,
    password,
  });
  const freshToken = loginData.token as string;
  await setToken(freshToken);
  return freshToken;
}

export async function logout(): Promise<void> {
  await client.delete('/auth/session').catch(() => {});
  await removeToken();
  await removeCartId();
}

export async function getCustomer() {
  const { data } = await client.get('/store/customers/me', {
    params: { fields: '*orders' },
  });
  return data.customer;
}

export async function updateCustomer(body: Record<string, unknown>) {
  const { data } = await client.post('/store/customers/me', body);
  return data.customer;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await client.post('/auth/customer/emailpass/reset-password', { email });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await client.post('/auth/customer/emailpass/update-password', {
    token,
    password,
  });
}

/** Sends the signed-in buyer a new "confirm your email" link. Returns what to tell them. */
export async function resendEmailVerification(): Promise<string> {
  const { data } = await client.post('/store/email-verification/resend', {});
  if (data?.verified) return 'Your email is already confirmed. Try placing your order again.';
  return data?.sent
    ? `We sent a new link to ${data.email}. Open it, then come back and place your order.`
    : "We couldn't send the email just now. Please try again in a few minutes.";
}
