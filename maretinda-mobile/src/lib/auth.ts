import { client, statusOf } from './client';
import { isShopperToken } from './session';
import { removeCartId, removeToken, setToken } from './storage';

const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

/** Whose sign-in an accepted password is, when it opens no shopper account. */
export interface SignInAccount {
  kind: 'seller' | 'applicant' | 'unfinished' | 'other';
  email: string | null;
  shop_name?: string | null;
  can_shop: boolean;
  existing_shopper?: boolean;
}

/** The password was right, but it isn't a shopper's. */
export class NoShopperAccount extends Error {
  constructor(
    readonly account: SignInAccount,
    readonly token: string,
  ) {
    super('This sign-in has no shopping account yet.');
  }
}

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

async function checkPassword(email: string, password: string): Promise<string> {
  const attempt = async (address: string) =>
    (await client.post('/auth/customer/emailpass', { email: address, password })).data.token as string;
  try {
    return await attempt(email);
  } catch (err) {
    // Sign-ins match the email exactly as it was registered, and phones capitalise the first letter
    const lower = email.toLowerCase();
    if (statusOf(err) === 401 && lower !== email) return attempt(lower);
    throw err;
  }
}

export async function login({ email, password }: LoginParams): Promise<string> {
  let token: string;
  try {
    token = await checkPassword(email, password);
  } catch (err) {
    if ([400, 401].includes(statusOf(err) ?? 0)) throw new Error('Invalid email or password. Please try again.');
    throw err;
  }
  if (!isShopperToken(token)) {
    const { data } = await client.get('/store/auth/shopper-profile', bearer(token));
    throw new NoShopperAccount(data, token);
  }
  await setToken(token);
  return token;
}

/** Adds a shopping account to a sign-in that has none (a seller's, say) and signs in. */
export async function startShopping(signIn: string): Promise<string> {
  const { data } = await client.post('/store/auth/shopper-profile', {}, bearer(signIn));
  if (!isShopperToken(data.token)) throw new Error("We couldn't sign you in. Please try again.");
  await setToken(data.token);
  return data.token;
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
  const { data: registerData } = await client
    .post(
      '/auth/customer/emailpass/register',
      { email, password },
      captcha_token ? { headers: { 'x-captcha-token': captcha_token } } : undefined,
    )
    .catch((err) => {
      if (statusOf(err) === 401) {
        throw new Error("There's already a Maretinda account with this email. If it's your shop's, sign in with the same password to shop too.");
      }
      throw err;
    });
  const token = registerData.token as string;

  // Step 2: Create customer profile
  await client.post(
    '/store/customers',
    { email, first_name, last_name, phone },
    bearer(token),
  );

  // Step 3: Sign in, for a session that belongs to the new account
  return login({ email, password });
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
