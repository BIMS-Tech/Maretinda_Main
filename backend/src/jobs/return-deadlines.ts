import type { MedusaContainer } from "@medusajs/framework/types"
import { runReturnDeadlines } from "../lib/return-cases"

/** Every 15 minutes: returns whose 48-hour or 5-day deadlines passed move on by themselves (lib/return-cases). */
export default async function returnDeadlines(container: MedusaContainer) {
  try {
    const moved = await runReturnDeadlines(container)
    if (moved.length) console.log(`[return-deadlines] moved ${moved.length}: ${moved.map((m) => `${m.request_id}→${m.to}`).join(", ")}`)
  } catch (error) {
    console.error("[return-deadlines] failed:", error instanceof Error ? error.message : error)
  }
}

export const config = { name: "return-deadlines", schedule: "*/15 * * * *" }
