"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const giyapay_provider_1 = __importDefault(require("./giyapay-provider"));
class GiyaPayVisaProviderService extends giyapay_provider_1.default {
    async initiatePayment(input) {
        const result = await super.initiatePayment(input);
        // Add Visa specific method to the payment data
        if (result.data?.payment_data) {
            result.data.payment_data.method = 'visa';
        }
        return result;
    }
}
GiyaPayVisaProviderService.identifier = "pp_giyapay_visa";
exports.default = GiyaPayVisaProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l5YXBheS12aXNhLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL2dpeWFwYXktdmlzYS1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBFQUF1RDtBQUV2RCxNQUFNLDBCQUEyQixTQUFRLDBCQUFzQjtJQUc3RCxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQVU7UUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWpELCtDQUErQztRQUMvQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFvQixDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFDbkQsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQzs7QUFYTSxxQ0FBVSxHQUFHLGlCQUFpQixDQUFBO0FBY3ZDLGtCQUFlLDBCQUEwQixDQUFBIn0=