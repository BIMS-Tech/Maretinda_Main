/**
 * Flying Tigers only accepts PH mobiles as +639XXXXXXXXX. Sellers and buyers
 * usually type the local 09XX form, so convert the common spellings and
 * return null for anything that is not a PH mobile.
 */
export function toPhMobile(phone: string): string | null {
  const digits = String(phone ?? '').replace(/[^\d]/g, '')
  const local = digits.startsWith('63')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits
  return /^9\d{9}$/.test(local) ? `+63${local}` : null
}
