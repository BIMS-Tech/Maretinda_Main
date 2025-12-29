"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const giyapay_provider_1 = __importDefault(require("./services/giyapay-provider"));
// Only register one provider service that handles all GiyaPay payment methods
exports.default = (0, utils_1.ModuleProvider)(utils_1.Modules.PAYMENT, {
    services: [
        giyapay_provider_1.default
    ]
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxREFBbUU7QUFFbkUsbUZBQWdFO0FBRWhFLDhFQUE4RTtBQUM5RSxrQkFBZSxJQUFBLHNCQUFjLEVBQUMsZUFBTyxDQUFDLE9BQU8sRUFBRTtJQUM3QyxRQUFRLEVBQUU7UUFDUiwwQkFBc0I7S0FDdkI7Q0FDRixDQUFDLENBQUEifQ==