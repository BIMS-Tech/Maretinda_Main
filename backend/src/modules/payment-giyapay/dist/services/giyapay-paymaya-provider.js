"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const giyapay_provider_1 = __importDefault(require("./giyapay-provider"));
class GiyaPayPayMayaProviderService extends giyapay_provider_1.default {
    async initiatePayment(input) {
        const result = await super.initiatePayment(input);
        // Add PayMaya specific method to the payment data
        if (result.data?.payment_data) {
            result.data.payment_data.method = 'paymaya';
        }
        return result;
    }
}
GiyaPayPayMayaProviderService.identifier = "pp_giyapay_paymaya";
exports.default = GiyaPayPayMayaProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l5YXBheS1wYXltYXlhLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL2dpeWFwYXktcGF5bWF5YS1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDBFQUF1RDtBQUV2RCxNQUFNLDZCQUE4QixTQUFRLDBCQUFzQjtJQUdoRSxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQVU7UUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWpELGtEQUFrRDtRQUNsRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFvQixDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUE7UUFDdEQsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQzs7QUFYTSx3Q0FBVSxHQUFHLG9CQUFvQixDQUFBO0FBYzFDLGtCQUFlLDZCQUE2QixDQUFBIn0=