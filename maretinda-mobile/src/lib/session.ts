const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** The middle part of a session token, which says who it belongs to. The backend checks its signature on every call. */
export function tokenPayload(token: string | null | undefined): Record<string, unknown> {
  const body = token?.split('.')[1];
  if (!body) return {};
  let bits = 0;
  let value = 0;
  let text = '';
  for (const char of body.replace(/-/g, '+').replace(/_/g, '/')) {
    const at = ALPHABET.indexOf(char);
    if (at < 0) continue;
    value = (value << 6) | at;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      text += String.fromCharCode((value >> bits) & 255);
    }
  }
  try {
    const payload = JSON.parse(text);
    return payload && typeof payload === 'object' ? payload : {};
  } catch {
    return {};
  }
}

/**
 * Whether a token opens a shopper account. The backend checks a password
 * without looking at the account type, so a seller's password is answered with
 * a token that belongs to no shopper: keeping it left people half signed in.
 */
export function isShopperToken(token: string | null | undefined): token is string {
  const { actor_id, actor_type } = tokenPayload(token);
  return typeof actor_id === 'string' && actor_id.length > 0 && (actor_type === undefined || actor_type === 'customer');
}
