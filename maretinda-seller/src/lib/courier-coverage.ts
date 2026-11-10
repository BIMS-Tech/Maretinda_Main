// Buyers and sellers write Metro Manila several ways
const PROVINCE_ALIASES: Record<string, string> = {
  ncr: 'metro manila',
  'national capital region': 'metro manila',
  manila: 'metro manila',
}
const provinceKey = (name: string) => {
  const key = name.toLowerCase().replace(/\s+/g, ' ').trim().replace(/^province of /, '')
  return PROVINCE_ALIASES[key] ?? key
}

/** Whether a carrier delivers to a province; a carrier with no list delivers anywhere. */
export function provinceCovered(name: string, covered: string[] | undefined): boolean {
  if (!covered?.length) return true
  return covered.some((c) => provinceKey(c) === provinceKey(name))
}
