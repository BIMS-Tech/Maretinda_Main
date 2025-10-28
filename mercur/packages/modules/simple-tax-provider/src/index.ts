import { Modules } from "@medusajs/framework/utils";
import { ModuleProvider } from "@medusajs/utils";

import SimpleTaxProvider from "./service";
export { SimpleTaxProvider };

export default ModuleProvider(Modules.TAX, {
  services: [SimpleTaxProvider],
});



