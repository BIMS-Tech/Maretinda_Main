export type SellerPaymentState = "cash_on_delivery" | "paid"

const COD_PROVIDER_ID = "pp_system_default"

/**
 * What the seller's new-order email may say about payment. Undefined means we
 * could not tell, and the email then makes no claim: telling a seller an unpaid
 * order is paid is worse than saying nothing.
 *
 * Reads the provider rather than the capture state, because Mercur auto-captures
 * COD on placement and reset-cod-split-payment only reverses that afterwards.
 */
export async function getSellerPaymentState(
  query: { graph: (config: any) => Promise<{ data: any[] }> },
  orderId: string
): Promise<SellerPaymentState | undefined> {
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "payment_collections.payments.provider_id",
        "payment_collections.payment_sessions.provider_id",
      ],
      filters: { id: orderId },
    })

    const collection = data?.[0]?.payment_collections?.[0]
    const providerId =
      collection?.payments?.[0]?.provider_id ?? collection?.payment_sessions?.[0]?.provider_id

    if (!providerId) return undefined
    return providerId === COD_PROVIDER_ID ? "cash_on_delivery" : "paid"
  } catch (_) {
    return undefined
  }
}
