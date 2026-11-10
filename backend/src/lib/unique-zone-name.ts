/**
 * Medusa keeps fulfillment set and service zone names unique across the whole
 * marketplace, so a second seller naming a zone "Philippines" got an error.
 * A taken name gets the seller's shop handle added: "Philippines (my-shop)".
 */
export async function uniqueZoneName(
  pg: any,
  table: "fulfillment_set" | "service_zone",
  name: string,
  handle: string
): Promise<string> {
  const taken = async (candidate: string) =>
    !!(await pg(table).where("name", candidate).whereNull("deleted_at").first("id"))

  if (!(await taken(name))) return name
  for (let n = 1; n <= 20; n++) {
    const candidate = n === 1 ? `${name} (${handle})` : `${name} (${handle} ${n})`
    if (!(await taken(candidate))) return candidate
  }
  return name
}
