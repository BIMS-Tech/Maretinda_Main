import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readSettlementFile, saveSettlementFile, SettlementKind } from "../lib/settlement-files"
import { createGCSService } from "../utils/google-cloud-storage"

/**
 * Settlement files used to be uploaded to the media bucket under settlement/,
 * which is public on R2. This copies each one into the private settlement_file
 * table, matched to its generation by file name. Copies already there are
 * left alone, so it's safe to run again.
 *
 * The public copies stay until you run it with DELETE_PUBLIC=1, which removes
 * only the ones safely copied. Never do that on the test server: it shares
 * the production bucket.
 *
 *   npx medusa exec ./src/scripts/secure-settlement-files.ts
 *   DELETE_PUBLIC=1 npx medusa exec ./src/scripts/secure-settlement-files.ts
 */
export default async function secureSettlementFiles({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const bucket = createGCSService()
  if (!bucket) {
    logger.info("No media bucket configured; nothing to do")
    return
  }
  const deletePublic = process.env.DELETE_PUBLIC === "1"

  let copied = 0
  let deleted = 0
  const unmatched: string[] = []
  for (const kind of ["tama", "dft"] as SettlementKind[]) {
    const keys = await bucket.listFiles(`settlement/${kind}/`)
    const hasTable = await pg.schema.hasTable(`${kind}_generation`)
    for (const key of keys) {
      const name = key.split("/").pop() as string
      // Uploads are named <timestamp>-<random>-<file name>
      const fileName = name.replace(/^\d+-[a-z0-9]+-/, "")
      const generation = hasTable
        ? await pg(`${kind}_generation`).where("file_name", fileName).first("id")
        : null
      if (!generation) {
        unmatched.push(key)
        continue
      }

      if (!(await readSettlementFile(pg, kind, generation.id))) {
        const content = await bucket.readBinaryFile(key)
        if (!content) {
          unmatched.push(key)
          continue
        }
        await saveSettlementFile(pg, {
          kind,
          generation_id: generation.id,
          file_name: fileName,
          content_type: fileName.endsWith(".xls") ? "application/vnd.ms-excel" : "text/plain",
          content,
        })
        copied++
      }

      if (deletePublic) {
        const result = await bucket.deleteFile(key)
        if (result.success) deleted++
      }
    }
  }

  logger.info(`Copied ${copied} settlement file(s) into the database`)
  if (unmatched.length) logger.warn(`No generation found for ${unmatched.length} public file(s), left in place: ${unmatched.join(", ")}`)
  logger.info(
    deletePublic
      ? `Deleted ${deleted} public copies`
      : "Public copies left in place; run with DELETE_PUBLIC=1 to remove the ones copied"
  )
}
