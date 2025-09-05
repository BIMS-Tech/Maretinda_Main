import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VendorShippingService } from "@mercurjs/shipping"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const vendorId = user.seller.id
    const vendorShippingService = new VendorShippingService(req.scope)

    const {
      period = '30d', // 7d, 30d, 90d, 1y
      provider_id,
      include_cost_breakdown = 'true'
    } = req.query

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get comprehensive analytics
    const analytics = await vendorShippingService.getVendorShippingAnalytics(vendorId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      providerId: provider_id as string,
      includeCostBreakdown: include_cost_breakdown === 'true'
    })

    // Get provider performance comparison
    const providerComparison = await vendorShippingService.getProviderPerformanceComparison(vendorId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    })

    // Get cost optimization opportunities
    const optimizationTips = await vendorShippingService.getCostOptimizationTips(vendorId, analytics)

    res.json({
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      analytics: {
        // Volume metrics
        totalOrders: analytics.totalOrders,
        successfulDeliveries: analytics.successfulDeliveries,
        failedDeliveries: analytics.failedDeliveries,
        cancelledOrders: analytics.cancelledOrders,
        successRate: analytics.successRate,
        
        // Cost metrics
        totalCost: analytics.totalCost,
        averageCostPerOrder: analytics.averageCostPerOrder,
        vendorCosts: analytics.vendorCosts,
        marketplaceCosts: analytics.marketplaceCosts,
        totalSavings: analytics.totalSavings,
        
        // Performance metrics
        averageDeliveryTime: analytics.averageDeliveryTime,
        onTimeDeliveryRate: analytics.onTimeDeliveryRate,
        customerSatisfactionScore: analytics.customerSatisfactionScore,
        
        // Cost breakdown by provider
        ...(include_cost_breakdown === 'true' && {
          costBreakdown: analytics.costBreakdown
        }),
        
        // Trends
        dailyTrends: analytics.dailyTrends,
        weeklyTrends: analytics.weeklyTrends,
        monthlyTrends: analytics.monthlyTrends
      },
      
      providerComparison: {
        providers: providerComparison.providers,
        recommendations: providerComparison.recommendations,
        costComparison: providerComparison.costComparison,
        performanceComparison: providerComparison.performanceComparison
      },
      
      optimization: {
        tips: optimizationTips.tips,
        potentialSavings: optimizationTips.potentialSavings,
        recommendedActions: optimizationTips.recommendedActions,
        providerSuggestions: optimizationTips.providerSuggestions
      },
      
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Vendor Shipping Analytics API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch shipping analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const POST = async (
  req: MedusaRequest<{
    action: 'export-analytics' | 'generate-report' | 'schedule-report'
    format?: 'csv' | 'excel' | 'pdf'
    filters?: any
    schedule?: any
  }>,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const { action, format = 'csv', filters, schedule } = req.body
    const vendorId = user.seller.id
    const vendorShippingService = new VendorShippingService(req.scope)

    switch (action) {
      case 'export-analytics': {
        const exportData = await vendorShippingService.exportVendorAnalytics(vendorId, {
          format,
          filters
        })
        
        res.json({
          message: 'Analytics export generated successfully',
          downloadUrl: exportData.downloadUrl,
          fileName: exportData.fileName,
          expiresAt: exportData.expiresAt
        })
        break
      }

      case 'generate-report': {
        const report = await vendorShippingService.generateVendorShippingReport(vendorId, {
          format,
          filters,
          includeCharts: true,
          includeRecommendations: true
        })
        
        res.json({
          message: 'Report generated successfully',
          report: {
            downloadUrl: report.downloadUrl,
            fileName: report.fileName,
            reportId: report.reportId,
            generatedAt: report.generatedAt,
            expiresAt: report.expiresAt
          }
        })
        break
      }

      case 'schedule-report': {
        if (!schedule) {
          return res.status(400).json({ error: 'Schedule configuration is required' })
        }

        const scheduledReport = await vendorShippingService.scheduleVendorReport(vendorId, {
          format,
          filters,
          schedule: {
            frequency: schedule.frequency, // 'daily', 'weekly', 'monthly'
            dayOfWeek: schedule.dayOfWeek,
            dayOfMonth: schedule.dayOfMonth,
            time: schedule.time,
            timezone: schedule.timezone || 'Asia/Manila'
          }
        })
        
        res.json({
          message: 'Report scheduled successfully',
          schedule: scheduledReport
        })
        break
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('[Vendor Shipping Analytics API] Error:', error)
    res.status(500).json({
      error: 'Failed to process analytics action',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


