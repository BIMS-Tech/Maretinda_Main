import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"
import { CurrencyDollar } from "@medusajs/icons"
import { TamaGenerationList } from "./components/tama-generation-list"

const TamaPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">TAMA File Processing</Heading>
          <p className="text-ui-fg-subtle">
            Generate "To Another Metrobank" files for Metrobank merchant settlements
          </p>
        </div>
      </div>
      <TamaGenerationList />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "TAMA Processing",
  icon: CurrencyDollar,
})

export default TamaPage
