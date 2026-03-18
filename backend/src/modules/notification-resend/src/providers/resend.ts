import {
  AbstractNotificationProviderService,
} from "@medusajs/framework/utils"
import { NotificationTypes } from "@medusajs/types"
import { Resend } from "resend"
import { buyerNewOrderTemplate, buyerAccountCreatedTemplate, passwordResetTemplate } from "../templates"

interface MaretindaResendOptions {
  api_key?: string
  from?: string
}

export class MaretindaResendProvider extends AbstractNotificationProviderService {
  static identifier = "maretinda-resend"
  static validateOptions(options: Record<any, any>): void {
    if (!options.api_key) {
      throw new Error("API key is required in the provider's options.")
    }
  }

  private resend: Resend | null = null
  private fromAddress: string = ""
  protected logger_: any
  protected options_: MaretindaResendOptions

  constructor(
    { logger }: { logger: any },
    options: MaretindaResendOptions
  ) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.fromAddress = options.from || "orders@maretinda.com"

    if (options.api_key) {
      this.resend = new Resend(options.api_key)
      console.log("[notification-resend] Resend provider initialized")
    } else {
      console.warn("[notification-resend] Resend API key not configured - emails will be logged only")
    }
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const { to, channel, template, data, content } = notification

    if (channel !== "email") {
      throw new Error(`Channel ${channel} is not supported`)
    }

    // Handle different email templates
    let html: string
    let subject: string

    const templateData = (data as any)?.data || {}

    if (template === "buyerNewOrderEmailTemplate") {
      html = buyerNewOrderTemplate(templateData)
      subject = content?.subject || "Your Order is Confirmed!"
    } else if (template === "buyerAccountCreatedEmailTemplate") {
      html = buyerAccountCreatedTemplate(templateData)
      subject = content?.subject || `Welcome to ${templateData.store_name || "Maretinda"}!`
    } else if (template === "passwordResetEmailTemplate") {
      html = passwordResetTemplate(templateData)
      subject = content?.subject || "Reset Your Password"
    } else {
      console.warn(`[notification-resend] Unknown template: ${template}, using fallback`)
      html = this.fallbackTemplate(templateData)
      subject = content?.subject || "Notification from Maretinda"
    }

    // Log the email content for debugging
    console.log(`[notification-resend] Sending email to ${to}`)
    console.log(`[notification-resend] Subject: ${subject}`)
    console.log(`[notification-resend] Template: ${template}`)

    if (this.resend) {
      try {
        const result = await this.resend.emails.send({
          from: this.fromAddress,
          to: [to],
          subject,
          html,
        })

        if (result.error) {
          console.error(`[notification-resend] Resend API error: ${JSON.stringify(result.error)}`)
          throw new Error(result.error.message || "Resend API returned an error")
        }
        console.log(`[notification-resend] Email sent successfully: ${result.data?.id}`)
        return { id: result.data?.id || "" }
      } catch (error: any) {
        console.error(`[notification-resend] Failed to send email: ${error.message}`)
        throw error
      }
    } else {
      // Log email content when Resend is not configured
      console.log("=== EMAIL CONTENT (Resend not configured) ===")
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`HTML: ${html.substring(0, 500)}...`)
      console.log("=== END EMAIL CONTENT ===")
      return { id: "mock-email-id" }
    }
  }

  private fallbackTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>${data.store_name || "Maretinda"}</h1>
          <p>${JSON.stringify(data)}</p>
        </body>
      </html>
    `
  }
}
