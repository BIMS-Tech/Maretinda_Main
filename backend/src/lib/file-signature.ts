/**
 * The declared MIME type on an upload is whatever the client typed, so an HTML
 * page can claim to be a PNG. Check the file's opening bytes against that claim.
 */

const startsWith = (b: Buffer, bytes: number[], offset = 0) =>
  b.length >= offset + bytes.length && bytes.every((v, i) => b[offset + i] === v)

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const ZIP = [0x50, 0x4b, 0x03, 0x04] // .docx and .xlsx are zip archives
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] // legacy .doc and .xls
const EBML = [0x1a, 0x45, 0xdf, 0xa3] // webm

const isMp4Family = (b: Buffer) => startsWith(b, ascii("ftyp"), 4)
const isRiffWebp = (b: Buffer) => startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8)

/** Plain text and CSV have no signature; refuse anything that looks like markup or a binary. */
const isPlainText = (b: Buffer) => {
  const head = b.subarray(0, 1024).toString("utf8").trimStart().toLowerCase()
  return !b.subarray(0, 1024).includes(0) && !/^<(!doctype|html|script|svg|\?xml)/.test(head)
}

const CHECKS: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  "image/jpg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  "image/png": (b) => startsWith(b, PNG),
  "image/gif": (b) => startsWith(b, ascii("GIF8")),
  "image/webp": isRiffWebp,
  "application/pdf": (b) => startsWith(b, ascii("%PDF-")),
  "application/msword": (b) => startsWith(b, OLE),
  "application/vnd.ms-excel": (b) => startsWith(b, OLE),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (b) => startsWith(b, ZIP),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (b) => startsWith(b, ZIP),
  "text/plain": isPlainText,
  "text/csv": isPlainText,
  "video/mp4": isMp4Family,
  "video/quicktime": isMp4Family,
  "video/x-m4v": isMp4Family,
  "video/webm": (b) => startsWith(b, EBML),
}

/** True only when the type is one we know and the bytes match it. */
export function fileMatchesDeclaredType(buffer: Buffer, mimetype: string): boolean {
  const check = CHECKS[mimetype]
  return Boolean(check && buffer?.length && check(buffer))
}
