import GiyaPayProviderService from './giyapay-provider'

class GiyaPayVisaProviderService extends GiyaPayProviderService {
  static identifier = "pp_giyapay_visa"

  async initiatePayment(input: any) {
    const result = await super.initiatePayment(input)
    
    // Add Visa specific method to the payment data
    if (result.data?.payment_data) {
      (result.data.payment_data as any).method = 'visa'
    }
    
    return result
  }
}

export default GiyaPayVisaProviderService
