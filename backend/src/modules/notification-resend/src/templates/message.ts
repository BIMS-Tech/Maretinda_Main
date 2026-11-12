import { emailLogo } from "./logo"

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string))

/**
 * One branded layout for short notices: a heading, a few paragraphs and an
 * optional button. Used for everything that isn't an order summary, so each
 * new notice is data, not another hand-built HTML file.
 */
export function messageTemplate(data: {
  store_name?: string
  eyebrow?: string
  heading?: string
  user_name?: string
  paragraphs?: string[]
  button?: { label: string; url: string } | null
  note?: string
}): string {
  const storeName = data.store_name || "Maretinda"
  const year = new Date().getFullYear()
  const paragraphs = (data.paragraphs || [])
    .map((p) => `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.75;">${esc(p)}</p>`)
    .join("")
  const button = data.button?.url
    ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:20px auto 4px;"><tr><td style="background:#432C63;border-radius:10px;">
         <a href="${esc(data.button.url)}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">${esc(data.button.label)}</a>
       </td></tr></table>`
    : ""
  const note = data.note
    ? `<p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;line-height:1.6;">${esc(data.note)}</p>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(data.heading || storeName)}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F1F5F9;padding:40px 0;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;">
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;">
                <tr>
                  <td style="background:#432C63;padding:36px 40px 30px;text-align:center;">
                    ${emailLogo(storeName, 22)}
                    ${data.eyebrow ? `<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#FFC533;text-transform:uppercase;letter-spacing:2px;">${esc(data.eyebrow)}</p>` : ""}
                    <p style="margin:0;font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">${esc(data.heading || storeName)}</p>
                    <div style="width:40px;height:3px;background:#FFC533;margin:14px auto 0;border-radius:2px;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 40px 34px;">
                    <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">Hi ${esc(data.user_name || "there")},</h1>
                    ${paragraphs}
                    ${button}
                    ${note}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 8px 0;text-align:center;font-size:12px;color:#9CA3AF;line-height:1.6;">
              &copy; ${year} ${esc(storeName)}, operated by BIMS Technologies, Inc. Need help? support@maretinda.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
