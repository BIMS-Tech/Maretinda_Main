import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge } from "@medusajs/ui"
import { CurrencyDollar } from "@medusajs/icons"
import { DftGenerationList } from "./components/dft-generation-list"

const DftPage = () => {
  const today = new Date().toLocaleDateString('en-PH', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Heading level="h1">Daily DFT Processing</Heading>
            <Badge color="blue">{today}</Badge>
          </div>
          <p className="text-ui-fg-subtle text-small">
            Generate daily DFT files for vendor payouts. T+1 processing: cleared transactions from yesterday are available for payout today.
          </p>
          <div className="flex gap-4 mt-2">
            <div className="text-xs text-ui-fg-subtle">
              <span className="font-medium">Settlement Schedule:</span> T+1 Processing, T+2 Crediting
            </div>
            <div className="text-xs text-ui-fg-subtle">
              <span className="font-medium">Banking Days:</span> Monday - Friday (No weekends)
            </div>
          </div>
        </div>
      </div>
      <DftGenerationList />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Daily DFT Processing",
  icon: CurrencyDollar,
})

export default DftPage
