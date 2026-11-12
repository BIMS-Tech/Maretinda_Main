"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaretindaResendProvider = void 0;
const utils_1 = require("@medusajs/framework/utils");
const resend_1 = require("resend");
const templates_1 = require("../templates");
class MaretindaResendProvider extends utils_1.AbstractNotificationProviderService {
    static validateOptions(options) {
        if (!options.api_key) {
            throw new Error("API key is required in the provider's options.");
        }
    }
    constructor({ logger }, options) {
        super();
        this.resend = null;
        this.fromAddress = "";
        this.logger_ = logger;
        this.options_ = options;
        this.fromAddress = options.from || "orders@maretinda.com";
        if (options.api_key) {
            this.resend = new resend_1.Resend(options.api_key);
            console.log("[notification-resend] Resend provider initialized");
        }
        else {
            console.warn("[notification-resend] Resend API key not configured - emails will be logged only");
        }
    }
    async send(notification) {
        const { to, channel, template, data, content } = notification;
        const attachments = (notification.attachments || []).map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.content_type,
        }));
        if (channel !== "email") {
            throw new Error(`Channel ${channel} is not supported`);
        }
        // Handle different email templates
        let html;
        let subject;
        const templateData = data?.data || {};
        if (template === "buyerNewOrderEmailTemplate") {
            html = (0, templates_1.buyerNewOrderTemplate)(templateData);
            subject = content?.subject || "Your Order is Confirmed!";
        }
        else if (template === "buyerAccountCreatedEmailTemplate") {
            html = (0, templates_1.buyerAccountCreatedTemplate)(templateData);
            subject = content?.subject || `Welcome to ${templateData.store_name || "Maretinda"}!`;
        }
        else if (template === "passwordResetEmailTemplate") {
            html = (0, templates_1.passwordResetTemplate)(templateData);
            subject = content?.subject || "Reset Your Password";
        }
        else if (template === "sellerNewOrderEmailTemplate") {
            html = (0, templates_1.sellerNewOrderTemplate)(templateData);
            subject = content?.subject || `New Order #${templateData?.order?.display_id || ""} Received`;
        }
        else if (template === "messageEmailTemplate") {
            html = (0, templates_1.messageTemplate)(templateData);
            subject = content?.subject || templateData.heading || "A message from Maretinda";
        }
        else {
            console.warn(`[notification-resend] Unknown template: ${template}, using fallback`);
            html = this.fallbackTemplate(templateData);
            subject = content?.subject || "Notification from Maretinda";
        }
        // Log the email content for debugging
        console.log(`[notification-resend] Sending email to ${to}`);
        console.log(`[notification-resend] Subject: ${subject}`);
        console.log(`[notification-resend] Template: ${template}`);
        if (this.resend) {
            try {
                const result = await this.resend.emails.send({
                    from: this.fromAddress,
                    to: [to],
                    subject,
                    html,
                    ...(attachments.length ? { attachments } : {}),
                });
                console.log(`[notification-resend] Raw result: ${JSON.stringify(result)}`);
                if (result.error) {
                    console.error(`[notification-resend] Resend API error: ${JSON.stringify(result.error)}`);
                    throw new Error(result.error.message || "Resend API returned an error");
                }
                const emailId = result.id || result.data?.id || "";
                console.log(`[notification-resend] Email sent successfully: ${emailId}`);
                return { id: emailId };
            }
            catch (error) {
                console.error(`[notification-resend] Failed to send email: ${error.message}`);
                throw error;
            }
        }
        else {
            // Log email content when Resend is not configured
            console.log("=== EMAIL CONTENT (Resend not configured) ===");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html.substring(0, 500)}...`);
            console.log("=== END EMAIL CONTENT ===");
            return { id: "mock-email-id" };
        }
    }
    fallbackTemplate(data) {
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
    `;
    }
}
exports.MaretindaResendProvider = MaretindaResendProvider;
MaretindaResendProvider.identifier = "maretinda-resend";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yZXNlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBRWtDO0FBRWxDLG1DQUErQjtBQUMvQiw0Q0FBaUo7QUFPakosTUFBYSx1QkFBd0IsU0FBUSwyQ0FBbUM7SUFFOUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUF5QjtRQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQTtRQUNuRSxDQUFDO0lBQ0gsQ0FBQztJQU9ELFlBQ0UsRUFBRSxNQUFNLEVBQW1CLEVBQzNCLE9BQStCO1FBRS9CLEtBQUssRUFBRSxDQUFBO1FBVEQsV0FBTSxHQUFrQixJQUFJLENBQUE7UUFDNUIsZ0JBQVcsR0FBVyxFQUFFLENBQUE7UUFTOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLHNCQUFzQixDQUFBO1FBRXpELElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsbURBQW1ELENBQUMsQ0FBQTtRQUNsRSxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0ZBQWtGLENBQUMsQ0FBQTtRQUNsRyxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQ1IsWUFBMkQ7UUFFM0QsTUFBTSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxZQUFZ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