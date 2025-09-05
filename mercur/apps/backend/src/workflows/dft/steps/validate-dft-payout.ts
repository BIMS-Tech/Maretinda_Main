import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type ValidateDftPayoutInput = string // payout_id

type ValidateDftPayoutOutput = {
  is_valid: boolean
  errors: string[]
  seller_data?: any
  payout_data?: any
}

export const validateDftPayoutStep = createStep(
  "validate-dft-payout",
  async (payout_id: ValidateDftPayoutInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    try {
      // For now, simulate payout validation until payout module is fully integrated
      // In real implementation, this would query the actual payout module
      
      // Mock payout data
      const mockPayout = {
        id: payout_id,
        amount: 50000,
        currency: "PHP",
        status: "pending",
        seller_id: `seller_${payout_id.split('_')[1] || '001'}`,
        created_at: new Date().toISOString()
      }

      // Get seller DFT information
      const { data: sellers } = await query.graph({
        entity: 'seller',
        fields: [
          'id',
          'name',
          'dft_bank_name',
          'dft_bank_code',
          'dft_swift_code',
          'dft_bank_address',
          'dft_beneficiary_name',
          'dft_beneficiary_code',
          'dft_beneficiary_address',
          'dft_account_number'
        ],
        filters: {
          id: mockPayout.seller_id
        }
      })

      const seller = sellers[0]
      const errors: string[] = []

      if (!seller) {
        errors.push("Seller not found")
        return new StepResponse({
          is_valid: false,
          errors,
          payout_data: mockPayout
        })
      }

      // Validate seller has complete DFT information
      const requiredDftFields = [
        'dft_bank_name',
        'dft_swift_code', 
        'dft_beneficiary_name',
        'dft_account_number',
        'dft_beneficiary_address',
        'dft_bank_address'
      ]

      const missingFields = requiredDftFields.filter(field => !seller[field])
      
      if (missingFields.length > 0) {
        errors.push(`Seller missing DFT information: ${missingFields.join(', ')}`)
      }

      // Validate payout status
      if (mockPayout.status !== "pending") {
        errors.push(`Payout status must be pending, current: ${mockPayout.status}`)
      }

      // Validate amount
      if (mockPayout.amount <= 0) {
        errors.push("Payout amount must be greater than 0")
      }

      // Validate currency
      if (mockPayout.currency !== "PHP") {
        errors.push("Only PHP currency is supported for DFT")
      }

      const isValid = errors.length === 0

      return new StepResponse({
        is_valid: isValid,
        errors,
        seller_data: isValid ? seller : undefined,
        payout_data: mockPayout
      })

    } catch (error) {
      return new StepResponse({
        is_valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      })
    }
  }
)
