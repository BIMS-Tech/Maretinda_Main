import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  coveredProvince,
  getFlyingTigersBarangays,
  getFlyingTigersCoveredCities,
  getFlyingTigersCoveredProvinces,
  resolveFlyingTigersArea,
} from '../../../../../services/flyingtigers'

export type Area = { code: string; label: string }
type Match = { province: Area | null; city: Area | null; barangay: Area | null }

/**
 * A carrier that books only to the places on its own list, by their codes.
 * Carriers without one deliver anywhere in the Philippines and the booking
 * form uses the full province and city list instead.
 */
type AreaList = {
  provinces(creds: Record<string, unknown>): Promise<Area[]>
  cities(provinceCode: string): Promise<Area[]>
  barangays(cityCode: string): Promise<Area[]>
  match(creds: Record<string, unknown>, province: string, city: string, barangay: string): Promise<Match>
}

const flyingTigers: AreaList = {
  provinces: async (creds) =>
    (await getFlyingTigersCoveredProvinces(String(creds.api_key ?? ''), String(creds.api_secret ?? ''))).map((p) => ({
      code: p.provinceCode,
      label: p.provinceLabel,
    })),
  cities: async (code) => (await getFlyingTigersCoveredCities(code)).map((c) => ({ code: c.cityCode, label: c.cityLabel })),
  barangays: async (code) => (await getFlyingTigersBarangays(code)).map((b) => ({ code: b.barangayCode, label: b.barangayLabel })),
  async match(creds, province, city, barangay) {
    const all = await getFlyingTigersCoveredProvinces(String(creds.api_key ?? ''), String(creds.api_secret ?? ''))
    const p = coveredProvince(province, all)
    if (!p) return { province: null, city: null, barangay: null }
    const area = await resolveFlyingTigersArea(p, city, barangay)
    return {
      province: { code: p.provinceCode, label: p.provinceLabel },
      city: area.city && { code: area.city.cityCode, label: area.city.cityLabel },
      barangay: area.barangay && { code: area.barangay.barangayCode, label: area.barangay.barangayLabel },
    }
  },
}

const AREA_LISTS: Record<string, AreaList> = { flyingtigers: flyingTigers }

const one = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 120) : '')

/**
 * GET /vendor/shipping-providers/:provider_id/areas — where the chosen carrier
 * picks up and delivers, for the booking form's province → city → barangay:
 *   (nothing)                   → { restricted, provinces }
 *   ?province_code=             → { cities }
 *   ?city_code=                 → { barangays }
 *   ?match=1&province=&city=&barangay=  → { match }: the listed places an order's
 *                                  typed address means, each null when unknown
 * A carrier without its own list answers { restricted: false }.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const id = req.params.provider_id
  const carrier = await pg('platform_shipping_provider')
    .where({ provider_id: id, is_active: true })
    .whereNull('deleted_at')
    .first('credentials')
  if (!carrier) return res.status(404).json({ message: 'This carrier is not available.' })

  const list = AREA_LISTS[id]
  if (!list) return res.json({ restricted: false })

  const creds = (typeof carrier.credentials === 'string' ? JSON.parse(carrier.credentials) : carrier.credentials) ?? {}
  const q = req.query as Record<string, unknown>
  try {
    if (one(q.city_code)) return res.json({ barangays: await list.barangays(one(q.city_code)) })
    if (one(q.province_code)) return res.json({ cities: await list.cities(one(q.province_code)) })
    if (q.match) return res.json({ match: await list.match(creds, one(q.province), one(q.city), one(q.barangay)) })
    res.json({ restricted: true, provinces: await list.provinces(creds) })
  } catch (e: any) {
    res.status(502).json({ message: e?.message ?? "Couldn't load where this carrier delivers. Try again." })
  }
}
