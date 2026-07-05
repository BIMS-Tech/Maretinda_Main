export function buyerAccountCreatedTemplate(data: {
  user_name?: string
  store_name?: string
  storefront_url?: string
}): string {
  const userName = data.user_name || "Customer"
  const storeName = data.store_name || "Maretinda"
  const storefrontUrl = data.storefront_url || "https://maretinda.com"
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to ${storeName}</title>
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
                  <td style="background:#432C63;padding:38px 40px 34px;text-align:center;">
                    <p style="margin:0 0 20px;font-size:12px;font-weight:600;color:#FFC533;text-transform:uppercase;letter-spacing:2px;">Welcome to</p>
                    <img src="https://maretinda.com/logo-m-2.png" alt="${storeName}" height="48" style="display:inline-block;border:0;max-width:260px;">
                    <div style="width:40px;height:3px;background:#FFC533;margin:18px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding:40px 40px 32px;text-align:center;">
                    <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Hi ${userName}, your account is ready!</h1>
                    <p style="margin:0;font-size:15px;color:#6B7280;line-height:1.75;">
                      You just joined thousands of shoppers discovering authentic products from verified sellers across the Philippines. Here&rsquo;s everything you can do right now.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:#F3F4F6;"></div>
                  </td>
                </tr>

                <!-- Features -->
                <tr>
                  <td style="padding:32px 40px 8px;">
                    <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1.2px;">What&rsquo;s waiting for you</p>

                    <!-- Feature 1 -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:16px;">
                      <tr>
                        <td style="width:48px;vertical-align:top;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:44px;height:44px;background:#FEF9C3;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;line-height:44px;">&#128722;</td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#111827;">Shop from verified sellers</p>
                          <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">Browse fashion, electronics, home &amp; lifestyle, and more from trusted merchants.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 2 -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:16px;">
                      <tr>
                        <td style="width:48px;vertical-align:top;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:44px;height:44px;background:#FEF9C3;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;line-height:44px;">&#128230;</td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#111827;">Track every order in real time</p>
                          <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">Stay updated from checkout to delivery with live order tracking in your account.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 3 -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:16px;">
                      <tr>
                        <td style="width:48px;vertical-align:top;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:44px;height:44px;background:#FEF9C3;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;line-height:44px;">&#127775;</td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#111827;">Get exclusive deals &amp; discounts</p>
                          <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">Unlock member-only offers, flash sales, and curated picks just for you.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 4 -->
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:32px;">
                      <tr>
                        <td style="width:48px;vertical-align:top;">
                          <table cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="width:44px;height:44px;background:#FEF9C3;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;line-height:44px;">&#128172;</td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#111827;">Chat directly with sellers</p>
                          <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">Ask questions, request custom orders, and build trust before you buy.</p>
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
                          <a href="${storefrontUrl}" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#111827;text-decoration:none;letter-spacing:-0.2px;">Start Shopping &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Help banner -->
                <tr>
                  <td style="padding:0 40px 40px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#111827;">Need help getting started?</p>
                          <p style="margin:0;font-size:13px;color:#6B7280;">
                            Our support team is here for you &mdash;
                            <a href="mailto:support@maretinda.com" style="color:#111827;font-weight:600;text-decoration:none;">support@maretinda.com</a>
                          </p>
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
