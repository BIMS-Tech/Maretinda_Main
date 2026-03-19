"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerAccountCreatedTemplate = buyerAccountCreatedTemplate;
function buyerAccountCreatedTemplate(data) {
    const userName = data.user_name || 'Customer';
    const storeName = data.store_name || 'Maretinda';
    const storefrontUrl = data.storefront_url || 'https://maretinda.com';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to ${storeName}</title>
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
            <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Welcome, ${userName}!</h2>
            <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
              Thank you for creating an account with <strong>${storeName}</strong>. You can now shop, track your orders, and manage your profile.
            </p>
            <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6;">
              Start exploring thousands of products from verified sellers across the Philippines.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#facc15;border-radius:6px;">
                  <a href="${storefrontUrl}" style="display:inline-block;padding:14px 32px;color:#111827;font-weight:bold;font-size:15px;text-decoration:none;">
                    Start Shopping
                  </a>
                </td>
              </tr>
            </table>
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
</html>`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV5ZXItYWNjb3VudC1jcmVhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3RlbXBsYXRlcy9idXllci1hY2NvdW50LWNyZWF0ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxrRUEyREM7QUEzREQsU0FBZ0IsMkJBQTJCLENBQUMsSUFJM0M7SUFDQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLFVBQVUsQ0FBQTtJQUM3QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQTtJQUNoRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxJQUFJLHVCQUF1QixDQUFBO0lBRXBFLE9BQU87Ozs7O3NCQUthLFNBQVM7Ozs7Ozs7OztrRkFTbUQsU0FBUzs7Ozs7O2lGQU1WLFFBQVE7OytEQUUxQixTQUFTOzs7Ozs7Ozs2QkFRM0MsYUFBYTs7Ozs7Ozs7Ozs7dUVBVzZCLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLElBQUksU0FBUzs7Ozs7Ozs7UUFRcEcsQ0FBQTtBQUNSLENBQUMifQ==