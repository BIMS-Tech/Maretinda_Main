import { Storeseller } from "../types/user"

/**
 * Settlement bank details, normalised across the new `bank_*` columns and the
 * legacy `dft_*` ones. Metrobank accounts settle via TAMA and don't need the
 * SWIFT / address block that DFT transfers require.
 */
export function getSettlementInfo(seller: Storeseller) {
  const bankName = seller.bank_name || seller.dft_bank_name || ""
  const accountNumber = seller.account_number || seller.dft_account_number || ""
  const accountName = seller.account_name || seller.dft_beneficiary_name || ""
  const branchName = seller.branch_name || ""
  const swiftCode = seller.swift_code || seller.dft_swift_code || ""
  const beneficiaryAddress =
    seller.beneficiary_address || seller.dft_beneficiary_address || ""
  const beneficiaryBankAddress =
    seller.beneficiary_bank_address || seller.dft_bank_address || ""

  const isMetrobank = bankName.toLowerCase().includes("metrobank")

  const hasBasicInfo = !!(bankName && accountNumber && accountName && branchName)
  const hasTransferInfo =
    isMetrobank ||
    !!(swiftCode && beneficiaryAddress && beneficiaryBankAddress)

  return {
    bankName,
    accountNumber,
    accountName,
    branchName,
    swiftCode,
    beneficiaryAddress,
    beneficiaryBankAddress,
    isMetrobank,
    isComplete: hasBasicInfo && hasTransferInfo,
    settlementType: isMetrobank
      ? "TAMA (Metrobank)"
      : bankName
        ? "DFT (Non-Metrobank)"
        : "Not Set",
  }
}

export function isSettlementComplete(seller: Storeseller): boolean {
  return getSettlementInfo(seller).isComplete
}
