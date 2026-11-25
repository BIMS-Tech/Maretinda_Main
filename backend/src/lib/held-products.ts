import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/core-flows"
import { checkConfigurationRule, ConfigurationRuleType } from "@mercurjs/framework"
import { DELIVERY_MISSING, deliveryReady } from "./delivery-setup"
import { sellerReadiness } from "./seller-readiness"
import { sellerIdOfMember } from "./seller-ownership"

/**
 * A seller can't put products on sale until their shop is ready: store setup
 * finished and documents approved. Listing before then used to be refused
 * outright, and drafts stayed hidden after verification until the seller
 * published each one again. Now a product the seller publishes early is kept
 * as a draft marked to publish, and goes live by itself once the shop is ready,
 * as on the large marketplaces.
 */
export const HELD_FLAG = "publish_when_ready"

const publishing = (status: unknown) => status === "proposed" || status === "published"

/**
 * What keeps a shop's products from going on sale: unfinished store setup, or
 * no way to deliver. A product nobody can check out with isn't worth listing.
 */
async function notReady(pg: any, seller: any): Promise<string[]> {
  const missing = [...sellerReadiness(seller).missing]
  if (!(await deliveryReady(pg, seller.id))) missing.push(DELIVERY_MISSING)
  return missing
}

async function sellerOf(req: MedusaRequest) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, (req as any).auth_context?.actor_id)
  return sellerId ? await pg("seller").where("id", sellerId).first() : null
}

/**
 * POST /vendor/products with a publishing status from a shop that isn't ready:
 * create it as a draft marked to publish later, instead of refusing it.
 */
export async function holdNewProductUntilReady(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const body = (req.body ?? {}) as Record<string, any>
    if (!publishing(body.status)) return next()
    const seller = await sellerOf(req)
    if (!seller || !(await notReady(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION), seller)).length) return next()
    const held = { status: "draft", metadata: { ...(body.metadata ?? {}), [HELD_FLAG]: true } }
    Object.assign(body, held)
    const validated = (req as any).validatedBody
    if (validated) Object.assign(validated, held)
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * POST /vendor/products/:id/status asking to publish from a shop that isn't
 * ready: mark the product to publish later and answer with what will happen.
 */
export async function holdPublishUntilReady(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    if (!publishing((req.body as any)?.status)) return next()
    const seller = await sellerOf(req)
    if (!seller) return next()
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const missing = await notReady(pg, seller)
    if (!missing.length) return next()

    const own = await pg("seller_seller_product_product")
      .where({ seller_id: seller.id, product_id: req.params.id })
      .whereNull("deleted_at")
      .first("product_id")
    if (!own) return res.status(404).json({ type: "not_found", message: "Product not found" })

    const products = req.scope.resolve(Modules.PRODUCT)
    const product = await products.retrieveProduct(req.params.id, { select: ["id", "metadata", "status"] })
    await products.updateProducts(req.params.id, {
      status: "draft",
      metadata: { ...(product.metadata ?? {}), [HELD_FLAG]: true },
    } as any)
    res.json({
      product: { id: req.params.id, status: "draft", metadata: { ...(product.metadata ?? {}), [HELD_FLAG]: true } },
      held: true,
      message: `Saved. It goes live automatically once your shop is ready. Still needed: ${missing.join(", ")}.`,
    })
  } catch (error) {
    next(error)
  }
}

/** Publishes the shop's held products if the shop is now ready. Returns how many went live. */
export async function publishHeldProducts(container: any, sellerId: string | null | undefined): Promise<number> {
  if (!sellerId) return 0
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const seller = await pg("seller").where("id", sellerId).whereNull("deleted_at").first()
    if (!seller || (await notReady(pg, seller)).length) return 0
    const held = await pg("product as p")
      .join("seller_seller_product_product as l", "l.product_id", "p.id")
      .where("l.seller_id", sellerId)
      .whereNull("l.deleted_at")
      .whereNull("p.deleted_at")
      .where("p.status", "draft")
      .whereRaw(`p.metadata->>'${HELD_FLAG}' = 'true'`)
      .select("p.id", "p.metadata")
    if (!held.length) return 0
    // If the marketplace ever turns on product approval, held products join that queue instead
    const status = (await checkConfigurationRule(container, ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL)) ? "proposed" : "published"
    for (const p of held) {
      const { [HELD_FLAG]: _done, ...metadata } = p.metadata ?? {}
      await updateProductsWorkflow(container).run({
        input: { selector: { id: p.id }, update: { status, metadata } as any },
      })
    }
    return held.length
  } catch (error) {
    console.error(`[held-products] could not publish for ${sellerId}:`, error instanceof Error ? error.message : error)
    return 0
  }
}

/** After a seller saves their store details, publish anything held if the shop is now ready. */
export function publishHeldAfterSave(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method !== "POST") return next()
  res.on("finish", async () => {
    if (res.statusCode >= 300) return
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellerId = await sellerIdOfMember(pg, (req as any).auth_context?.actor_id).catch(() => null)
    await publishHeldProducts(req.scope, sellerId)
  })
  next()
}
