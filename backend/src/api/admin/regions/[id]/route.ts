import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Override for POST /admin/regions/:id
 * This ensures payment provider associations are properly persisted
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<any>,
  res: MedusaResponse
): Promise<void> => {
  const { id } = req.params
  const updateData = req.validatedBody || req.body

  try {
    console.log('[Admin Region Update] Updating region:', id)
    console.log('[Admin Region Update] Update data:', JSON.stringify(updateData, null, 2))

    // If payment_providers is in the update, log it specifically
    if (updateData.payment_providers) {
      console.log('[Admin Region Update] Payment providers to save:', updateData.payment_providers)
    }

    // Use the workflow to update the region
    const { result } = await updateRegionsWorkflow(req.scope).run({
      input: {
        selector: { id },
        update: updateData,
      },
    })

    const updatedRegion = result[0]

    // Verify payment providers were saved by checking the database directly
    if (updateData.payment_providers) {
      try {
        const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        
        const linkResult = await pgConnection.raw(`
          SELECT pp.id, pp.is_enabled
          FROM payment_provider pp
          INNER JOIN region_payment_provider rpp ON pp.id = rpp.payment_provider_id
          WHERE rpp.region_id = ?
        `, [id])
        
        const providers = linkResult.rows || []
        
        console.log('[Admin Region Update] Verified payment provider links:', 
          providers.map((p: any) => p.id))
        
        // Return region with providers
        res.status(200).json({
          region: {
            ...updatedRegion,
            payment_providers: providers,
          },
        })
      } catch (linkError) {
        console.error('[Admin Region Update] Could not verify links:', linkError)
        // Just return the region without verification
        res.status(200).json({
          region: updatedRegion,
        })
      }
    } else {
      res.status(200).json({
        region: updatedRegion,
      })
    }
  } catch (error) {
    console.error('[Admin Region Update] Error updating region:', error)
    res.status(500).json({
      message: "Failed to update region",
      error: (error as Error).message,
    })
  }
}

