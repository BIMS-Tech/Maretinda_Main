/** Words as shoppers type them, so "Niño's T-Shirts" and "nino t shirt" meet. */

/** Lower case, no accents, letters and digits only. */
export const normalize = (text: unknown): string =>
  String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()

/** Plurals only: enough for "sneakers" to find "sneaker" without mangling names. */
export const stem = (word: string): string => {
  if (word.length <= 3 || /\d/.test(word)) return word
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`
  if (/(ss|us|is)$/.test(word)) return word
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2)
  return word.endsWith("s") ? word.slice(0, -1) : word
}

export const words = (text: unknown): string[] => {
  const n = normalize(text)
  return n ? n.split(" ") : []
}

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "for", "of", "in", "with", "to", "ng", "sa", "na", "ang", "mga", "para", "po"])

/** The words of a query that carry meaning; all of them if none do. */
export const queryWords = (query: unknown): string[] => {
  const all = words(query).slice(0, 12)
  const meaningful = all.filter((w) => !STOP_WORDS.has(w))
  return meaningful.length ? meaningful : all
}

/**
 * Edits (including swapped neighbours) between two words, or more than `max`
 * as soon as that is certain.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let beforeLast: number[] = []
  let last = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let d = Math.min(last[j] + 1, row[j - 1] + 1, last[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, beforeLast[j - 2] + 1)
      row.push(d)
      if (d < best) best = d
    }
    if (best > max) return max + 1
    beforeLast = last
    last = row
  }
  return last[b.length]
}

/** How many typos to forgive: none in short words, where they'd match anything. */
export const typosAllowed = (word: string): number => (/\d/.test(word) || word.length < 4 ? 0 : word.length < 8 ? 1 : 2)

/**
 * Filipino and everyday names for what listings usually call something else.
 * Each side is searched for the other.
 */
const SAME_AS: string[][] = [
  ["sapatos", "shoes", "sneakers", "footwear"],
  ["tsinelas", "slippers", "sandals", "flip flops"],
  ["damit", "clothes", "apparel"],
  ["pantalon", "pants", "trousers"],
  ["palda", "skirt"],
  ["sumbrero", "hat", "cap"],
  ["relo", "watch"],
  ["alahas", "jewelry", "jewellery"],
  ["pabango", "perfume", "fragrance"],
  ["salamin", "eyeglasses", "mirror"],
  ["payong", "umbrella"],
  ["cp", "cellphone", "selpon", "phone", "smartphone"],
  ["aircon", "air conditioner", "ac"],
  ["ref", "refrigerator", "fridge"],
  ["bentilador", "electric fan", "fan"],
  ["kaldero", "cooking pot", "pot"],
  ["kawali", "frying pan", "pan"],
  ["kutsilyo", "knife"],
  ["upuan", "chair"],
  ["lamesa", "mesa", "table"],
  ["kama", "bed"],
  ["kumot", "blanket"],
  ["unan", "pillow"],
  ["kurtina", "curtain"],
  ["laruan", "toy"],
  ["sabon", "soap"],
  ["bigas", "rice"],
  ["gatas", "milk"],
  ["kape", "coffee"],
  ["tinapay", "bread"],
  ["itlog", "egg"],
  ["manok", "chicken"],
  ["baboy", "pork"],
  ["baka", "beef"],
  ["isda", "fish"],
  ["gulay", "vegetable"],
  ["prutas", "fruit"],
  ["asukal", "sugar"],
  ["asin", "salt"],
  ["tv", "television"],
  ["tee", "t shirt", "tshirt", "shirt"],
  ["kicks", "sneakers"],
]

const ALTERNATIVES = new Map<string, string[][]>()
for (const group of SAME_AS) {
  for (const entry of group) {
    const key = stem(normalize(entry))
    if (key.includes(" ")) continue
    const others = group.filter((g) => g !== entry).map((g) => words(g).map(stem))
    ALTERNATIVES.set(key, [...(ALTERNATIVES.get(key) ?? []), ...others])
  }
}

/** Other ways of saying a word, each as the words it takes. */
export const alternativesFor = (word: string): string[][] => ALTERNATIVES.get(stem(word)) ?? []
