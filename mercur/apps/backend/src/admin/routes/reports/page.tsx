import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"
import { DocumentText } from "@medusajs/icons"
import { ReportsTable } from "./components/reports-table"

const ReportsPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Reports</Heading>
          <p className="text-ui-fg-subtle">
            Generate and download DFT and TAMA files for bank transfers
          </p>
        </div>
      </div>
      <ReportsTable />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Reports",
  icon: DocumentText,
})

export default ReportsPage

