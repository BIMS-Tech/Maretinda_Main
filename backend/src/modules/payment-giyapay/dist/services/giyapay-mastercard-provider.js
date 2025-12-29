"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const giyapay_provider_1 = __importDefault(require("./giyapay-provider"));
class GiyaPayMastercardProviderService extends giyapay_provider_1.default {
    async initiatePayment(input) {
        const result = await super.initiatePayment(input);
        // Add Mastercard specific method to the payment data
        if (result.data?.payment_data) {
            result.data.payment_data.method = 'mastercard';
        }
        return result;
    }
}
GiyaPayMastercardProviderService.identifier = "pp_giyapay_mastercard";
exports.default = GiyaPayMastercardProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l5YXBheS1tYXN0ZXJjYXJkLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL2dpeWFwYXktbWFzdGVyY2FyZC1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBFQUF1RDtBQUV2RCxNQUFNLGdDQUFpQyxTQUFRLDBCQUFzQjtJQUduRSxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQVU7UUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWpELHFEQUFxRDtRQUNyRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFvQixDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUE7UUFDekQsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQzs7QUFYTSwyQ0FBVSxHQUFHLHVCQUF1QixDQUFBO0FBYzdDLGtCQUFlLGdDQUFnQyxDQUFBIn0=