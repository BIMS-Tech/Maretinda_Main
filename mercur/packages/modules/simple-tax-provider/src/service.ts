import {
  ITaxProvider,
  TaxTypes,
} from "@medusajs/framework/types";

type Options = {
  taxRate?: number; // Default tax rate as a percentage (e.g., 12 for 12%)
};

/**
 * Simple Tax Provider that applies a fixed tax rate
 * This provider does not depend on any external services
 */
export default class SimpleTaxProvider implements ITaxProvider {
  static identifier = "simple-tax-provider";

  private readonly taxRate_: number;

  constructor(_dependencies: any, options: Options = {}) {
    // Default to 12% tax rate (Philippines VAT) if not specified
    this.taxRate_ = options.taxRate ?? 12;
  }

  getIdentifier(): string {
    return SimpleTaxProvider.identifier;
  }

  async getTaxLines(
    itemLines: TaxTypes.ItemTaxCalculationLine[],
    shippingLines: TaxTypes.ShippingTaxCalculationLine[],
    _context: TaxTypes.TaxCalculationContext
  ): Promise<(TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[]> {
    const taxLines: (TaxTypes.ItemTaxLineDTO | TaxTypes.ShippingTaxLineDTO)[] = [];

    // Calculate tax for item lines
    for (const itemLine of itemLines) {
      taxLines.push({
        line_item_id: itemLine.line_item.id,
        rate: this.taxRate_,
        code: "VAT",
        name: `VAT ${this.taxRate_}%`,
        provider_id: this.getIdentifier(),
      });
    }

    // Calculate tax for shipping lines
    for (const shippingLine of shippingLines) {
      taxLines.push({
        shipping_line_id: shippingLine.shipping_line.id,
        rate: this.taxRate_,
        code: "VAT",
        name: `VAT ${this.taxRate_}%`,
        provider_id: this.getIdentifier(),
      });
    }

    return taxLines;
  }
}

