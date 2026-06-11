export function sellerNewOrderTemplate(data: {
  store_name?: string
  vendor_url?: string
  order?: {
    display_id?: string | number
    seller?: { name?: string; email?: string }
    customer?: { first_name?: string; last_name?: string }
    items?: Array<{
      thumbnail?: string
      product_title?: string
      variant_title?: string
      unit_price?: number
      quantity?: number
    }>
  }
}): string {
  const storeName = data.store_name || "Maretinda"
  const vendorUrl = data.vendor_url || "https://maretinda.com"
  const order = data.order || {}
  const year = new Date().getFullYear()

  const displayId = order.display_id || "0000"
  const sellerName = order.seller?.name || "Seller"
  const customerName =
    [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") || "Customer"
  const items = order.items || []

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
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Order - ${storeName}</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F4F5F7;padding:32px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:22px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#FACC15;letter-spacing:-0.3px;">${storeName}</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">New Order Received</h1>
              <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.6;">Hi ${sellerName}, a customer has placed a new order containing your products. Please review the details below and prepare the items for shipment.</p>
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
                          <p style="margin:4px 0 0;font-size:19px;font-weight:700;color:#111827;">#${displayId}</p>
                        </td>
                        <td style="text-align:right;">
                          <p style="margin:0;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Customer</p>
                          <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#111827;">${customerName}</p>
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
            <td style="padding:0 40px 28px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.6px;">Items to Fulfill</p>
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
                ${itemsHtml || `<tr><td style="padding:16px 20px;font-size:14px;color:#9CA3AF;">No items found</td></tr>`}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 36px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:#FACC15;border-radius:6px;">
                    <a href="${vendorUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;">Manage Orders</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:13px;color:#9CA3AF;">&copy; ${year} ${storeName}. All rights reserved.</p>
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
