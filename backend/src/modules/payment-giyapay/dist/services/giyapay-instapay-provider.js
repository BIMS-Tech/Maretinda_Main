"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const giyapay_provider_1 = __importDefault(require("./giyapay-provider"));
class GiyaPayInstaPayProviderService extends giyapay_provider_1.default {
    async initiatePayment(input) {
        const result = await super.initiatePayment(input);
        // Add InstaPay specific method to the payment data
        if (result.data?.payment_data) {
            result.data.payment_data.method = 'instapay';
        }
        return result;
    }
}
GiyaPayInstaPayProviderService.identifier = "pp_giyapay_instapay";
exports.default = GiyaPayInstaPayProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l5YXBheS1pbnN0YXBheS1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9naXlhcGF5LWluc3RhcGF5LXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMEVBQXVEO0FBRXZELE1BQU0sOEJBQStCLFNBQVEsMEJBQXNCO0lBR2pFLEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBVTtRQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFakQsbURBQW1EO1FBQ25ELElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQW9CLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQTtRQUN2RCxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDOztBQVhNLHlDQUFVLEdBQUcscUJBQXFCLENBQUE7QUFjM0Msa0JBQWUsOEJBQThCLENBQUEifQ==