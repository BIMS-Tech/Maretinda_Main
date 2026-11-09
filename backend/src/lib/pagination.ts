/**
 * Read a limit/offset from a query string. Negative numbers, NaN and values too
 * big for Postgres's bigint otherwise reach LIMIT/OFFSET and surface as a 500.
 */
export function clampInt(raw: unknown, { fallback, min = 0, max }: { fallback: number; min?: number; max: number }): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}
