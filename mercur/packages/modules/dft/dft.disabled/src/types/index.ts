export interface CreateDftConfigurationDTO {
  seller_id: string
  bank_name: string
  bank_code?: string
  swift_code: string
  bank_address: string
  beneficiary_name: string
  beneficiary_code: string
  beneficiary_address: string
  account_number: string
  remittance_type?: string
  currency?: string
  charge_type?: string
  source_account: string
  notes?: string
}

export interface UpdateDftConfigurationDTO {
  bank_name?: string
  bank_code?: string
  swift_code?: string
  bank_address?: string
  beneficiary_name?: string
  beneficiary_code?: string
  beneficiary_address?: string
  account_number?: string
  remittance_type?: string
  currency?: string
  charge_type?: string
  source_account?: string
  is_verified?: boolean
  verification_date?: Date
  created_by?: string
  notes?: string
}

export interface CreateDftGenerationDTO {
  batch_id: string
  file_name: string
  total_amount: number
  transaction_count: number
  currency?: string
  generated_by: string
  notes?: string
}

export interface UpdateDftGenerationDTO {
  status?: string
  file_path?: string
  processed_at?: Date
  downloaded_at?: Date
  file_size?: number
  checksum?: string
  notes?: string
  error_message?: string
}

export interface CreateDftTransactionDTO {
  dft_generation_id: string
  payout_id: string
  order_id?: string
  seller_id: string
  amount: number
  currency?: string
  beneficiary_name: string
  beneficiary_code: string
  beneficiary_account: string
  beneficiary_address: string
  swift_code: string
  bank_address: string
  remittance_type?: string
  source_account: string
  purpose: string
  charge_type?: string
  transaction_date: Date
}

export interface DftLineData {
  remittance_type: string
  currency: string
  amount: string
  source_account: string
  destination_account: string
  sequence_number: string
  beneficiary_code: string
  beneficiary_name: string
  beneficiary_address: string
  swift_code: string
  beneficiary_bank_address: string
  purpose: string
  charge_type: string
}

export interface DftGenerationRequest {
  seller_ids?: string[]
  payout_ids?: string[]
  date_range?: {
    from: Date
    to: Date
  }
  currency?: string
  notes?: string
}
