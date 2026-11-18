import crypto from "crypto"

/**
 * Time-based one-time passwords (RFC 6238), as used by Google Authenticator,
 * Microsoft Authenticator, 1Password and the like: a shared secret, a 30-second
 * step, 6 digits, HMAC-SHA1.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
export const STEP_SECONDS = 30

export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(text: string): Buffer {
  const clean = text.toUpperCase().replace(/[\s=-]/g, "")
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch)
    if (idx < 0) throw new Error("Invalid base32 secret")
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/** A new random secret, base32 (what authenticator apps take). */
export const generateSecret = () => base32Encode(crypto.randomBytes(20))

/** The code for a given time step. */
export function totpAt(secret: string, step: number, digits = 6): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(binary % 10 ** digits).padStart(digits, "0")
}

export const stepAt = (ms: number) => Math.floor(ms / 1000 / STEP_SECONDS)

/**
 * Checks a code against the current step and one step either side (clock
 * drift). Returns the matching step, or null. A step at or before `lastUsedStep`
 * is refused, so an intercepted code can't be replayed.
 */
export function verifyTotp(secret: string, code: string, now = Date.now(), lastUsedStep?: number | null): number | null {
  const clean = String(code ?? "").replace(/\s/g, "")
  if (!/^\d{6}$/.test(clean)) return null
  const current = stepAt(now)
  for (const step of [current - 1, current, current + 1]) {
    if (lastUsedStep != null && step <= lastUsedStep) continue
    const expected = totpAt(secret, step)
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return step
  }
  return null
}

/** The link an authenticator app reads from the QR code. */
export function otpauthUrl(secret: string, account: string, issuer = "Maretinda Admin"): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`
}
