/**
 * Liability-Free Shipping Service
 * 
 * This service acts as a pure facilitator between vendors and shipping providers.
 * The marketplace takes no liability for shipping operations.
 */
import { 
  VendorShippingCredentials, 
  VendorShippingConfig, 
  VendorShippingContext,
  VendorShippingQuotationRequest,
  VendorShippingQuotationResponse,
  IShippingProvider
} from '../interfaces/vendor-shipping.interface'

export interface ShippingFacilitationTerms {
  vendorId: string
  agreedAt: string
  terms: {
    vendorLiabilityAcknowledged: boolean
    platformNotLiableForDelivery: boolean
    vendorResponsibleForShippingCosts: boolean
    vendorResponsibleForCustomerService: boolean
    disputesHandledDirectlyWithProvider: boolean
    platformOnlyProvidesIntegrationTools: boolean
  }
  ipAddress: string
  userAgent: string
  signature?: string
}

export class LiabilityFreeShippingService {
  private container: any

  constructor(container: any) {
    this.container = container
  }

  /**
   * Vendor must acknowledge shipping liability terms before using shipping
   */
  async recordShippingTermsAgreement(terms: ShippingFacilitationTerms): Promise<void> {
    try {
      const query = `
        INSERT INTO vendor_shipping_terms_agreement 
        (vendor_id, agreed_at, terms, ip_address, user_agent, signature)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (vendor_id) DO UPDATE SET
          agreed_at = EXCLUDED.agreed_at,
          terms = EXCLUDED.terms,
          ip_address = EXCLUDED.ip_address,
          user_agent = EXCLUDED.user_agent,
          signature = EXCLUDED.signature
      `
      
      await this.container.query(query, [
        terms.vendorId,
        terms.agreedAt,
        JSON.stringify(terms.terms),
        terms.ipAddress,
        terms.userAgent,
        terms.signature
      ])

    } catch (error) {
      console.error('Error recording shipping terms agreement:', error)
      throw new Error('Failed to record shipping terms agreement')
    }
  }

