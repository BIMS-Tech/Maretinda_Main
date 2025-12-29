import GiyaPayProviderService from './giyapay-provider'

class GiyaPayPayMayaProviderService extends GiyaPayProviderService {
  static identifier = "pp_giyapay_paymaya"

  async initiatePayment(input: any) {
    const result = await super.initiatePayment(input)
    
    // Add PayMaya specific method to the payment data
    if (result.data?.payment_data) {
      (result.data.payment_data as any).method = 'paymaya'
    }
    
    return result
  }
}

export default GiyaPayPayMayaProviderService
