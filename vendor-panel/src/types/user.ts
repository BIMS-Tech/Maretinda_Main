import { HttpTypes } from "@medusajs/types"

export interface Review {
  id: string
  rating: number
  customer_id: string
  customer_note: string
  created_at: string
  reference: string
}

export interface StoreVendor {
  id?: string
  name?: string
  phone?: string
  email?: string
  description?: string
  handle?: string
  photo?: string
  created_at?: string
  product?: HttpTypes.StoreProduct[]
  review?: Review | Review[]
  address_line?: string
  postal_code?: string
  city?: string
  country_code?: string
  tax_id?: string
  store_status?: "ACTIVE" | "SUSPENDED" | "INACTIVE"
  // DFT Bank Information
  dft_bank_name?: string
  dft_bank_code?: string
  dft_swift_code?: string
  dft_bank_address?: string
  dft_beneficiary_name?: string
  dft_beneficiary_code?: string
  dft_beneficiary_address?: string
  dft_account_number?: string
}

export interface TeamMemberProps {
  id: string
  seller_id: string
  name: string
  email?: string
  photo?: string
  bio?: string
  phone?: string
  role: string
}
