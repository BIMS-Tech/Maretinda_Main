import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type UpdatePayoutStatusInput = {
  payout_id: string
  status: string
  dft_transaction_id?: string
}

type UpdatePayoutStatusOutput = {
  payout_id: string
  status: string
  updated_at: string
}

export const updatePayoutStatusStep = createStep(
  "update-payout-status",
  async (input: UpdatePayoutStatusInput) => {
    try {
      // Update payout status to indicate it's included in DFT
      // This will be replaced with actual payout module service when integrated
      
      const updatedPayout = {
        id: input.payout_id,
        status: input.status,
        dft_transaction_id: input.dft_transaction_id,
        updated_at: new Date().toISOString()
      }

      // TODO: Replace with actual payout module service call
      // const payoutService = container.resolve(PAYOUT_MODULE)
      // const updatedPayout = await payoutService.updatePayout(input.payout_id, {
      //   status: input.status,
      //   metadata: {
      //     dft_transaction_id: input.dft_transaction_id,
      //     dft_included_at: new Date().toISOString()
      //   }
      // })

      return new StepResponse({
        payout_id: updatedPayout.id,
        status: updatedPayout.status,
        updated_at: updatedPayout.updated_at
      })

    } catch (error) {
      throw new Error(`Failed to update payout status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
)
