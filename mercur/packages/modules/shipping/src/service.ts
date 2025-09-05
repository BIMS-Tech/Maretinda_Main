/**
 * Main shipping module service that provides access to all shipping functionality
 */
import { ShippingService, ShippingDatabaseService } from "./services/shipping"
import { MultiVendorShippingService } from "./services/multi-vendor-shipping.service"
import { TrackingService } from "./services/tracking.service"

export default class ShippingModuleService {
  private container: any

  constructor(container: any) {
    this.container = container
  }

  /**
   * Get the legacy Lalamove shipping service
   */
  getShippingService(config?: any): ShippingService {
    return new ShippingService(config)
  }

  /**
   * Get the shipping database service
   */
  getShippingDatabaseService(): ShippingDatabaseService {
    return new ShippingDatabaseService(this.container)
  }

  /**
   * Get the multi-vendor shipping service (main service)
   */
  getMultiVendorShippingService(): MultiVendorShippingService {
    return new MultiVendorShippingService(this.container)
  }

  /**
   * Get the tracking service
   */
  getTrackingService(): TrackingService {
    return new TrackingService(this.container)
  }

  /**
   * Main method for getting quotations from multiple providers
   */
  async getMultipleQuotations(request: any, criteria?: any) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.getMultipleQuotations(request, criteria)
  }

  /**
   * Main method for getting the best quotation
   */
  async getBestQuotation(request: any, criteria?: any) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.getBestQuotation(request, criteria)
  }

  /**
   * Main method for placing orders
   */
  async placeOrder(request: any, providerId?: string) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.placeOrder(request, providerId)
  }

  /**
   * Main method for tracking orders
   */
  async trackOrder(orderId: string, providerId?: string) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.trackOrder(orderId, providerId)
  }

  /**
   * Main method for canceling orders
   */
  async cancelOrder(orderId: string, reason?: string, providerId?: string) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.cancelOrder(orderId, reason, providerId)
  }

  /**
   * Configure a shipping provider
   */
  async configureProvider(config: any) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.configureProvider(config)
  }

  /**
   * Get configured providers
   */
  getConfiguredProviders() {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.getConfiguredProviders()
  }

  /**
   * Process webhook
   */
  async processWebhook(providerId: string, payload: any) {
    const multiVendorService = this.getMultiVendorShippingService()
    return multiVendorService.processWebhook(providerId, payload)
  }

  /**
   * Get tracking history
   */
  async getTrackingHistory(orderId: string) {
    const trackingService = this.getTrackingService()
    return trackingService.getOrderTracking(orderId)
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStatistics(startDate: Date, endDate: Date, providerId?: string) {
    const trackingService = this.getTrackingService()
    return trackingService.getTrackingStatistics(startDate, endDate, providerId)
  }
}
