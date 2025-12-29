import GiyaPayProviderService from './giyapay-provider'

class GiyaPayGCashProviderService extends GiyaPayProviderService {
  static identifier = "pp_giyapay_gcash"

  async initiatePayment(input: any) {
    const result = await super.initiatePayment(input)
    
    // Add GCash specific method to the payment data
    if (result.data?.payment_data) {
      (result.data.payment_data as any).method = 'gcash'
    }
    
    return result
  }
}

export default GiyaPayGCashProviderService
