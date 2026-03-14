import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'

/**
 * @oas [post] /admin/test-email
 * operationId: "AdminTestEmail"
 * summary: "Test Email Sending"
 * description: "Test if Resend email notifications are working."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           to:
 *             type: string
 *             description: Email address to send test email to
 *         required:
 *           - to
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin Email
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { to } = req.body as { to: string }
    
    if (!to) {
      res.status(400).json({
        success: false,
        message: 'Email address is required'
      })
      return
    }

    console.log(`[Test Email] Attempting to send test email to: ${to}`)

    // Check environment variables
    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL
    
    console.log('[Test Email] RESEND_API_KEY:', resendApiKey ? '✅ Set' : '❌ Missing')
    console.log('[Test Email] RESEND_FROM_EMAIL:', resendFromEmail || '❌ Missing')

    if (!resendApiKey || !resendFromEmail) {
      res.status(500).json({
        success: false,
        message: 'Resend is not configured. Missing RESEND_API_KEY or RESEND_FROM_EMAIL',
        config: {
          api_key_set: !!resendApiKey,
          from_email_set: !!resendFromEmail
        }
      })
      return
    }

    // Try to send notification through notification module
    try {
      const notificationService = req.scope.resolve(Modules.NOTIFICATION)
      
      const notification = await notificationService.createNotifications({
        to,
        channel: 'email',
        template: 'test-email',
        data: {
          subject: 'Test Email from Maretinda',
          message: 'This is a test email to verify Resend integration is working correctly.',
          timestamp: new Date().toISOString(),
        },
      })
      
      console.log('[Test Email] Notification created:', notification)
      
      res.status(200).json({
        success: true,
        message: `Test email notification created for ${to}`,
        notification,
        note: 'Check your email inbox and spam folder. If you don\'t receive it, check backend logs for errors.'
      })
    } catch (notificationError) {
      console.error('[Test Email] Notification service error:', notificationError)
      
      res.status(500).json({
        success: false,
        message: 'Failed to create notification',
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error',
        stack: notificationError instanceof Error ? notificationError.stack : undefined
      })
    }

  } catch (error) {
    console.error('[Test Email] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

