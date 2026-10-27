// Central place for cross-product URLs used across the marketing site.
// Env vars win when present; otherwise fall back to the production domains.
export const SELLER_URL =
  process.env.NEXT_PUBLIC_SELLER_URL || "https://seller.maretinda.com";
export const SELLER_REGISTER_URL = `${SELLER_URL}/register`;
export const SELLER_LOGIN_URL = `${SELLER_URL}/login`;

export const STORE_URL =
  process.env.NEXT_PUBLIC_STORE_URL || "https://maretinda.com";

// Legal pages and the help center live on the storefront, so both sites share one copy.
export const PRIVACY_URL = `${STORE_URL}/privacy`;
export const TERMS_URL = `${STORE_URL}/terms`;
export const HELP_CENTER_URL = `${STORE_URL}/help-center`;

// Same contact details as the storefront footer.
export const CONTACT_EMAIL = "maretinda@gmail.com";
export const OFFICE_ADDRESS = "KMC | Skyrise 4A & 4B, Cebu IT Park, Cebu City, 6000 Cebu";

// BIR registration of the operating company (BIMS Technologies, Inc.).
export const OPERATOR_NAME = "BIMS Technologies, Inc.";
export const BIR_RSN = "081RC20230000006303";
export const BIR_SEAL_SRC = "/certificates/bir-registration-seal.png";

// Social profiles are only rendered when a URL is configured — no dead "#" links.
export const SOCIAL_LINKS = [
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "TikTok", href: process.env.NEXT_PUBLIC_TIKTOK_URL },
].filter((s): s is { label: string; href: string } => Boolean(s.href));
