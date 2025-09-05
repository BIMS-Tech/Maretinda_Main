/**
 * Enhanced shipping interfaces for vendor-specific credential management
 */

export interface VendorShippingCredentials {
  vendorId: string
  providerId: string
  credentials: {
    apiKey: string
    apiSecret: string
    accountId?: string
    environment?: 'sandbox' | 'production'
    region?: string
    [key: string]: any
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastUsed?: string
  metadata?: Record<string, any>
}

export interface VendorShippingConfig {
  vendorId: string
  enabledProviders: string[]
  defaultProvider?: string
  preferences: {
    autoSelectBestRate: boolean
    maxCostThreshold?: number
    preferredServiceTypes: string[]
    blacklistedProviders: string[]
  }
  billingConfig: {
    paymentMethod: 'marketplace' | 'vendor-direct'
    costMarkup?: number // percentage
    handlingFee?: number
  }
}

export interface VendorShippingContext {
  vendorId: string
  storeId?: string
  region: string
  market: string
  businessType: 'individual' | 'business'
  volumeLevel: 'low' | 'medium' | 'high'
}

export interface ProviderAvailability {
  providerId: string
  isAvailableForVendor: boolean
  requiresCredentials: boolean
  supportedMarkets: string[]
  minimumRequirements?: {
    businessRegistration?: boolean
    minimumVolume?: number
    creditCheck?: boolean
  }
  setupInstructions?: string
}

export interface VendorShippingQuotationRequest extends UnifiedQuotationRequest {
  vendorContext: VendorShippingContext
  billingPreference?: 'marketplace' | 'vendor-direct'
}

export interface VendorShippingQuotationResponse extends UnifiedQuotationResponse {
  vendorCost: number
  marketplaceCost: number
  markup: number
  billingResponsibility: 'marketplace' | 'vendor'
  credentialsSource: 'vendor' | 'marketplace'
}

// Re-export base interfaces
export * from './shipping-provider.interface'









