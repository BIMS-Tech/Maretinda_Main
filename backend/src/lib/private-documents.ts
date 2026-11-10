import crypto from "crypto"

/**
 * Seller applicants' documents (IDs, permits, tax forms). Kept in the
 * database rather than the media bucket, which is public, and opened only
 * through the admin route. A document's link is its admin path.
 */
export const DOCUMENT_PATH = "/admin/documents/"

export async function savePrivateDocument(
  pg: any,
  file: { file_name: string; content_type: string; content: Buffer; source_url?: string }
): Promise<string> {
  const id = `doc_${crypto.randomUUID().replace(/-/g, "")}`
  await pg("private_document").insert({ id, ...file })
  return `${DOCUMENT_PATH}${id}`
}

export async function readPrivateDocument(pg: any, id: string) {
  return (await pg("private_document").where("id", id).first("file_name", "content_type", "content")) ?? null
}
