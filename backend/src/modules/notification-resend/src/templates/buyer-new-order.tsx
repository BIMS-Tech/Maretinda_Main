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
    currency_code = "PHP",
    items = [],
    shipping_methods = [],
  } = order

  const sa = order.shipping_address || {}
  const year = new Date().getFullYear()

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: currency_code || "PHP",
    }).format(amount / 100)

  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1),
    0
  )
  const shippingAmount = shipping_methods[0]?.amount || 0
  const shippingName = shipping_methods[0]?.name || "Standard Shipping"
  const orderTotal = total || itemsTotal + shippingAmount

  const itemsHtml = items
    .map(
      (item, i) => `
    <tr${i > 0 ? ' style="border-top:1px solid #F3F4F6;"' : ""}>
      <td style="padding:16px 20px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
          <tr>
            <td style="width:64px;vertical-align:top;">
              ${
                item.thumbnail
                  ? `<img src="${item.thumbnail}" alt="${item.product_title || "Product"}" width="64" height="64" style="border-radius:8px;display:block;object-fit:cover;border:1px solid #F3F4F6;">`
                  : `<div style="width:64px;height:64px;background:#F3F4F6;border-radius:8px;"></div>`
              }
            </td>
            <td style="padding-left:14px;vertical-align:top;">
              <p style="margin:0 0 3px;font-size:14px;font-weight:600;color:#111827;line-height:1.4;">${item.product_title || "Product"}</p>
              ${item.variant_title ? `<p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">${item.variant_title}</p>` : ""}
              <p style="margin:0;font-size:12px;color:#6B7280;">Qty: ${item.quantity || 1}</p>
            </td>
            <td style="text-align:right;vertical-align:top;padding-left:12px;white-space:nowrap;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${formatCurrency((item.unit_price || 0) * (item.quantity || 1))}</p>
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
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;">Shipping Address</p>
            <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;">
              <tr>
                <td style="padding:16px 20px;font-size:14px;color:#374151;line-height:1.75;">
                  ${shippingLine1 ? `<strong style="color:#111827;">${shippingLine1}</strong><br>` : ""}
                  ${shippingLine2 ? `${shippingLine2}<br>` : ""}
                  ${shippingLine3 || ""}
                  ${sa.phone ? `<br><span style="color:#6B7280;">${sa.phone}</span>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed &mdash; ${store_name}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F1F5F9;padding:40px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;">

          <!-- Logo above card -->
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <img src="https://maretinda.com/logo-m-2.png" alt="${store_name}" height="40" style="display:inline-block;border:0;max-width:180px;">
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">

                <!-- Header banner -->
                <tr>
                  <td style="background:#111827;padding:32px 40px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#FACC15;text-transform:uppercase;letter-spacing:2px;">Order Confirmed</p>
                    <p style="margin:0;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">#${display_id}</p>
                    <div style="width:40px;height:3px;background:#FACC15;margin:14px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding:32px 40px 28px;">
                    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">Thank you, ${user_name}!</h1>
                    <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.75;">
                      We&rsquo;ve received your order and the seller is already preparing your items. You&rsquo;ll receive another update when your order ships.
                    </p>
                  </td>
                </tr>

                <!-- Order summary box -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#111827;border-radius:10px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Order Total</p>
                                <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#FACC15;">${formatCurrency(orderTotal)}</p>
                              </td>
                              <td style="text-align:right;">
                                <p style="margin:0;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
                                <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#FFFFFF;">#${display_id}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items heading -->
                <tr>
                  <td style="padding:0 40px 12px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;">Items Ordered</p>
                  </td>
                </tr>

                <!-- Items table -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
                      ${itemsHtml || `<tr><td style="padding:20px;font-size:14px;color:#9CA3AF;text-align:center;">No items found</td></tr>`}
                    </table>
                  </td>
                </tr>

                <!-- Price breakdown -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#6B7280;">Subtotal</td>
                        <td style="padding:6px 0;text-align:right;font-size:14px;color:#374151;">${formatCurrency(itemsTotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#6B7280;">Shipping &mdash; ${shippingName}</td>
                        <td style="padding:6px 0;text-align:right;font-size:14px;color:#374151;">${formatCurrency(shippingAmount)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:10px 0;">
                          <div style="height:1px;background:#E5E7EB;"></div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:16px;font-weight:700;color:#111827;">Total</td>
                        <td style="padding:6px 0;text-align:right;font-size:16px;font-weight:700;color:#111827;">${formatCurrency(orderTotal)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${shippingAddressSection}

                <!-- CTA -->
                <tr>
                  <td style="padding:0 40px 40px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                      <tr>
                        <td style="background:#FACC15;border-radius:10px;">
                          <a href="${order_address}" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#111827;text-decoration:none;letter-spacing:-0.2px;">View Order Details &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">&copy; ${year} Maretinda. All rights reserved.</p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;">Powered by BIMS Technologies &middot; Philippines</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
