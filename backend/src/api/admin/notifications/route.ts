import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /admin/notifications
 * operationId: "AdminListNotifications"
 * summary: "List Notifications"
 * description: "Retrieves a list of admin notifications from the feed channel."
 * x-authenticated: true
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminNotificationListParams>,
  res: MedusaResponse<HttpTypes.AdminNotificationListResponse>
) => {
  try {
    // Check if scope and query are available
    if (!req.scope) {
      console.error('[Admin Notifications] Request scope is undefined')
      return res.json({
        notifications: [],
        count: 0,
        offset: 0,
        limit: 20
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    if (!query) {
      console.error('[Admin Notifications] Query service not available')
      return res.json({
        notifications: [],
        count: 0,
        offset: 0,
        limit: 20
      })
    }

    const { data: notifications, metadata } = await query.graph({
      entity: 'notification',
      fields: req.queryConfig?.fields || ['id', 'created_at'],
      filters: {
        ...req.filterableFields,
        channel: 'feed'
      },
      pagination: req.queryConfig?.pagination || { skip: 0, take: 20 }
    })

    res.json({
      notifications: (notifications || []) as any,
      count: metadata?.count || 0,
      offset: metadata?.skip || 0,
      limit: metadata?.take || 20
    })
  } catch (error) {
    console.error('[Admin Notifications] Error fetching notifications:', error)
    
    // Return empty notifications list on error to prevent UI breaking
    res.json({
      notifications: [],
      count: 0,
      offset: 0,
      limit: 20
    })
  }
}


