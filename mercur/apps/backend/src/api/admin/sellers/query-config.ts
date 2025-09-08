import { defaultAdminCustomerGroupFields } from '@medusajs/medusa/api/admin/customer-groups/query-config'
import { defaultAdminOrderFields } from '@medusajs/medusa/api/admin/orders/query-config'

export const adminSellerFields = [
  'id',
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
  // DFT fields
  'dft_bank_name',
  'dft_bank_code',
  'dft_swift_code',
  'dft_bank_address',
  'dft_beneficiary_name',
  'dft_beneficiary_code',
  'dft_beneficiary_address',
  'dft_account_number'
]

export const adminSellerQueryConfig = {
  list: {
    defaults: adminSellerFields,
    isList: true
  },
  retrieve: {
    defaults: adminSellerFields,
    isList: false
  }
}

export const adminSellerOrdersQueryConfig = {
  list: {
    defaults: defaultAdminOrderFields,
    isList: true
  },
  retrieve: {
    defaults: defaultAdminOrderFields,
    isList: false
  }
}

export const adminSellerCustomerGroupsQueryConfig = {
  list: {
    defaults: defaultAdminCustomerGroupFields,
    isList: true
  },
  retrieve: {
    defaults: defaultAdminCustomerGroupFields,
    isList: false
  }
}
