import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Container, Heading, Text, Input, toast, Select } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useState, useEffect } from "react"

import { Form } from "../../../components/common/form"
import { useMe, useUpdateBankInfo } from "../../../hooks/api/users"
import { useCreatePayoutAccount, usePayoutAccount } from "../../../hooks/api/payouts"
import { useBanks } from "../../../hooks/api/banks"

const PayoutAccountSchema = z.object({
  // DFT Bank Information (required for payouts)
  dft_bank_name: z.string().min(1, "Bank name is required"),
  dft_bank_code: z.string().min(1, "Bank code is required"),
  dft_swift_code: z.string().min(1, "SWIFT code is required"),
  dft_bank_address: z.string().min(1, "Bank address is required"),
  dft_beneficiary_name: z.string().min(1, "Beneficiary name is required"),
  dft_beneficiary_code: z.string().optional(),
  dft_beneficiary_address: z.string().min(1, "Beneficiary address is required"),
  dft_account_number: z.string().min(1, "Account number is required"),
})

type PayoutAccountFormData = z.infer<typeof PayoutAccountSchema>

export const PayoutAccount = () => {
  const navigate = useNavigate()
  const { seller } = useMe()
  const { payout_account } = usePayoutAccount()
  const { mutateAsync: updateBankInfo, isPending: isUpdatingMe } = useUpdateBankInfo()
  const { mutateAsync: createPayoutAccount, isPending: isCreatingAccount } = useCreatePayoutAccount()
  const { banks, isLoading: banksLoading } = useBanks()
  
  const [selectedBankName, setSelectedBankName] = useState(seller?.dft_bank_name || "")

  const form = useForm<PayoutAccountFormData>({
    resolver: zodResolver(PayoutAccountSchema),
    defaultValues: {
      dft_bank_name: seller?.dft_bank_name || "",
      dft_bank_code: seller?.dft_bank_code || "",
      dft_swift_code: seller?.dft_swift_code || "",
      dft_bank_address: seller?.dft_bank_address || "",
      dft_beneficiary_name: seller?.dft_beneficiary_name || "",
      dft_beneficiary_code: seller?.dft_beneficiary_code || "",
      dft_beneficiary_address: seller?.dft_beneficiary_address || "",
      dft_account_number: seller?.dft_account_number || "",
    },
  })

  // Auto-fill bank details when bank is selected
  const handleBankSelection = (bankName: string) => {
    setSelectedBankName(bankName)
    const selectedBank = banks.find(bank => bank.name === bankName)
    
    if (selectedBank) {
      form.setValue("dft_bank_name", selectedBank.name)
      form.setValue("dft_bank_code", selectedBank.code)
      form.setValue("dft_swift_code", selectedBank.swift_code || "")
      
      // Trigger validation
      form.trigger(["dft_bank_name", "dft_bank_code", "dft_swift_code"])
    }
  }

  const handleSubmit = async (values: PayoutAccountFormData) => {
    try {
      // First, update the seller's DFT information using the new bank-info endpoint
      await updateBankInfo({
        dft_bank_name: values.dft_bank_name,
        dft_bank_code: values.dft_bank_code,
        dft_swift_code: values.dft_swift_code,
        dft_bank_address: values.dft_bank_address,
        dft_beneficiary_name: values.dft_beneficiary_name,
        dft_beneficiary_code: values.dft_beneficiary_code,
        dft_beneficiary_address: values.dft_beneficiary_address,
        dft_account_number: values.dft_account_number,
      })

      // Then create the payout account if it doesn't exist
      if (!payout_account) {
        await createPayoutAccount({
          context: {
            dft_info: values
          }
        })
      }

      toast.success("Payout account information updated successfully")
      navigate("/payouts")
    } catch (error) {
      console.error("Error updating payout account:", error)
      toast.error("Failed to update payout account information")
    }
  }

  const isPending = isUpdatingMe || isCreatingAccount

  // Check if DFT information is complete - only check required fields
  const hasDftInfo = seller?.dft_bank_name && 
                    seller?.dft_swift_code && 
                    seller?.dft_account_number &&
                    seller?.dft_beneficiary_name

  // Debug current seller DFT status
  console.log("🔍 Current seller DFT info:", {
    dft_bank_name: seller?.dft_bank_name,
    dft_bank_code: seller?.dft_bank_code, 
    dft_swift_code: seller?.dft_swift_code,
    dft_account_number: seller?.dft_account_number,
    hasDftInfo
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-1">
          <Heading level="h1">Payout Account Setup</Heading>
          <Text className="text-ui-fg-subtle text-small">
            Configure your bank information for receiving automated daily payouts via DFT (Data File Transfer)
          </Text>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Status indicator */}
        <div className="mb-6 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${hasDftInfo ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <Text weight="plus" size="small">
              {hasDftInfo ? 'DFT Information Complete' : 'DFT Information Required'}
            </Text>
          </div>
          <Text className="text-ui-fg-subtle" size="xsmall">
            {hasDftInfo 
              ? 'Your bank information is complete and ready for payout processing.'
              : 'Please complete your bank information to enable payout requests.'}
          </Text>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-1 flex-col">
            <div className="flex flex-col gap-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Form.Field
                  name="dft_bank_name"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Bank Name *</Form.Label>
                      <Form.Control>
                        <select
                          {...field}
                          value={selectedBankName}
                          onChange={(e) => {
                            const value = e.target.value
                            handleBankSelection(value)
                            field.onChange(value)
                          }}
                          disabled={banksLoading}
                          className="bg-ui-bg-field border-ui-border-base text-ui-fg-base w-full h-8 px-2 py-1.5 rounded-md focus:border-ui-border-interactive focus:outline-none txt-compact-small"
                        >
                          <option value="" disabled>
                            {banksLoading ? "Loading banks..." : "Select a bank"}
                          </option>
                          {banks.map((bank) => (
                            <option key={bank.code} value={bank.name}>
                              {bank.name} - {bank.swift_code} ({bank.category})
                            </option>
                          ))}
                        </select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                
                <Form.Field
                  name="dft_bank_code"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Bank Code *</Form.Label>
                      <Form.Control>
                        <Input 
                          {...field} 
                          placeholder="Auto-filled when bank is selected" 
                          readOnly
                          className="bg-ui-bg-subtle"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="dft_swift_code"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>SWIFT Code *</Form.Label>
                      <Form.Control>
                        <Input 
                          {...field} 
                          placeholder="Auto-filled when bank is selected" 
                          readOnly
                          className="bg-ui-bg-subtle"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="dft_account_number"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Account Number *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Your bank account number" />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="dft_beneficiary_name"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Beneficiary Name *</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Account holder name" />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="dft_beneficiary_code"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Beneficiary Code</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Optional beneficiary code" />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>

              <Form.Field
                name="dft_bank_address"
                control={form.control}
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Bank Address *</Form.Label>
                    <Form.Control>
                      <Input {...field} placeholder="Bank's full address" />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <Form.Field
                name="dft_beneficiary_address"
                control={form.control}
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Beneficiary Address *</Form.Label>
                    <Form.Control>
                      <Input {...field} placeholder="Your address" />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-x-2 pt-8 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/payouts")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
              >
                {payout_account ? 'Update' : 'Setup'} Payout Account
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Container>
  )
}
