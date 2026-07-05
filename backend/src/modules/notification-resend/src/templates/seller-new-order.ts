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
              <p style="margin:0;font-size:12px;color:#6B7280;">Qty: <strong style="color:#111827;">${item.quantity || 1}</strong></p>
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
  <title>New Order Received &mdash; ${storeName}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F1F5F9;padding:40px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;">

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">

                <!-- Header banner -->
                <tr>
                  <td style="background:#432C63;padding:36px 40px 30px;text-align:center;">
                    <img src="https://maretinda.com/logo-m-2.png" alt="${storeName}" height="42" style="display:inline-block;border:0;max-width:220px;margin-bottom:22px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#FFC533;text-transform:uppercase;letter-spacing:2px;">New Order</p>
                    <p style="margin:0;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">#${displayId}</p>
                    <div style="width:40px;height:3px;background:#FFC533;margin:14px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>

                <!-- Alert badge -->
                <tr>
                  <td style="padding:32px 40px 0;text-align:center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                      <tr>
                        <td style="background:#D1FAE5;border-radius:20px;padding:8px 20px;">
                          <p style="margin:0;font-size:13px;font-weight:700;color:#065F46;">&#10003; &nbsp;Payment received &mdash; ready to fulfill</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding:24px 40px 28px;">
                    <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">Hi ${sellerName},</h1>
                    <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.75;">
                      Great news &mdash; a customer has placed a new order containing your product(s). Please review the details below and prepare the items for shipment as soon as possible.
                    </p>
                  </td>
                </tr>

                <!-- Order meta box -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#432C63;border-radius:10px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1px;">Order Number</p>
                                <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#FFC533;">#${displayId}</p>
                              </td>
                              <td style="text-align:right;">
                                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1px;">Customer</p>
                                <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#FFFFFF;">${customerName}</p>
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
                    <p style="margin:0;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;">Items to Fulfill</p>
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

                <!-- Action steps -->
                <tr>
                  <td style="padding:0 40px 28px;">
                    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;">Next Steps</p>
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:24px;">
                          <div style="width:22px;height:22px;background:#FFC533;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#111827;line-height:22px;">1</div>
                        </td>
                        <td style="padding:6px 0 6px 12px;font-size:14px;color:#374151;vertical-align:top;line-height:1.6;">
                          Log in to your vendor dashboard and confirm the order
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:24px;">
                          <div style="width:22px;height:22px;background:#FFC533;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#111827;line-height:22px;">2</div>
                        </td>
                        <td style="padding:6px 0 6px 12px;font-size:14px;color:#374151;vertical-align:top;line-height:1.6;">
                          Pack the items securely and arrange for pickup or drop-off
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:24px;">
                          <div style="width:22px;height:22px;background:#FFC533;border-radius:50%;text-align:center;font-size:12px;font-weight:700;color:#111827;line-height:22px;">3</div>
                        </td>
                        <td style="padding:6px 0 6px 12px;font-size:14px;color:#374151;vertical-align:top;line-height:1.6;">
                          Mark the order as shipped and enter the tracking number
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding:0 40px 40px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                      <tr>
                        <td style="background:#FFC533;border-radius:10px;">
                          <a href="${vendorUrl}" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#111827;text-decoration:none;letter-spacing:-0.2px;">Manage Orders &rarr;</a>
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
