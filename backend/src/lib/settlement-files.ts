/**
 * Private storage for the settlement files sent to the banks. They list
 * sellers' account numbers, so they never go to the media bucket (public on
 * R2) or the server's disk: the database keeps them, and only the admin
 * download routes hand them out.
 */

export type SettlementKind = "tama" | "dft"

export type SettlementFile = {
  kind: SettlementKind
  generation_id: string
  file_name: string
  content_type: string
  content: Buffer
}

export async function saveSettlementFile(pg: any, file: SettlementFile) {
  await pg("settlement_file").insert(file).onConflict(["kind", "generation_id"]).merge()
}

export async function readSettlementFile(
  pg: any,
  kind: SettlementKind,
  generationId: string
): Promise<Omit<SettlementFile, "kind" | "generation_id"> | null> {
  const row = await pg("settlement_file")
    .where({ kind, generation_id: generationId })
    .first("file_name", "content_type", "content")
  return row ?? null
}

export async function deleteSettlementFile(pg: any, kind: SettlementKind, generationId: string) {
  await pg("settlement_file").where({ kind, generation_id: generationId }).delete()
}
