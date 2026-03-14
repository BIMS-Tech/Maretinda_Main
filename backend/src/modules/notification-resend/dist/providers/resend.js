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
        if (channel !== "email") {
            throw new Error(`Channel ${channel} is not supported`);
        }
        // Handle different email templates
        let html;
        let subject;
        if (template === "buyerNewOrderEmailTemplate") {
            const templateData = data?.data || {};
            html = (0, templates_1.buyerNewOrderTemplate)(templateData);
            subject = content?.subject || "Your Order is Confirmed!";
        }
        else {
            // Fallback for unknown templates
            console.warn(`[notification-resend] Unknown template: ${template}, using fallback`);
            html = this.fallbackTemplate(data?.data || {});
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
                });
                console.log(`[notification-resend] Email sent successfully: ${result.data?.id}`);
                return { id: result.data?.id || "" };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9yZXNlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBRWtDO0FBRWxDLG1DQUErQjtBQUMvQiw0Q0FBb0Q7QUFPcEQsTUFBYSx1QkFBd0IsU0FBUSwyQ0FBbUM7SUFFOUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUF5QjtRQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQTtRQUNuRSxDQUFDO0lBQ0gsQ0FBQztJQU9ELFlBQ0UsRUFBRSxNQUFNLEVBQW1CLEVBQzNCLE9BQStCO1FBRS9CLEtBQUssRUFBRSxDQUFBO1FBVEQsV0FBTSxHQUFrQixJQUFJLENBQUE7UUFDNUIsZ0JBQVcsR0FBVyxFQUFFLENBQUE7UUFTOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLHNCQUFzQixDQUFBO1FBRXpELElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsbURBQW1ELENBQUMsQ0FBQTtRQUNsRSxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0ZBQWtGLENBQUMsQ0FBQTtRQUNsRyxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLENBQ1IsWUFBMkQ7UUFFM0QsTUFBTSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxZQUFZ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