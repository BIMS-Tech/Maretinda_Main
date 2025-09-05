import { createWorkflow, WorkflowResponse, when, transform } from "@medusajs/framework/workflows-sdk"
import { 
  validateDftPayoutStep,
  createDftTransactionStep,
  updatePayoutStatusStep
} from "../steps"

type ProcessDftPayoutWorkflowInput = {
  payout_id: string
  dft_generation_id: string
  line_number?: number
}

type ProcessDftPayoutWorkflowOutput = {
  dft_transaction_id: string
  payout_id: string
  status: string
  amount: number
}

export const processDftPayoutWorkflow = createWorkflow(
  { name: "process-dft-payout" },
  function (input: ProcessDftPayoutWorkflowInput): WorkflowResponse<ProcessDftPayoutWorkflowOutput> {
    
    // Step 1: Validate payout is eligible for DFT processing
    const validation = validateDftPayoutStep(input.payout_id)

    // Step 2: Create DFT transaction record (only if validation passes)
    const dftTransaction = when({ validation }, ({ validation }) => validation.is_valid).then(
      () => createDftTransactionStep(
        transform({ validation, input }, ({ validation, input }) => ({
          payout_id: input.payout_id,
          dft_generation_id: input.dft_generation_id,
          line_number: input.line_number,
          seller_data: (validation as any).seller_data,
          payout_data: (validation as any).payout_data
        }))
      )
    )

    // Step 3: Update payout status to indicate it's included in DFT
    const updatedPayout = when({ dftTransaction }, ({ dftTransaction }) => !!dftTransaction).then(
      () => updatePayoutStatusStep(
        transform({ dftTransaction, input }, ({ dftTransaction, input }) => ({
          payout_id: input.payout_id,
          status: "dft_included",
          dft_transaction_id: (dftTransaction as any).id
        }))
      )
    )

    return new WorkflowResponse(
      transform({ dftTransaction, updatedPayout, validation, input }, ({ dftTransaction, updatedPayout, validation, input }) => ({
        dft_transaction_id: (dftTransaction as any)?.id || "",
        payout_id: input.payout_id,
        status: (updatedPayout as any)?.status || "failed",
        amount: (validation as any).payout_data?.amount || 0
      }))
    )
  }
)
