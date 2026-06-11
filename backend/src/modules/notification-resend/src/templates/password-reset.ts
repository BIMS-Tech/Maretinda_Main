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
  <title>Reset Your Password - ${storeName}</title>
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

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Password Reset Request</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                Hi ${userName}, we received a request to reset the password for your account.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                Click the button below to set a new password. This link will expire in <strong style="color:#111827;">15 minutes</strong>.
                If you did not request a password reset, you can safely ignore this email.
              </p>
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#FACC15;border-radius:6px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#111827;text-decoration:none;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.6;">
                If the button does not work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color:#6B7280;word-break:break-all;">${resetUrl}</a>
              </p>
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
