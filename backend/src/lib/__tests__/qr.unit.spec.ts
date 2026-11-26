import { qrMatrix } from "../qr"

const finder = (m: boolean[][], top: number, left: number) => {
  const rows = ["1111111", "1000001", "1011101", "1011101", "1011101", "1000001", "1111111"]
  return rows.every((row, r) => [...row].every((v, c) => m[top + r][left + c] === (v === "1")))
}

describe("QR codes", () => {
  it("sizes itself to the text and carries the three finder patterns", () => {
    for (const [text, size] of [["HELLO", 21], ["https://maretinda.com/verify-invoice/ABCDEF0123456789", 33], ["x".repeat(106), 41]] as const) {
      const m = qrMatrix(text)
      expect(m.length).toBe(size)
      expect(m.every((row) => row.length === size)).toBe(true)
      expect(finder(m, 0, 0) && finder(m, 0, size - 7) && finder(m, size - 7, 0)).toBe(true)
      // Timing pattern between the finders
      for (let i = 8; i < size - 8; i++) expect(m[6][i]).toBe(i % 2 === 0)
    }
  })

  it("refuses text that doesn't fit", () => {
    expect(() => qrMatrix("x".repeat(107))).toThrow(/Too long/)
  })
})
