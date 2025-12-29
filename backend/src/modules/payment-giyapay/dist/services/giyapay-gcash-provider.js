"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const giyapay_provider_1 = __importDefault(require("./giyapay-provider"));
class GiyaPayGCashProviderService extends giyapay_provider_1.default {
    async initiatePayment(input) {
        const result = await super.initiatePayment(input);
        // Add GCash specific method to the payment data
        if (result.data?.payment_data) {
            result.data.payment_data.method = 'gcash';
        }
        return result;
    }
}
GiyaPayGCashProviderService.identifier = "pp_giyapay_gcash";
exports.default = GiyaPayGCashProviderService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l5YXBheS1nY2FzaC1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9naXlhcGF5LWdjYXNoLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMEVBQXVEO0FBRXZELE1BQU0sMkJBQTRCLFNBQVEsMEJBQXNCO0lBRzlELEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBVTtRQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFakQsZ0RBQWdEO1FBQ2hELElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQW9CLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtRQUNwRCxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDOztBQVhNLHNDQUFVLEdBQUcsa0JBQWtCLENBQUE7QUFjeEMsa0JBQWUsMkJBQTJCLENBQUEifQ==