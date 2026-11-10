import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /store/newsletter — signs an email up to the newsletter. Signing up
 * again is fine and says the same, so the form can't be used to check who
 * is on the list.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const email = String((req.body as any)?.email ?? "").trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 254) {
    return res.status(400).json({ message: "Enter a valid email address" })
  }
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await pg("newsletter_subscriber").insert({ email }).onConflict("email").ignore()
  res.json({ subscribed: true })
}
