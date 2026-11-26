/**
 * A small QR encoder (byte mode, error correction M, versions 1–6: up to 106
 * bytes) for the verification link on invoices. Enough for one short URL, so
 * no extra package is needed. Returns rows of dark/light modules.
 */

// version: [error correction codewords per block, data codewords of each block]
const VERSIONS: [number, number[]][] = [
  [10, [16]],
  [16, [28]],
  [26, [44]],
  [18, [32, 32]],
  [24, [43, 43]],
  [16, [27, 27, 27, 27]],
]
const ALIGNMENT = [0, 18, 22, 26, 30, 34]

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x
  LOG[x] = i
  x <<= 1
  if (x & 0x100) x ^= 0x11d
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0)

function errorCorrection(data: number[], count: number): number[] {
  let generator = [1]
  for (let i = 0; i < count; i++) {
    const next = new Array(generator.length + 1).fill(0)
    generator.forEach((g, j) => {
      next[j] ^= g
      next[j + 1] ^= mul(g, EXP[i])
    })
    generator = next
  }
  const rest = [...data, ...new Array(count).fill(0)]
  for (let i = 0; i < data.length; i++) {
    const factor = rest[i]
    if (factor) generator.forEach((g, j) => (rest[i + j] ^= mul(g, factor)))
  }
  return rest.slice(data.length)
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

function penalty(m: boolean[][]): number {
  const n = m.length
  let score = 0
  const lines: boolean[][] = [...m, ...m.map((_, c) => m.map((row) => row[c]))]
  for (const line of lines) {
    for (let i = 0, run = 1; i < n; i++, run++) {
      if (i + 1 === n || line[i + 1] !== line[i]) {
        if (run >= 5) score += run - 2
        run = 0
      }
    }
    const s = line.map((d) => (d ? "1" : "0")).join("")
    for (const pattern of ["10111010000", "00001011101"]) {
      for (let at = s.indexOf(pattern); at !== -1; at = s.indexOf(pattern, at + 1)) score += 40
    }
  }
  for (let r = 0; r + 1 < n; r++) {
    for (let c = 0; c + 1 < n; c++) {
      if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) score += 3
    }
  }
  const dark = m.flat().filter(Boolean).length
  return score + Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10
}

export function qrMatrix(text: string): boolean[][] {
  const bytes = [...Buffer.from(text, "utf8")]
  const index = VERSIONS.findIndex(([, blocks]) => blocks.reduce((a, b) => a + b, 0) >= bytes.length + 2)
  if (index === -1) throw new Error("Too long for a QR code")
  const version = index + 1
  const [ecCount, blockSizes] = VERSIONS[index]
  const capacity = blockSizes.reduce((a, b) => a + b, 0)

  // Mode 0100, 8-bit length, the bytes, terminator, then alternating padding
  let bits = "0100" + bytes.length.toString(2).padStart(8, "0") + bytes.map((b) => b.toString(2).padStart(8, "0")).join("")
  bits += "0".repeat(Math.min(4, capacity * 8 - bits.length))
  bits += "0".repeat((8 - (bits.length % 8)) % 8)
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8), 2))
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad)

  const blocks: number[][] = []
  for (let at = 0, i = 0; i < blockSizes.length; at += blockSizes[i], i++) blocks.push(data.slice(at, at + blockSizes[i]))
  const ec = blocks.map((b) => errorCorrection(b, ecCount))
  const stream: number[] = []
  for (let i = 0; i < Math.max(...blockSizes); i++) for (const b of blocks) if (i < b.length) stream.push(b[i])
  for (let i = 0; i < ecCount; i++) for (const b of ec) stream.push(b[i])
  const payload = stream.flatMap((b) => [...b.toString(2).padStart(8, "0")].map((x) => x === "1"))

  const size = 17 + version * 4
  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const put = (r: number, c: number, dark: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return
    modules[r][c] = dark
    fixed[r][c] = true
  }
  for (const [top, left] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3))
        put(top + r, left + c, ring <= 3 && ring !== 2)
      }
    }
  }
  for (let i = 8; i < size - 8; i++) {
    put(6, i, i % 2 === 0)
    put(i, 6, i % 2 === 0)
  }
  if (version > 1) {
    const at = ALIGNMENT[index]
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) put(at + r, at + c, Math.max(Math.abs(r), Math.abs(c)) !== 1)
  }
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      fixed[8][i] = true
      fixed[i][8] = true
    }
    if (i < 8) {
      fixed[8][size - 1 - i] = true
      fixed[size - 1 - i][8] = true
    }
  }
  put(size - 8, 8, true)

  let bit = 0
  for (let right = size - 1, up = true; right > 0; right -= 2, up = !up) {
    if (right === 6) right--
    for (let i = 0; i < size; i++) {
      const r = up ? size - 1 - i : i
      for (const c of [right, right - 1]) if (!fixed[r][c]) modules[r][c] = payload[bit++] ?? false
    }
  }

  const masked = (mask: number) => {
    const m = modules.map((row, r) => row.map((d, c) => (fixed[r][c] ? d : d !== MASKS[mask](r, c))))
    // Format: level M (00) and the mask, with its error correction
    let rem = mask
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537)
    const format = ((mask << 10) | rem) ^ 0x5412
    const on = (i: number) => ((format >> i) & 1) === 1
    for (let i = 0; i <= 5; i++) m[i][8] = on(i)
    m[7][8] = on(6)
    m[8][8] = on(7)
    m[8][7] = on(8)
    for (let i = 9; i < 15; i++) m[8][14 - i] = on(i)
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = on(i)
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = on(i)
    m[size - 8][8] = true
    return m
  }
  return MASKS.map((_, i) => masked(i)).reduce((best, m) => (penalty(m) < penalty(best) ? m : best))
}
