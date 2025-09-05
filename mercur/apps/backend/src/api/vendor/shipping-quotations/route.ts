import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VendorShippingService, MultiVendorShippingService } from "@mercurjs/shipping"
import type { VendorShippingQuotationRequest } from "@mercurjs/shipping/interfaces/vendor-shipping.interface"

export const POST = async (
  req: MedusaRequest<{
    action: 'get-quotations' | 'get-best-quotation' | 'compare-providers'
    quotationRequest: VendorShippingQuotationRequest
    criteria?: any
  }>,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const { action, quotationRequest, criteria } = req.body
    const vendorId = user.seller.id
    const vendorShippingService = new VendorShippingService(req.scope)
    const multiVendorShippingService = new MultiVendorShippingService(req.scope)

    // Add vendor context to the request
    const vendorQuotationRequest: VendorShippingQuotationRequest = {
      ...quotationRequest,
      vendorContext: {
        vendorId,
        storeId: user.seller.id,
        region: quotationRequest.vendorContext?.region || 'PH',
        market: quotationRequest.vendorContext?.market || 'PH',
        businessType: quotationRequest.vendorContext?.businessType || 'business',
        volumeLevel: quotationRequest.vendorContext?.volumeLevel || 'medium'
      }
    }

    switch (action) {
      case 'get-quotations': {
        // Get quotations from all available providers
        const quotations = await vendorShippingService.getVendorQuotations(vendorQuotationRequest, criteria)
        
        res.json({
          quotations,
          vendorContext: vendorQuotationRequest.vendorContext,
          timestamp: new Date().toISOString()
        })
        break
      }

      case 'get-best-quotation': {
        // Get the best quotation based on vendor preferences
        const vendorConfig = await vendorShippingService.getVendorConfig(vendorId)
        const enhancedCriteria = {
          ...criteria,
          vendorPreferences: vendorConfig?.preferences || {}
        }

        const bestQuotation = await vendorShippingService.getBestVendorQuotation(
          vendorQuotationRequest, 
          enhancedCriteria
        )
        
        res.json({
          quotation: bestQuotation,
          selection_reason: bestQuotation.selectionReason,
          alternatives: bestQuotation.alternatives || [],
          timestamp: new Date().toISOString()
        })
        break
      }

      case 'compare-providers': {
        // Get detailed comparison across all providers
        const comparison = await vendorShippingService.compareProvidersForVendor(
          vendorQuotationRequest,
          criteria
        )
        
        res.json({
          comparison,
          recommendations: comparison.recommendations,
          vendorSavings: comparison.vendorSavings,
          marketplaceSavings: comparison.marketplaceSavings,
          timestamp: new Date().toISOString()
        })
        break
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('[Vendor Shipping Quotations API] Error:', error)
    res.status(500).json({
      error: 'Failed to process quotation request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const { quotation_id, provider_id } = req.query
    const vendorId = user.seller.id
    const vendorShippingService = new VendorShippingService(req.scope)

    if (quotation_id) {
      // Get specific quotation details
      const quotation = await vendorShippingService.getVendorQuotation(vendorId, quotation_id as string)
      
      if (!quotation) {
        return res.status(404).json({ error: 'Quotation not found' })
      }

      res.json({ quotation })
    } else {
      // Get recent quotations for vendor
      const recentQuotations = await vendorShippingService.getVendorQuotationHistory(
        vendorId,
        {
          limit: parseInt(req.query.limit as string) || 20,
          offset: parseInt(req.query.offset as string) || 0,
          provider_id: provider_id as string
        }
      )

      res.json({
        quotations: recentQuotations.data,
        count: recentQuotations.count,
        hasMore: recentQuotations.hasMore
      })
    }

  } catch (error) {
    console.error('[Vendor Shipping Quotations API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch quotations',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


