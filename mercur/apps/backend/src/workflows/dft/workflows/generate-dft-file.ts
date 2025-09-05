import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { 
  validateDftDataStep,
  generateDftFileStep,
  saveDftFileStep,
  updateDftGenerationStep
} from "../steps"

type GenerateDftFileWorkflowInput = {
  seller_ids?: string[]
  payout_ids?: string[]
  source_account: string
  generated_by: string
  notes?: string
  date_range?: {
    from: Date
    to: Date
  }
}

type GenerateDftFileWorkflowOutput = {
  dft_generation_id: string
  batch_id: string
  file_name: string
  file_path: string
  transaction_count: number
  total_amount: number
  validation_summary: {
    valid_sellers: number
    invalid_sellers: number
    missing_dft_info: string[]
  }
}

export const generateDftFileWorkflow = createWorkflow(
  { name: "generate-dft-file" },
  function (input: GenerateDftFileWorkflowInput): WorkflowResponse<GenerateDftFileWorkflowOutput> {
    
    // Step 1: Validate seller DFT data and get pending payouts
    const validationResult = validateDftDataStep(input)

    // Step 2: Generate DFT file content using transform to access validation results
    const dftFileData = generateDftFileStep(
      transform({ validationResult, input }, ({ validationResult, input }) => ({
        sellers: validationResult.valid_sellers,
        payouts: validationResult.pending_payouts,
        source_account: input.source_account,
        notes: input.notes
      }))
    )

    // Step 3: Save DFT file to storage
    const fileResult = saveDftFileStep(
      transform({ dftFileData }, ({ dftFileData }) => ({
        batch_id: dftFileData.batch_id,
        file_name: dftFileData.file_name,
        file_content: dftFileData.file_content,
        metadata: dftFileData.metadata
      }))
    )

    // Step 4: Update DFT generation record
    const dftGeneration = updateDftGenerationStep(
      transform({ dftFileData, fileResult, input }, ({ dftFileData, fileResult, input }) => ({
        batch_id: dftFileData.batch_id,
        file_path: fileResult.file_path,
        file_size: fileResult.file_size,
        checksum: fileResult.checksum,
        transaction_count: dftFileData.transaction_count,
        total_amount: dftFileData.total_amount,
        generated_by: input.generated_by,
        status: "generated"
      }))
    )

    return new WorkflowResponse(
      transform({ validationResult, dftFileData, fileResult, dftGeneration }, ({ validationResult, dftFileData, fileResult, dftGeneration }) => ({
        dft_generation_id: dftGeneration.id,
        batch_id: dftFileData.batch_id,
        file_name: dftFileData.file_name,
        file_path: fileResult.file_path,
        transaction_count: dftFileData.transaction_count,
        total_amount: dftFileData.total_amount,
        validation_summary: {
          valid_sellers: validationResult.valid_sellers.length,
          invalid_sellers: validationResult.invalid_sellers.length,
          missing_dft_info: validationResult.invalid_sellers.map((s: any) => s.name)
        }
      }))
    )
  }
)
