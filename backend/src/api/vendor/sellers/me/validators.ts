import { z } from "zod"

/**
 * Extended VendorUpdateSeller validator that includes bank/settlement fields
 * Overrides the default Mercur validator to allow our custom fields
 */
export const VendorUpdateSeller = z
  .object({
    // Standard seller fields
    name: z
      .preprocess((val) => (val as string)?.trim(), z.string().min(4))
      .optional(),
    description: z.string().optional(),
    photo: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address_line: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country_code: z.string().optional(),
    tax_id: z.string().optional(),
    
    // New settlement bank fields
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    account_name: z.string().optional(),
    branch_name: z.string().optional(),
    swift_code: z.string().optional(),
    beneficiary_address: z.string().optional(),
    beneficiary_bank_address: z.string().optional(),
    
    // Legacy DFT bank fields
    dft_bank_name: z.string().optional(),
    dft_bank_code: z.string().optional(),
    dft_swift_code: z.string().optional(),
    dft_bank_address: z.string().optional(),
    dft_beneficiary_name: z.string().optional(),
    dft_beneficiary_code: z.string().optional(),
    dft_beneficiary_address: z.string().optional(),
    dft_account_number: z.string().optional(),
  })
  .passthrough() // Allow additional fields to pass through



