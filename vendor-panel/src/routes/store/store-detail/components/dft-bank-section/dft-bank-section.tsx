import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { StoreVendor } from "../../../../../types/user"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { Pencil } from "@medusajs/icons"

export const DftBankSection = ({ seller }: { seller: StoreVendor }) => {
  // Check if DFT information is complete
  const isDftComplete = seller.dft_bank_name && 
                       seller.dft_bank_code && 
                       seller.dft_swift_code && 
                       seller.dft_account_number &&
                       seller.dft_beneficiary_name

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <Heading>DFT Bank Information</Heading>
            <Badge 
              color={isDftComplete ? "green" : "orange"}
              size="2xsmall"
            >
              {isDftComplete ? "Complete" : "Incomplete"}
            </Badge>
          </div>
          <Text size="small" className="text-ui-fg-subtle text-pretty">
            Bank details required for DFT file generation and payouts
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Pencil />,
                  label: "Edit",
                  to: "edit",
                },
              ],
            },
          ]}
        />
      </div>
      
      {/* Bank Details */}
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Bank Name
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_bank_name || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Bank Code
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_bank_code || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          SWIFT Code
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_swift_code || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Bank Address
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_bank_address || "-"}
        </Text>
      </div>
      
      {/* Account Details */}
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Account Number
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_account_number || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Beneficiary Name
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_beneficiary_name || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Beneficiary Code
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_beneficiary_code || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Beneficiary Address
        </Text>
        <Text size="small" leading="compact">
          {seller.dft_beneficiary_address || "-"}
        </Text>
      </div>
    </Container>
  )
}

