import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

/**
 * @oas [get] /admin/talk-js
 * operationId: "AdminGetTalkJSConfig"
 * summary: "Get TalkJS Configuration"
 * description: "Returns TalkJS app ID and user hash for authentication."
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             appId:
 *               type: string
 *             userHash:
 *               type: string
 * tags:
 *   - Admin TalkJS
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const userId = req.auth_context?.actor_id
    
    // Return TalkJS configuration
    res.status(200).json({
      appId: process.env.TALK_JS_APP_ID || '',
      userId: userId,
      userHash: '', // Implement proper HMAC hashing if needed
    })
  } catch (error) {
    console.error('[Admin TalkJS] Error getting TalkJS config:', error)
    res.status(500).json({
      message: 'Failed to get TalkJS configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

