export function passwordResetTemplate(data: {
  user_name?: string
  store_name?: string
  reset_url?: string
}): string {
  const userName = data.user_name || 'Customer'
  const storeName = data.store_name || 'Maretinda'
  const resetUrl = data.reset_url || '#'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#facc15;font-size:28px;font-weight:bold;">${storeName}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Reset Your Password</h2>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Hi ${userName}, we received a request to reset your password.
            </p>
            <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6;">
              Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
              If you did not request this, you can safely ignore this email.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#facc15;border-radius:6px;">
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#111827;font-weight:bold;font-size:15px;text-decoration:none;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
              Or copy this link: <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:13px;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Powered by BIMS Technologies</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
