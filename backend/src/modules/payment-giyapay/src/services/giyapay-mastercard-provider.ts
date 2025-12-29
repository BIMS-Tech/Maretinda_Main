import GiyaPayProviderService from './giyapay-provider'

class GiyaPayMastercardProviderService extends GiyaPayProviderService {
  static identifier = "pp_giyapay_mastercard"

  async initiatePayment(input: any) {
    const result = await super.initiatePayment(input)
    
    // Add Mastercard specific method to the payment data
    if (result.data?.payment_data) {
      (result.data.payment_data as any).method = 'mastercard'
    }
    
    return result
  }
}

export default GiyaPayMastercardProviderService
