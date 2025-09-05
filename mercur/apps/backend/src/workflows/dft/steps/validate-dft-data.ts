import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ValidateDftDataInput = {
  seller_ids?: string[]
  payout_ids?: string[]
  date_range?: {
    from: Date
    to: Date
  }
}

type ValidateDftDataOutput = {
  valid_sellers: any[]
  invalid_sellers: any[]
  pending_payouts: any[]
  validation_errors: string[]
}

export const validateDftDataStep = createStep(
  "validate-dft-data",
  async (input: ValidateDftDataInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    try {
      // Get sellers with DFT information
      const sellerFilters: any = {}
      if (input.seller_ids && input.seller_ids.length > 0) {
        sellerFilters.id = input.seller_ids
      }

      const { data: sellers } = await query.graph({
        entity: 'seller',
        fields: [
          'id',
          'name', 
          'email',
          'dft_bank_name',
          'dft_bank_code',
          'dft_swift_code',
          'dft_bank_address',
          'dft_beneficiary_name',
          'dft_beneficiary_code',
          'dft_beneficiary_address',
          'dft_account_number'
        ],
        filters: sellerFilters
      })

      // Separate valid and invalid sellers
      const validSellers: any[] = []
      const invalidSellers: any[] = []
      const validationErrors: string[] = []

      sellers.forEach(seller => {
        const missingFields: string[] = []
        
        if (!seller.dft_bank_name) missingFields.push('Bank Name')
        if (!seller.dft_swift_code) missingFields.push('SWIFT Code')
        if (!seller.dft_beneficiary_name) missingFields.push('Beneficiary Name')
        if (!seller.dft_account_number) missingFields.push('Account Number')
        if (!seller.dft_beneficiary_address) missingFields.push('Beneficiary Address')
        if (!seller.dft_bank_address) missingFields.push('Bank Address')

        if (missingFields.length === 0) {
          validSellers.push(seller)
        } else {
          invalidSellers.push({
            ...seller,
            missing_fields: missingFields
          })
          validationErrors.push(
            `Seller "${seller.name}" missing: ${missingFields.join(', ')}`
          )
        }
      })

      // Get pending payouts for valid sellers
      let pendingPayouts: any[] = []
      
      if (validSellers.length > 0) {
        const payoutFilters: any = {
          // Add filters for pending payouts when payout module is integrated
          // For now, we'll simulate with seller data
        }

        if (input.payout_ids && input.payout_ids.length > 0) {
          payoutFilters.id = input.payout_ids
        }

        if (input.date_range) {
          payoutFilters.created_at = {
            $gte: input.date_range.from,
            $lte: input.date_range.to
          }
        }

        // Simulate pending payouts for demo
        pendingPayouts = validSellers.map(seller => ({
          id: `payout_${seller.id}_${Date.now()}`,
          seller_id: seller.id,
          amount: 50000, // Demo amount
          currency: "PHP",
          status: "pending",
          created_at: new Date().toISOString()
        }))
      }

      return new StepResponse({
        valid_sellers: validSellers,
        invalid_sellers: invalidSellers,
        pending_payouts: pendingPayouts,
        validation_errors: validationErrors
      })

    } catch (error) {
      throw new Error(`Failed to validate DFT data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
)
