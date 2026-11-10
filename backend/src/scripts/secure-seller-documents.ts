import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DOCUMENT_PATH, savePrivateDocument } from "../lib/private-documents"
import { createGCSService } from "../utils/google-cloud-storage"

/**
 * Seller applicants' documents used to go to the public media bucket. This
 * copies each one still linked from a seller application or a seller's
 * verification into the private_document table and points the link there.
 * Links already private are skipped, so it's safe to run again.
 *
 * The public copies stay until you run it with DELETE_PUBLIC=1, which removes
 * every public copy already moved (each document remembers where it came
 * from). Never do that on the test server: it shares the production bucket.
 *
 *   npx medusa exec ./src/scripts/secure-seller-documents.ts
 *   DELETE_PUBLIC=1 npx medusa exec ./src/scripts/secure-seller-documents.ts
 */
export default async function secureSellerDocuments({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const bucket = createGCSService()
  const publicBase = (process.env.S3_FILE_URL || "").replace(/\/$/, "")
  if (!bucket || !publicBase) {
    logger.info("No media bucket configured; nothing to do")
    return
  }
  const deletePublic = process.env.DELETE_PUBLIC === "1"

  const copied = new Map<string, string>() // public URL -> private link
  const failed: string[] = []

  const secure = async (docs: Record<string, unknown> | null) => {
    if (!docs || typeof docs !== "object") return null
    let changed = false
    const next: Record<string, unknown> = { ...docs }
    for (const [key, value] of Object.entries(docs)) {
      if (typeof value !== "string" || value.startsWith(DOCUMENT_PATH) || !value.startsWith(`${publicBase}/`)) continue
      let link = copied.get(value)
      if (!link) {
        const objectKey = decodeURIComponent(value.slice(publicBase.length + 1))
        const content = await bucket.readBinaryFile(objectKey)
        if (!content) {
          failed.push(value)
          continue
        }
        const name = objectKey.split("/").pop() as string
        link = await savePrivateDocument(pg, {
          file_name: name.replace(/^\d+-[a-z0-9]+-/, ""),
          content_type: /\.pdf$/i.test(name) ? "application/pdf" : /\.png$/i.test(name) ? "image/png" : "image/jpeg",
          content,
          source_url: value,
        })
        copied.set(value, link)
      }
      next[key] = link
      changed = true
    }
    return changed ? next : null
  }

  for (const app of await pg("seller_application").whereNotNull("documents").select("id", "documents")) {
    const next = await secure(app.documents)
    if (next) await pg("seller_application").where("id", app.id).update({ documents: JSON.stringify(next) })
  }
  for (const seller of await pg("seller").whereNotNull("business_documents").select("id", "business_documents")) {
    const next = await secure(seller.business_documents)
    if (next) await pg("seller").where("id", seller.id).update({ business_documents: JSON.stringify(next) })
  }

  let deleted = 0
  if (deletePublic) {
    const moved = await pg("private_document").whereNotNull("source_url").select("id", "source_url")
    for (const doc of moved) {
      if (!doc.source_url.startsWith(`${publicBase}/`)) continue
      const result = await bucket.deleteFile(decodeURIComponent(doc.source_url.slice(publicBase.length + 1)))
      if (result.success) {
        await pg("private_document").where("id", doc.id).update({ source_url: null })
        deleted++
      }
    }
  }

  logger.info(`Moved ${copied.size} seller document(s) out of the public bucket`)
  if (failed.length) logger.warn(`Couldn't read ${failed.length} document(s), links left as they were: ${failed.join(", ")}`)
  logger.info(
    deletePublic ? `Deleted ${deleted} public copies` : "Public copies left in place; run with DELETE_PUBLIC=1 to remove them"
  )
}
