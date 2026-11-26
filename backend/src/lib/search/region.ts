import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** The region a search is priced in: the one asked for, or the store's first. */
export async function searchRegion(container: any, regionId?: unknown): Promise<{ currency_code: string; region_id?: string }> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const id = typeof regionId === "string" && regionId ? regionId : null
  const region =
    (id && (await pg("region").where("id", id).whereNull("deleted_at").first("id", "currency_code"))) ||
    (await pg("region").whereNull("deleted_at").orderBy("created_at").first("id", "currency_code"))
  return region ? { currency_code: region.currency_code, region_id: region.id } : { currency_code: "php" }
}
