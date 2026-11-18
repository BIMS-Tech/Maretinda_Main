import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerPanelUrl, sendNotice, storefrontUrl } from "./notify"

type ReviewFacts = {
  reference: "product" | "seller"
  rating: number
  note: string | null
  productTitle?: string | null
  sellerName: string
}

export const stars = (rating: number) => {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return `${"★".repeat(r)}${"☆".repeat(5 - r)}`
}

/** What the shop is told about a new review of it or one of its products. */
export function reviewEmail(f: ReviewFacts) {
  const what = f.reference === "product" ? `“${f.productTitle || "your product"}”` : "your shop"
  const low = f.rating <= 2
  return {
    subject: `New ${f.rating}-star review of ${f.reference === "product" ? f.productTitle || "your product" : f.sellerName}`,
    heading: "You have a new review",
    paragraphs: [
      `A buyer rated ${what} ${stars(f.rating)} (${f.rating} of 5).`,
      ...(f.note?.trim() ? [`They wrote: “${f.note.trim().slice(0, 600)}”`] : []),
      ...(f.reference === "seller"
        ? [low ? "A short, polite reply that offers to make it right helps future buyers trust your shop." : "You can reply to it from your seller panel."]
        : []),
      ...(low && f.reference === "product" ? ["If something went wrong with the order, message the buyer from your seller panel."] : []),
    ],
  }
}

async function sendReviewEmail(container: any, reviewId: string, body: any) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const review = await pg("review").where("id", reviewId).first("id", "reference", "rating", "customer_note")
  if (!review) return
  const reference = review.reference as "product" | "seller"
  const refId = String(body?.reference_id ?? "")

  let seller: { id: string; name: string; email: string | null } | undefined
  let product: { id: string; title: string; handle: string } | undefined
  if (reference === "product") {
    product = await pg("product").where("id", refId).first("id", "title", "handle")
    seller = await pg("seller_seller_product_product as l")
      .join("seller as s", "s.id", "l.seller_id")
      .where("l.product_id", refId)
      .whereNull("l.deleted_at")
      .first("s.id", "s.name", "s.email")
  } else {
    seller = await pg("seller").where("id", refId).whereNull("deleted_at").first("id", "name", "email")
  }
  if (!seller?.email) return

  const e = reviewEmail({
    reference,
    rating: Number(review.rating),
    note: review.customer_note,
    productTitle: product?.title,
    sellerName: seller.name,
  })
  await sendNotice(container, {
    to: seller.email,
    subject: e.subject,
    eyebrow: "Reviews",
    heading: e.heading,
    user_name: seller.name,
    paragraphs: e.paragraphs,
    // The seller panel lists shop reviews (with replies); product reviews show on the product page
    button:
      reference === "seller"
        ? { label: "Open the review", url: `${sellerPanelUrl()}/reviews/${review.id}` }
        : product?.handle
          ? { label: "See it on your product page", url: `${storefrontUrl()}/products/${product.handle}` }
          : null,
  })
}

/**
 * Emails the shop when a buyer reviews it or one of its products. Reads the new
 * review's id from Mercur's own answer and never delays or fails the request.
 */
export function emailSellerAboutReview(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method !== "POST") return next()
  let id: string | undefined
  const json = res.json.bind(res)
  res.json = ((payload: any) => {
    id = payload?.review?.id
    return json(payload)
  }) as any
  const body = req.body
  res.on("finish", () => {
    if (!id || res.statusCode >= 300) return
    sendReviewEmail(req.scope, id, body).catch((e) => console.error("[review-emails] failed:", e?.message))
  })
  next()
}
