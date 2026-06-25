// Central place for cross-product URLs used across the marketing site.
// Env vars win when present; otherwise fall back to the production domains.
export const SELLER_URL =
  process.env.NEXT_PUBLIC_SELLER_URL || "https://seller.maretinda.com";
export const SELLER_REGISTER_URL = `${SELLER_URL}/register`;
export const SELLER_LOGIN_URL = `${SELLER_URL}/login`;

export const STORE_URL =
  process.env.NEXT_PUBLIC_STORE_URL || "https://maretinda.com";
