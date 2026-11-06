/** Logo for the purple email header, served by the storefront this backend belongs to. */
export function emailLogo(alt: string, marginBottom = 0): string {
  const base = (
    process.env.STOREFRONT_URL ||
    process.env.STORE_URL ||
    "https://maretinda.com"
  ).replace(/\/$/, "")

  return `<img src="${base}/logo-email.png" alt="${alt}" width="240" height="38" style="display:inline-block;border:0;width:240px;max-width:100%;height:auto;margin-bottom:${marginBottom}px;">`
}
