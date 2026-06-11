export function buyerNewOrderTemplate(data: {
  user_name?: string
  order_address?: string
  store_name?: string
  storefront_url?: string
  order?: {
    display_id?: string | number
    total?: number
    currency_code?: string
    items?: Array<{
      thumbnail?: string
      product_title?: string
      variant_title?: string
      unit_price?: number
      quantity?: number
    }>
    shipping_methods?: Array<{ amount?: number; name?: string }>
    shipping_address?: {
      first_name?: string
      last_name?: string
      address_1?: string
      address_2?: string
      city?: string
      province?: string
      postal_code?: string
      phone?: string
    }
  }
}): string {
  const {
    user_name = "Customer",
    order_address = "#",
    store_name = "Maretinda",
    order = {},
  } = data

  const {
    display_id = "0000",
    total = 0,
    currency_code = "USD",
    items = [],
    shipping_methods = [],
  } = order

  const sa = order.shipping_address || {}
  const year = new Date().getFullYear()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency_code || "USD",
    }).format(amount / 100)

  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1),
    0
  )
  const shippingAmount = shipping_methods[0]?.amount || 0
  const shippingName = shipping_methods[0]?.name || "Standard"
  const orderTotal = total || itemsTotal + shippingAmount

  const itemsHtml = items
    .map(
      (item, i) => `
    <tr${i > 0 ? ' style="border-top:1px solid #E5E7EB;"' : ""}>
      <td style="padding:14px 20px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
          <tr>
            <td style="width:60px;vertical-align:top;">
              ${
                item.thumbnail
                  ? `<img src="${item.thumbnail}" alt="${item.product_title || "Product"}" width="60" height="60" style="border-radius:4px;display:block;object-fit:cover;">`
                  : `<div style="width:60px;height:60px;background:#E5E7EB;border-radius:4px;"></div>`
              }
            </td>
            <td style="padding-left:14px;vertical-align:top;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#111827;line-height:1.4;">${item.product_title || "Product"}</p>
              ${item.variant_title ? `<p style="margin:3px 0 0;font-size:12px;color:#9CA3AF;">${item.variant_title}</p>` : ""}
              <p style="margin:5px 0 0;font-size:12px;color:#6B7280;">Qty: ${item.quantity || 1}</p>
            </td>
            <td style="text-align:right;vertical-align:top;padding-left:12px;white-space:nowrap;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${formatCurrency((item.unit_price || 0) * (item.quantity || 1))}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("")

  const shippingLine1 = [sa.first_name, sa.last_name].filter(Boolean).join(" ")
  const shippingLine2 = [sa.address_1, sa.address_2].filter(Boolean).join(", ")
  const shippingLine3 = [sa.city, sa.province, sa.postal_code].filter(Boolean).join(", ")

  const hasShippingAddress = shippingLine2 || shippingLine3

  const shippingAddressSection = hasShippingAddress
    ? `
        <tr>
          <td style="padding:0 40px 28px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Shipping Address</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
              ${shippingLine1 ? shippingLine1 + "<br>" : ""}
              ${shippingLine2 ? shippingLine2 + "<br>" : ""}
              ${shippingLine3 || ""}
            </p>
          </td>
        </tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed - ${store_name}</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F4F5F7;padding:32px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:22px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#FACC15;letter-spacing:-0.3px;">Maretinda</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Order Confirmed</h1>
              <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">Hi ${user_name}, thank you for your purchase. We have received your order and are getting it ready.</p>
            </td>
          </tr>

          <!-- Order Meta Box -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Order Number</p>
                          <p style="margin:4px 0 0;font-size:19px;font-weight:700;color:#111827;">#${display_id}</p>
                        </td>
                        <td style="text-align:right;">
                          <p style="margin:0;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Order Total</p>
                          <p style="margin:4px 0 0;font-size:19px;font-weight:700;color:#111827;">${formatCurrency(orderTotal)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:0 40px 16px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Items Ordered</p>
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
                ${itemsHtml || `<tr><td style="padding:16px 20px;font-size:14px;color:#9CA3AF;">No items found</td></tr>`}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#6B7280;">Subtotal</td>
                  <td style="padding:5px 0;text-align:right;font-size:14px;color:#374151;">${formatCurrency(itemsTotal)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#6B7280;">Shipping &mdash; ${shippingName}</td>
                  <td style="padding:5px 0;text-align:right;font-size:14px;color:#374151;">${formatCurrency(shippingAmount)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:8px 0;"><div style="height:1px;background:#E5E7EB;"></div></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:15px;font-weight:700;color:#111827;">Total</td>
                  <td style="padding:5px 0;text-align:right;font-size:15px;font-weight:700;color:#111827;">${formatCurrency(orderTotal)}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${shippingAddressSection}

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 36px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:#FACC15;border-radius:6px;">
                    <a href="${order_address}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;">View Order Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:13px;color:#9CA3AF;">&copy; ${year} ${store_name}. All rights reserved.</p>
              <p style="margin:8px 0 0;font-size:12px;color:#9CA3AF;">Powered by BIMS Technologies</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
