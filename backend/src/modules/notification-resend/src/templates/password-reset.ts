export function passwordResetTemplate(data: {
  user_name?: string
  store_name?: string
  reset_url?: string
}): string {
  const userName = data.user_name || "Customer"
  const storeName = data.store_name || "Maretinda"
  const resetUrl = data.reset_url || "#"
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password &mdash; ${storeName}</title>
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
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#FFC533;text-transform:uppercase;letter-spacing:2px;">Account Security</p>
                    <p style="margin:0;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">Password Reset</p>
                    <div style="width:40px;height:3px;background:#FFC533;margin:14px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>

                <!-- Lock icon row -->
                <tr>
                  <td style="padding:36px 40px 0;text-align:center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                      <tr>
                        <td style="width:64px;height:64px;background:#FEF9C3;border-radius:16px;text-align:center;vertical-align:middle;font-size:32px;line-height:64px;">&#128274;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:24px 40px 32px;text-align:center;">
                    <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Hi ${userName},</h1>
                    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.75;">
                      We received a request to reset the password for your Maretinda account. Click the button below to choose a new password.
                    </p>
                    <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
                      This link expires in <strong style="color:#111827;">15 minutes</strong>. If you didn&rsquo;t request a reset, no action is needed &mdash; your account remains secure.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding:0 40px 36px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
                      <tr>
                        <td style="background:#FFC533;border-radius:10px;">
                          <a href="${resetUrl}" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#111827;text-decoration:none;letter-spacing:-0.2px;">Reset My Password</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:#F3F4F6;"></div>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td style="padding:24px 40px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">Button not working?</p>
                    <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.7;">Copy and paste this link into your browser:</p>
                    <p style="margin:8px 0 0;font-size:12px;line-height:1.6;">
                      <a href="${resetUrl}" style="color:#6B7280;word-break:break-all;text-decoration:underline;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>

                <!-- Security note -->
                <tr>
                  <td style="padding:0 40px 40px;">
                    <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
                            <strong>Security tip:</strong> Maretinda will never ask for your password via email or phone. If you did not request this reset, please contact us immediately at
                            <a href="mailto:support@maretinda.com" style="color:#92400E;font-weight:600;">support@maretinda.com</a>
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
