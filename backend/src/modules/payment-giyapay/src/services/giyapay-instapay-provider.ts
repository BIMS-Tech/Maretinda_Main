import GiyaPayProviderService from './giyapay-provider'

class GiyaPayInstaPayProviderService extends GiyaPayProviderService {
  static identifier = "pp_giyapay_instapay"

  async initiatePayment(input: any) {
    const result = await super.initiatePayment(input)
    
    // Add InstaPay specific method to the payment data
    if (result.data?.payment_data) {
      (result.data.payment_data as any).method = 'instapay'
    }
    
    return result
  }
}

export default GiyaPayInstaPayProviderService
