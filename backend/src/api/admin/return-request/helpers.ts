/**
 * Return requests as the admin panel reads them. Mercur stores the seller's
 * decision as vendor_*; the panel calls the seller the seller.
 */
export const RETURN_REQUEST_FIELDS = [
  "*",
  "line_items.*",
  "order.id",
  "order.display_id",
  "order.email",
  "order.customer.first_name",
  "order.customer.last_name",
  "order.customer.email",
  "seller.id",
  "seller.name",
]

export const forAdmin = (r: any) => ({
  ...r,
  seller_reviewer_id: r.vendor_reviewer_id ?? null,
  seller_reviewer_note: r.vendor_reviewer_note ?? null,
  seller_reviewer_date: r.vendor_review_date ?? null,
})
