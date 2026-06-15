import { AbstractFulfillmentProviderService } from '@medusajs/framework/utils'
import type {
  CalculatedShippingOptionPrice,
  FulfillmentOption,
  CreateFulfillmentResult,
} from '@medusajs/types'

// ─── Weight-Based Tier Rates (PHP) ───────────────────────────────────────────
// These reflect Maretinda's negotiated carrier rates.
// Update these when actual NinjaVan/Flying Tigers contracts are confirmed.

type Tier = { maxKg: number; rate: number }

const TIERS: Record<string, { tiers: Tier[]; extraBase: number; extraPerKg: number }> = {
  Standard: {
    tiers: [
      { maxKg: 0.5, rate: 85 },
      { maxKg: 1,   rate: 100 },
      { maxKg: 3,   rate: 130 },
      { maxKg: 5,   rate: 180 },
    ],
    extraBase: 180,
    extraPerKg: 20,
  },
  Express: {
    tiers: [
      { maxKg: 0.5, rate: 120 },
      { maxKg: 1,   rate: 145 },
      { maxKg: 3,   rate: 185 },
      { maxKg: 5,   rate: 250 },
    ],
    extraBase: 250,
    extraPerKg: 30,
  },
}

const COD_SURCHARGE_PHP = 20

function getTieredRate(weightKg: number, serviceType: string): number {
  const config = TIERS[serviceType] ?? TIERS.Standard
  const tier = config.tiers.find((t) => weightKg <= t.maxKg)
  if (tier) return tier.rate
  return config.extraBase + Math.ceil((weightKg - 5) * config.extraPerKg)
}

// ─── Volumetric / Chargeable Weight ──────────────────────────────────────────
// Carriers charge whichever is higher: actual vs volumetric (L×W×H / 5000).
// Medusa stores variant dimensions in cm and weight in grams.

function getChargeableWeightKg(variant: any): number {
  const actualKg = (variant?.weight ?? 0) / 1000
  if (variant?.length && variant?.width && variant?.height) {
    const volKg = (variant.length * variant.width * variant.height) / 5000
    return Math.max(actualKg, volKg)
  }
  return actualKg
}

// ─── Provider ─────────────────────────────────────────────────────────────────

class MaretindaShippingProviderService extends AbstractFulfillmentProviderService {
  static identifier = 'maretinda-shipping'

  // ── Fulfillment Options ─────────────────────────────────────────────────────
  // Shown when vendor/admin creates a shipping option and selects this provider.
  // The admin picks one — its data is stored in shipping_option.data.

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: 'standard',
        name: 'Standard Delivery (2–5 days)',
        service_type: 'Standard',
        is_cod: false,
      },
      {
        id: 'express',
        name: 'Express Delivery (1–2 days)',
        service_type: 'Express',
        is_cod: false,
      },
      {
        id: 'cod-standard',
        name: 'Cash on Delivery — Standard (2–5 days)',
        service_type: 'Standard',
        is_cod: true,
      },
    ]
  }

  // ── Can Calculate ───────────────────────────────────────────────────────────
  // Must return true for "Calculated" price type shipping options to be creatable.

  async canCalculate(): Promise<boolean> {
    return true
  }

  // ── Validate Option ─────────────────────────────────────────────────────────
  // Called when a shipping option is saved. Validate the option data is usable.

  async validateOption(data: Record<string, any>): Promise<boolean> {
    return typeof data.id === 'string' && data.id.length > 0
  }

  // ── Validate Fulfillment Data ───────────────────────────────────────────────
  // Called when customer selects this shipping option at checkout.
  // Passes through option data so calculatePrice can access service_type.

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
  ): Promise<any> {
    return {
      ...data,
      service_type: optionData.service_type ?? 'Standard',
      is_cod: optionData.is_cod ?? false,
    }
  }

  // ── Calculate Price ─────────────────────────────────────────────────────────
  // Called on every cart refresh when this shipping method is selected.
  // This is the core of the calculated rate feature.

  async calculatePrice(
    optionData: Record<string, unknown>,
    _data: Record<string, unknown>,
    context: any,
  ): Promise<CalculatedShippingOptionPrice> {
    const items: any[] = context?.cart?.items ?? []

    if (items.length === 0) {
      return { calculated_amount: 0, is_calculated_price_tax_inclusive: false }
    }

    // Block checkout if any item variant has no weight set
    for (const item of items) {
      const weight = item.variant?.weight ?? 0
      if (weight === 0) {
        throw new Error(
          `"${item.title ?? 'A product'}" has no weight set. ` +
          `The seller must set a product weight before this item can be shipped.`
        )
      }
    }

    // Sum chargeable weight across all items × quantities
    const totalWeightKg = items.reduce((sum: number, item: any) => {
      const chargeableKg = getChargeableWeightKg(item.variant)
      return sum + chargeableKg * (item.quantity ?? 1)
    }, 0)

    const serviceType = (optionData.service_type as string) ?? 'Standard'
    let ratePhp = getTieredRate(totalWeightKg, serviceType)

    if (optionData.is_cod) ratePhp += COD_SURCHARGE_PHP

    // Medusa stores amounts in smallest currency unit.
    // PHP: 1 peso = 100 centavos → ₱99 is stored as 9900.
    return {
      calculated_amount: ratePhp * 100,
      is_calculated_price_tax_inclusive: false,
    }
  }

  // ── Create Fulfillment ──────────────────────────────────────────────────────
  // Called when vendor creates a fulfillment in the order.
  // Actual carrier booking (waybill) is done separately via vendor/shipping-orders.

  async createFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }

  async cancelFulfillment(): Promise<any> {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }

  async getFulfillmentDocuments(): Promise<never[]> { return [] }
  async getReturnDocuments(): Promise<never[]> { return [] }
  async getShipmentDocuments(): Promise<never[]> { return [] }
  async retrieveDocuments(): Promise<void> {}
}

export default MaretindaShippingProviderService
