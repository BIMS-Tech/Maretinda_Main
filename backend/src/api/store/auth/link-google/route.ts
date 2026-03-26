import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { generateJwtToken } from "@medusajs/utils"

/**
 * POST /store/auth/link-google
 *
 * Links the Google auth identity (which has no actor_id) to an existing
 * customer that was registered via email/password.
 *
 * Called by the Next.js Google OAuth callback when POST /store/customers
 * returns 422 (customer with this email already exists).
 *
 * Requires: Authorization: Bearer <google_oauth_token_without_actor_id>
 * Returns:  { token } — a fresh JWT with actor_id set to the existing customer
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const authContext = (req as any).auth_context
    const authIdentityId: string | undefined = authContext?.auth_identity_id

    if (!authIdentityId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // If actor_id is already set, no linking needed
    if (authContext?.actor_id) {
      return res.status(400).json({ message: "Account is already linked" })
    }

    const authService = req.scope.resolve("auth") as any

    // Fetch the Google auth identity along with its provider identities
    const authIdentity = await authService.retrieveAuthIdentity(authIdentityId, {
      relations: ["provider_identities"],
    }) as any

    // Google stores the user profile in provider_identities[*].user_metadata
    const googleProviderIdentity = authIdentity.provider_identities?.find(
      (pi: any) => pi.provider === "google"
    )
    const email: string | undefined = googleProviderIdentity?.user_metadata?.email

    if (!email) {
      return res
        .status(400)
        .json({ message: "Could not retrieve email from Google identity" })
    }

    // Look up the existing customer by email
    const customerService = req.scope.resolve("customer") as any
    const [customers] = await customerService.listAndCountCustomers(
      { email },
      { take: 1 }
    )

    if (!customers || customers.length === 0) {
      return res.status(404).json({ message: "No customer found with this email" })
    }

    const customer = customers[0]

    // Update the auth identity to set customer_id in app_metadata
    await authService.updateAuthIdentities([
      {
        id: authIdentityId,
        app_metadata: {
          ...(authIdentity.app_metadata ?? {}),
          customer_id: customer.id,
        },
      },
    ])

    // Generate a fresh JWT that includes the actor_id
    const configModule = req.scope.resolve("configModule") as any
    const { http } = configModule.projectConfig

    const token = generateJwtToken(
      {
        actor_id: customer.id,
        actor_type: "customer",
        auth_identity_id: authIdentityId,
        app_metadata: { customer_id: customer.id },
        user_metadata: googleProviderIdentity?.user_metadata ?? {},
      },
      {
        secret: http.jwtSecret as string,
        expiresIn: http.jwtExpiresIn ?? "7d",
      }
    )

    return res.json({ token })
  } catch (error: any) {
    console.error("[link-google] Error:", error)
    return res.status(500).json({ message: error.message })
  }
}
