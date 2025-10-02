export const vendorSellerFields = [
  'id',
  'store_status',
  'name',
  'handle',
  'description',
  'photo',
  'email',
  'phone',
  'address_line',
  'city',
  'state',
  'postal_code',
  'country_code',
  'tax_id',
  // DFT fields for bank information
  'dft_bank_name',
  'dft_bank_code',
  'dft_swift_code',
  'dft_bank_address',
  'dft_beneficiary_name',
  'dft_beneficiary_code',
  'dft_beneficiary_address',
  'dft_account_number'
]

export const vendorSellerQueryConfig = {
  list: {
    defaults: vendorSellerFields,
    isList: true
  },
  retrieve: {
    defaults: vendorSellerFields,
    isList: false
  }
}

export const vendorReviewFields = [
  'id',
  'rating',
  'customer_note',
  'customer_id',
  'seller_note',
  'created_at',
  'updated_at'
]

export const vendorReviewQueryConfig = {
  list: {
    defaults: vendorReviewFields,
    isList: true
  },
  retrieve: {
    defaults: vendorReviewFields,
    isList: false
  }
}

export const vendorOnboardingFields = [
  'id',
  'seller_id',
  'store_information',
  'stripe_connection',
  'locations_shipping',
  'products',
  'created_at',
  'updated_at'
]

export const vendorOnboardingQueryConfig = {
  retrieve: {
    defaults: vendorOnboardingFields,
    isList: false
  }
}