  /**
   * Check if vendor has agreed to shipping liability terms
   */
  async hasVendorAgreedToTerms(vendorId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM vendor_shipping_terms_agreement 
        WHERE vendor_id = $1 AND agreed_at IS NOT NULL
      `
      
      const result = await this.container.query(query, [vendorId])
      return result.rows[0].count > 0

    } catch (error) {
      console.error('Error checking vendor terms agreement:', error)
      return false
    }
  }

  /**
   * Get shipping quotations - vendor liability only
   */
  async facilitateQuotationRequest(request: VendorShippingQuotationRequest): Promise<{
    quotations: VendorShippingQuotationResponse[]
    liabilityDisclaimer: string
    termsOfService: string
  }> {
    // Ensure vendor has agreed to terms
    const hasAgreed = await this.hasVendorAgreedToTerms(request.vendorContext.vendorId)
    if (!hasAgreed) {
      throw new Error('Vendor must agree to shipping liability terms before using shipping services')
    }

    try {
      // Get quotations using only vendor's own credentials
      const vendorShippingService = this.container.resolve('vendorShippingService')
      const quotations = await vendorShippingService.getVendorOnlyQuotations(request)

      return {
        quotations,
        liabilityDisclaimer: this.getLiabilityDisclaimer(),
        termsOfService: this.getTermsOfService()
      }

    } catch (error) {
      // Log error but don't expose internal details
      console.error('Error facilitating quotation request:', error)
      throw new Error('Unable to facilitate shipping quotation. Please check your provider credentials.')
    }
  }

  /**
   * Facilitate order placement - vendor direct relationship
   */
  async facilitateOrderPlacement(orderRequest: any): Promise<{
    success: boolean
    providerOrderId?: string
    trackingNumber?: string
    liabilityNotice: string
    vendorResponsibilities: string[]
  }> {
    const hasAgreed = await this.hasVendorAgreedToTerms(orderRequest.vendorContext.vendorId)
    if (!hasAgreed) {
      throw new Error('Vendor must agree to shipping liability terms')
    }

    try {
      // Place order using vendor's credentials only
      const vendorShippingService = this.container.resolve('vendorShippingService')
      const result = await vendorShippingService.placeVendorOrder(orderRequest)

      // Record the facilitation (not the order itself)
      await this.recordShippingFacilitation({
        vendorId: orderRequest.vendorContext.vendorId,
        providerId: orderRequest.providerId,
        facilitationType: 'order_placement',
        vendorOrderId: orderRequest.orderId,
        providerOrderId: result.providerOrderId,
        facilitatedAt: new Date().toISOString()
      })

      return {
        success: true,
        providerOrderId: result.providerOrderId,
        trackingNumber: result.trackingNumber,
        liabilityNotice: "This shipment is between vendor and shipping provider. Marketplace is not liable for delivery issues.",
        vendorResponsibilities: [
          "Handle all customer service inquiries about delivery",
          "Resolve disputes directly with shipping provider",
          "Ensure proper packaging and labeling",
          "Provide accurate pickup and delivery information",
          "Handle any customs or regulatory requirements",
          "Manage refunds for shipping-related issues"
        ]
      }

    } catch (error) {
      console.error('Error facilitating order placement:', error)
      throw new Error('Unable to facilitate order placement. Please contact your shipping provider directly.')
    }
  }

  /**
   * Facilitate tracking - read-only information passthrough
   */
  async facilitateTracking(vendorId: string, orderId: string): Promise<{
    trackingInfo: any
    disclaimer: string
  }> {
    try {
      const vendorShippingService = this.container.resolve('vendorShippingService')
      const trackingInfo = await vendorShippingService.getVendorOrderTracking(vendorId, orderId)

      return {
        trackingInfo,
        disclaimer: "Tracking information provided by shipping provider. Marketplace is not responsible for accuracy or delivery issues."
      }

    } catch (error) {
      console.error('Error facilitating tracking:', error)
      throw new Error('Unable to retrieve tracking information. Please check directly with your shipping provider.')
    }
  }

  /**
   * Help vendor set up their own provider accounts
   */
  async getProviderSetupGuide(providerId: string): Promise<{
    providerName: string
    signupUrl: string
    requiredDocuments: string[]
    setupSteps: string[]
    apiSetupInstructions: string[]
    liability: string
  }> {
    const guides = {
      lalamove: {
        providerName: "Lalamove",
        signupUrl: "https://www.lalamove.com/philippines/business",
        requiredDocuments: [
          "Business Registration Certificate (DTI/SEC)",
          "Government-issued ID",
          "Bank Account Information",
          "Business Address Verification"
        ],
        setupSteps: [
          "Visit Lalamove Business signup page",
          "Complete business verification",
          "Wait for account approval (1-3 business days)",
          "Access API credentials in dashboard",
          "Enter credentials in your vendor panel"
        ],
        apiSetupInstructions: [
          "Login to Lalamove Business Dashboard",
          "Go to Settings > API Management",
          "Generate API Key and Secret",
          "Copy credentials to Maretinda vendor panel",
          "Test connection with sample quotation"
        ],
        liability: "You have a direct contractual relationship with Lalamove. Maretinda is not liable for any shipping issues."
      },
      dhl: {
        providerName: "DHL Express",
        signupUrl: "https://www.dhl.com/ph-en/home/our-divisions/express/customer-service/open-account.html",
        requiredDocuments: [
          "Business Registration",
          "Tax Identification Number",
          "Business Bank Account",
          "Credit Check Authorization"
        ],
        setupSteps: [
          "Contact DHL Philippines sales team",
          "Complete credit application",
          "Business verification process",
          "Account setup and training",
          "API access provisioning"
        ],
        apiSetupInstructions: [
          "Contact DHL to request API access",
          "Complete developer registration",
          "Receive API credentials via secure channel",
          "Configure credentials in vendor panel",
          "Complete integration testing"
        ],
        liability: "Direct contract with DHL Express. Maretinda provides integration tools only."
      }
    }

    return guides[providerId as keyof typeof guides] || {
      providerName: "Unknown Provider",
      signupUrl: "",
      requiredDocuments: [],
      setupSteps: [],
      apiSetupInstructions: [],
      liability: "Check with provider directly for terms and liability."
    }
  }

  /**
   * Generate liability waiver document
   */
  generateLiabilityWaiver(vendorId: string): string {
    return `
SHIPPING SERVICES LIABILITY WAIVER

Vendor ID: ${vendorId}
Date: ${new Date().toISOString()}

BY USING MARETINDA'S SHIPPING INTEGRATION TOOLS, YOU ACKNOWLEDGE AND AGREE:

1. DIRECT RELATIONSHIP: You have a direct contractual relationship with shipping providers (Lalamove, DHL, etc.)

2. NO MARKETPLACE LIABILITY: Maretinda is not liable for:
   - Delayed, damaged, or lost shipments
   - Shipping costs or billing disputes
   - Customer service issues related to delivery
   - Provider service outages or limitations

3. VENDOR RESPONSIBILITIES: You are solely responsible for:
   - All shipping-related customer service
   - Resolving disputes with shipping providers
   - Accurate product information and packaging
   - Compliance with shipping regulations
   - Managing shipping costs and billing

4. INTEGRATION TOOLS ONLY: Maretinda provides integration tools to facilitate your direct relationship with shipping providers

5. NO WARRANTIES: Shipping services are provided "as-is" without warranties

6. INDEMNIFICATION: You agree to indemnify Maretinda against any claims related to your shipping activities

By continuing to use shipping services, you accept these terms.
    `
  }

  // Private helper methods

  private async recordShippingFacilitation(facilitation: any): Promise<void> {
    try {
      const query = `
        INSERT INTO shipping_facilitation_log 
        (vendor_id, provider_id, facilitation_type, vendor_order_id, provider_order_id, facilitated_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `
      
      await this.container.query(query, [
        facilitation.vendorId,
        facilitation.providerId,
        facilitation.facilitationType,
        facilitation.vendorOrderId,
        facilitation.providerOrderId,
        facilitation.facilitatedAt,
        JSON.stringify(facilitation.metadata || {})
      ])

    } catch (error) {
      console.error('Error recording shipping facilitation:', error)
      // Don't throw - this is just logging
    }
  }

  private getLiabilityDisclaimer(): string {
    return "IMPORTANT: Maretinda facilitates connections to shipping providers only. We are not liable for shipping delays, damages, or disputes. All shipping matters are between you and the shipping provider."
  }

  private getTermsOfService(): string {
    return "By using shipping services, you acknowledge that you have a direct relationship with shipping providers and accept full responsibility for all shipping-related matters."
  }
}








