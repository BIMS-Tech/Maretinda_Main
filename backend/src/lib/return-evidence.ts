import multer from "multer"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { fileMatchesDeclaredType } from "./file-signature"
import { savePrivateDocument } from "./private-documents"

/**
 * Photos and unboxing videos for return claims, and sellers' packing proof.
 * Kept private (private_document), never in the public media bucket, and
 * opened only by the buyer, the seller of that order, and admins.
 */
const PHOTO = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const VIDEO = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"]
export const MAX_PHOTO = 10 * 1024 * 1024
export const MAX_VIDEO = 60 * 1024 * 1024

// "file", or "files" as the other upload routes take it
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO, files: 1 } }).any()

export function handleEvidenceUpload(owner: (req: any) => Promise<{ type: "customer" | "seller"; id: string } | null>) {
  return async (req: any, res: any) => {
    const who = await owner(req)
    if (!who) return res.status(401).json({ message: "Unauthorized" })
    upload(req, res, async (err: any) => {
      if (err) {
        const tooBig = err?.code === "LIMIT_FILE_SIZE"
        return res.status(400).json({ message: tooBig ? "That file is too big. Videos up to 60 MB, photos up to 10 MB." : "Upload one photo or video at a time." })
      }
      const file = req.files?.[0]
      if (!file) return res.status(400).json({ message: "Choose a photo or video to upload." })
      const kind = PHOTO.includes(file.mimetype) ? "photo" : VIDEO.includes(file.mimetype) ? "video" : null
      if (!kind) return res.status(400).json({ message: "Use a photo (JPG, PNG, WebP) or a video (MP4, MOV, WebM)." })
      if (kind === "photo" && file.size > MAX_PHOTO) return res.status(400).json({ message: "Photos can be up to 10 MB." })
      if (!fileMatchesDeclaredType(file.buffer, file.mimetype)) return res.status(400).json({ message: "That file isn't the photo or video it says it is." })
      const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const path = await savePrivateDocument(pg, {
        file_name: String(file.originalname || `${kind}`).slice(0, 200),
        content_type: file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype,
        content: file.buffer,
      })
      const id = path.split("/").pop()!
      await pg("return_evidence").insert({ id, owner_type: who.type, owner_id: who.id, kind })
      res.status(201).json({ evidence: { id, kind, name: file.originalname, size: file.size } })
    })
  }
}

/** Streams one piece of evidence, with ranges so videos can be scrubbed. */
export async function sendEvidence(pg: any, id: string, req: any, res: any) {
  const doc = await pg("private_document").where("id", id).first("file_name", "content_type", "content")
  if (!doc) return res.status(404).json({ message: "Not found" })
  const body: Buffer = Buffer.from(doc.content)
  res.setHeader("Content-Type", doc.content_type)
  res.setHeader("Cache-Control", "private, no-store")
  res.setHeader("Accept-Ranges", "bytes")
  res.setHeader("Content-Disposition", `inline; filename="${String(doc.file_name).replace(/"/g, "")}"`)
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range ?? ""))
  if (range) {
    const start = range[1] ? Number(range[1]) : 0
    const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1
    if (start <= end && start < body.length) {
      res.status(206)
      res.setHeader("Content-Range", `bytes ${start}-${end}/${body.length}`)
      return res.send(body.subarray(start, end + 1))
    }
  }
  res.status(200).send(body)
}

/** Which evidence ids someone may open: their own uploads, and everything on their cases. */
export async function mayOpenEvidence(pg: any, id: string, who: { type: "customer" | "seller" | "admin"; id: string }): Promise<boolean> {
  const row = await pg("return_evidence").where("id", id).first("owner_type", "owner_id", "request_id")
  if (!row) return false
  if (who.type === "admin") return true
  if (row.owner_type === who.type && row.owner_id === who.id) return true
  if (!row.request_id) return false
  const c = await pg("return_case").where("request_id", row.request_id).first("customer_id", "seller_id")
  return !!c && (who.type === "customer" ? c.customer_id === who.id : c.seller_id === who.id)
}
