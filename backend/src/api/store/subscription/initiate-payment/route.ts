import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

/**
 * Retired 17 November 2026. Paying for a plan before applying created a seller
 * that skipped the application and the team's approval. Every seller now
 * applies in the seller panel; plans are chosen after approval.
 */
export async function POST(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  res.status(410).json({
    code: "retired",
    message: "Apply to sell on Maretinda from the seller panel's registration page. Plans are chosen after your application is approved.",
  })
}
