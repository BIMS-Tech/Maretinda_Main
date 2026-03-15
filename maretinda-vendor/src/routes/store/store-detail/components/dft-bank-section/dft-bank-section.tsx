import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { StoreVendor } from "../../../../../types/user"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { Pencil } from "@medusajs/icons"

export const DftBankSection = ({ seller }: { seller: StoreVendor }) => {
  // Check if settlement information is complete - these are the minimum required fields
  const bankName = seller.bank_name || seller.dft_bank_name || ""
  const accountNumber = seller.account_number || seller.dft_account_number || ""
  const accountName = seller.account_name || seller.dft_beneficiary_name || ""
  const branchName = seller.branch_name || ""
  const isMetrobank = bankName.toLowerCase().includes('metrobank')
  
  // Required fields for all banks
  const hasBasicInfo = bankName && accountNumber && accountName && branchName
  
  // Additional required fields for non-Metrobank
  const swiftCode = seller.swift_code || seller.dft_swift_code || ""
  const beneficiaryAddress = seller.beneficiary_address || seller.dft_beneficiary_address || ""
  const beneficiaryBankAddress = seller.beneficiary_bank_address || seller.dft_bank_address || ""
  
  const hasNonMetrobankInfo = isMetrobank || (swiftCode && beneficiaryAddress && beneficiaryBankAddress)
  
  const isSettlementComplete = hasBasicInfo && hasNonMetrobankInfo
  
  const settlementType = isMetrobank ? "TAMA (Metrobank)" : bankName ? "DFT (Non-Metrobank)" : "Not Set"

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <Heading>Settlement Bank Information</Heading>
            <Badge 
              color={isSettlementComplete ? "green" : "orange"}
              size="2xsmall"
            >
              {isSettlementComplete ? "Complete" : "Incomplete"}
            </Badge>
            <Badge 
              color={isMetrobank ? "blue" : "purple"}
              size="2xsmall"
            >
              {settlementType}
            </Badge>
          </div>
          <Text size="small" className="text-ui-fg-subtle text-pretty">
            Bank details required for automated settlement and payouts
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
      
      {/* Basic Bank Details (Always Required) */}
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Bank Name
        </Text>
        <Text size="small" leading="compact">
          {bankName || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Account Number
        </Text>
        <Text size="small" leading="compact">
          {accountNumber || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Account Name
        </Text>
        <Text size="small" leading="compact">
          {accountName || "-"}
        </Text>
      </div>
      
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Branch Name
        </Text>
        <Text size="small" leading="compact">
          {branchName || "-"}
        </Text>
      </div>
      
      {/* Conditional Details for Non-Metrobank */}
      {!isMetrobank && bankName && (
        <>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4 bg-orange-50">
        <Text size="small" leading="compact" weight="plus">
              SWIFT Code
        </Text>
        <Text size="small" leading="compact">
              {swiftCode || "-"}
        </Text>
      </div>
      
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4 bg-orange-50">
        <Text size="small" leading="compact" weight="plus">
              Beneficiary Address
        </Text>
        <Text size="small" leading="compact">
              {beneficiaryAddress || "-"}
        </Text>
      </div>
      
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4 bg-orange-50">
        <Text size="small" leading="compact" weight="plus">
              Bank Address
        </Text>
        <Text size="small" leading="compact">
              {beneficiaryBankAddress || "-"}
        </Text>
      </div>
        </>
      )}
      
      {isMetrobank && (
        <div className="px-6 py-4 bg-green-50">
          <Text size="small" className="text-green-800">
            ✓ Metrobank detected: Transactions will be processed via TAMA format
        </Text>
      </div>
      )}
    </Container>
  )
}

