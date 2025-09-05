import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"
import { CurrencyDollar } from "@medusajs/icons"
import { DftGenerationList } from "./components/dft-generation-list"

const DftPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-1">
          <Heading level="h1">DFT File Generation</Heading>
          <p className="text-ui-fg-subtle text-small">
            Generate and manage DFT files for bank transfers and vendor payouts
          </p>
        </div>
      </div>
      <DftGenerationList />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "DFT Files",
  icon: CurrencyDollar,
})

export default DftPage
