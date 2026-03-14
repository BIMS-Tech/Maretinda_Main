/**
 * Maretinda Order Confirmation Email Template
 * Redesigned according to the provided image
 */

// Template as a plain HTML string function (compatible with Node.js without JSX)
// This avoids the need for build-time JSX transformation
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
      city?: string
      province?: string
    }
  }
}): string {
  const {
    user_name = "Customer",
    order_address = "#",
    store_name = "Maretinda",
    storefront_url = "https://maretinda.com",
    order = {
      display_id: "0000",
      total: 0,
      currency_code: "USD",
      items: [],
      shipping_methods: [{ amount: 0, name: "Standard" }],
      shipping_address: {},
    },
  } = data

  const { display_id, total, currency_code, items, shipping_methods, shipping_address } = order

  // Calculate items total
  const itemsTotal = items?.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0) || 0

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency_code || "USD",
    }).format(amount / 100)
  }

  // Generate items HTML
  const itemsHtml = items?.map((item) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="width: 70px; vertical-align: top;">
              <img src="${item.thumbnail || "https://via.placeholder.com/70"}" 
                   alt="${item.product_title || "Product"}" 
                   style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
            </td>
            <td style="padding-left: 16px; vertical-align: top;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1F2937; line-height: 1.4;">
                ${item.product_title || "Product"}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #6B7280;">
                ${item.variant_title || ""}
              </p>
            </td>
            <td style="text-align: right; vertical-align: top; padding-left: 16px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1F2937;">
                ${formatCurrency((item.unit_price || 0) * (item.quantity || 1))}
              </p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #6B7280;">
                Qty: ${item.quantity || 1}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("") || ""

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmation - ${store_name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F3F4F6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }
      .content-section {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px 0; background-color: #F3F4F6;">
  <center>
    <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #F3F4F6;" role="presentation">
      <tr>
        <td align="center" style="padding: 0 10px;">
          <!-- Email Container -->
          <table cellpadding="0" cellspacing="0" class="email-container" style="width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);" role="presentation">
            
            <!-- Hero Section - Light Purple -->
            <tr>
              <td style="background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); padding: 40px 32px; text-align: center;">
                <!-- Maretinda Logo -->
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px;" role="presentation">
                  <tr>
                    <td style="text-align: center;">
                      <span style="font-size: 28px; font-weight: 700; color: #7C3AED;">Maretinda</span>
                    </td>
                  </tr>
                </table>
                
                <!-- Confirmation Icon -->
                <table cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;" role="presentation">
                  <tr>
                    <td style="background-color: #FFFFFF; border-radius: 50%; padding: 16px;">
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="text-align: center;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="#7C3AED" stroke-width="2"/>
                              <path d="M8 12L11 15L16 9" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                
                <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1F2937;">
                  Your Order Is Confirmed!
                </h1>
                <p style="margin: 0; font-size: 16px; color: #6B7280;">
                  Hi ${user_name}, thank you for your order
                </p>
              </td>
            </tr>

            <!-- Order Info Section -->
            <tr>
              <td class="content-section" style="padding: 32px;">
                <!-- Order ID -->
                <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;" role="presentation">
                  <tr>
                    <td style="background-color: #F9FAFB; border-radius: 8px; padding: 16px; text-align: center;">
                      <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; color: #6B7280; letter-spacing: 0.5px;">
                        Order ID
                      </p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #7C3AED;">
                        #${display_id}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Order Summary Table -->
                <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;" role="presentation">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937;">
                        Order Summary
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #F5F3FF; border-radius: 8px 8px 0 0; padding: 12px 16px;">
                      <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
                        <tr>
                          <th style="text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; padding-bottom: 0;">
                            Product
                          </th>
                          <th style="text-align: right; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; padding-bottom: 0;">
                            Amount
                          </th>
                          <th style="text-align: right; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; padding-bottom: 0; padding-left: 16px;">
                            Qty
                          </th>
                          <th style="text-align: right; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; padding-bottom: 0; padding-left: 16px;">
                            Total
                          </th>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${itemsHtml}
                </table>

                <!-- Order Totals -->
                <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
                        <tr>
                          <td style="font-size: 14px; color: #6B7280;">Subtotal</td>
                          <td style="text-align: right; font-size: 14px; font-weight: 500; color: #1F2937;">
                            ${formatCurrency(itemsTotal)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
                        <tr>
                          <td style="font-size: 14px; color: #6B7280;">
                            Shipping (${shipping_methods?.[0]?.name || "Standard"})
                          </td>
                          <td style="text-align: right; font-size: 14px; font-weight: 500; color: #1F2937;">
                            ${formatCurrency((shipping_methods?.[0]?.amount || 0))}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 8px; border-top: 1px solid #E5E7EB;">
                      <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
                        <tr>
                          <td style="font-size: 16px; font-weight: 600; color: #1F2937;">
                            Total Amount
                          </td>
                          <td style="text-align: right; font-size: 16px; font-weight: 700; color: #7C3AED;">
                            ${formatCurrency(total || itemsTotal + (shipping_methods?.[0]?.amount || 0))}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td style="padding: 0 32px 32px;">
                <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
                  <tr>
                    <td align="center" style="padding: 16px 24px; background-color: #FBBF24; border-radius: 8px;">
                      <a href="${order_address}" 
                         style="display: block; font-size: 16px; font-weight: 600; color: #1F2937; text-decoration: none;">
                        View Order Details
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #F9FAFB; padding: 24px 32px; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">
                  Warm regards,
                </p>
                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #7C3AED;">
                  The ${store_name} Team
                </p>
                <p style="margin: 16px 0 0; font-size: 12px; color: #9CA3AF;">
                  ${storefront_url}
                </p>
              </td>
            </tr>

          </table>
          <!-- End Email Container -->
          
          <!-- Bottom spacing -->
          <table cellpadding="0" cellspacing="0" style="width: 100%;" role="presentation">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                  This email was sent to ${user_name}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `
}
