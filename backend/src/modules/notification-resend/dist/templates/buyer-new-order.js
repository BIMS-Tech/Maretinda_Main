"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerNewOrderTemplate = buyerNewOrderTemplate;
const logo_1 = require("./logo");
function buyerNewOrderTemplate(data) {
    const { user_name = "Customer", order_address = "#", store_name = "Maretinda", order = {}, } = data;
    const { display_id = "0000", total = 0, discount_total = 0, currency_code = "PHP", items = [], shipping_methods = [], } = order;
    const sa = order.shipping_address || {};
    const year = new Date().getFullYear();
    const formatCurrency = (amount) => new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency_code || "PHP",
    }).format(amount);
    const itemsTotal = items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 1), 0);
    const shippingAmount = shipping_methods[0]?.amount || 0;
    const shippingName = shipping_methods[0]?.name || "Standard Shipping";
    const orderTotal = total || itemsTotal + shippingAmount - discount_total;
    const itemsHtml = items
        .map((item, i) => `
    <tr${i > 0 ? ' style="border-top:1px solid #F3F4F6;"' : ""}>
      <td style="padding:16px 20px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
          <tr>
            <td style="width:64px;vertical-align:top;">
              ${item.thumbnail
        ? `<img src="${item.thumbnail}" alt="${item.product_title || "Product"}" width="64" height="64" style="border-radius:8px;display:block;object-fit:cover;border:1px solid #F3F4F6;">`
        : `<div style="width:64px;height:64px;background:#F3F4F6;border-radius:8px;"></div>`}
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
    </tr>`)
        .join("");
    const shippingLine1 = [sa.first_name, sa.last_name].filter(Boolean).join(" ");
    const shippingLine2 = [sa.address_1, sa.address_2].filter(Boolean).join(", ");
    const shippingLine3 = [sa.city, sa.province, sa.postal_code].filter(Boolean).join(", ");
    const hasShippingAddress = shippingLine2 || shippingLine3;
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
        : "";
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

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">

                <!-- Header banner -->
                <tr>
                  <td style="background:#432C63;padding:36px 40px 30px;text-align:center;">
                    ${(0, logo_1.emailLogo)(store_name, 22)}
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#FFC533;text-transform:uppercase;letter-spacing:2px;">Order Confirmed</p>
                    <p style="margin:0;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">#${display_id}</p>
                    <div style="width:40px;height:3px;background:#FFC533;margin:14px auto 0;border-radius:2px;"></div>
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
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#432C63;border-radius:10px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1px;">Order Total</p>
                                <p style="margin:6px 0 0;font-size:24px;font-weight:800;color:#FFC533;">${formatCurrency(orderTotal)}</p>
                              </td>
                              <td style="text-align:right;">
                                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1px;">Order ID</p>
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
                      ${discount_total > 0
        ? `<tr>
                        <td style="padding:6px 0;font-size:14px;color:#6B7280;">Voucher discount</td>
                        <td style="padding:6px 0;text-align:right;font-size:14px;color:#059669;">−${formatCurrency(discount_total)}</td>
                      </tr>`
        : ""}
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
                        <td style="background:#FFC533;border-radius:10px;">
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
</html>`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV5ZXItbmV3LW9yZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3RlbXBsYXRlcy9idXllci1uZXctb3JkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxzREFxUUM7QUF2UUQsaUNBQWtDO0FBRWxDLFNBQWdCLHFCQUFxQixDQUFDLElBNkJyQztJQUNDLE1BQU0sRUFDSixTQUFTLEdBQUcsVUFBVSxFQUN0QixhQUFhLEdBQUcsR0FBRyxFQUNuQixVQUFVLEdBQUcsV0FBVyxFQUN4QixLQUFLLEdBQUcsRUFBRSxHQUNYLEdBQUcsSUFBSSxDQUFBO0lBRVIsTUFBTSxFQUNKLFVBQVUsR0FBRyxNQUFNLEVBQ25CLEtBQUssR0FBRyxDQUFDLEVBQ1QsY0FBYyxHQUFHLENBQUMsRUFDbEIsYUFBYSxHQUFHLEtBQUssRUFDckIsS0FBSyxHQUFHLEVBQUUsRUFDVixnQkFBZ0IsR0FBRyxFQUFFLEdBQ3RCLEdBQUcsS0FBSyxDQUFBO0lBRVQsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQTtJQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFBO0lBRXJDLE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBYyxFQUFFLEVBQUUsQ0FDeEMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRTtRQUM3QixLQUFLLEVBQUUsVUFBVTtRQUNqQixRQUFRLEVBQUUsYUFBYSxJQUFJLEtBQUs7S0FDakMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUVuQixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUM3QixDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMs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