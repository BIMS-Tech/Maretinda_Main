import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Textarea, toast, Select } from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"

import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { StoreVendor } from "../../../../../types/user"
import { useUpdateMe } from "../../../../../hooks/api"
import { MediaSchema } from "../../../../products/product-create/constants"
import {
  FileType,
  FileUpload,
} from "../../../../../components/common/file-upload"
import { useCallback, useState } from "react"
import { uploadFilesQuery } from "../../../../../lib/client"
import { HttpTypes } from "@medusajs/types"
import { useBanks } from "../../../../../hooks/api/banks"

export const EditStoreSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  media: z.array(MediaSchema).optional(),
  // DFT Bank Information
  dft_bank_name: z.string().optional(),
  dft_bank_code: z.string().optional(),
  dft_swift_code: z.string().optional(),
  dft_bank_address: z.string().optional(),
  dft_beneficiary_name: z.string().optional(),
  dft_beneficiary_code: z.string().optional(),
  dft_beneficiary_address: z.string().optional(),
  dft_account_number: z.string().optional(),
})

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
]

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".svg",
]

export const EditStoreForm = ({ seller }: { seller: StoreVendor }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { banks, isLoading: banksLoading } = useBanks()
  const [selectedBankName, setSelectedBankName] = useState(seller?.dft_bank_name || "")
  
  // Debug: Uncomment to see bank data
  // console.log('🏪 EditStoreForm - banks received:', banks.length)

  const form = useForm<z.infer<typeof EditStoreSchema>>({
    defaultValues: {
      name: seller.name,
      description: seller.description,
      phone: seller.phone,
      email: seller.email,
      media: [],
      dft_bank_name: seller.dft_bank_name || "",
      dft_bank_code: seller.dft_bank_code || "",
      dft_swift_code: seller.dft_swift_code || "",
      dft_bank_address: seller.dft_bank_address || "",
      dft_beneficiary_name: seller.dft_beneficiary_name || "",
      dft_beneficiary_code: seller.dft_beneficiary_code || "",
      dft_beneficiary_address: seller.dft_beneficiary_address || "",
      dft_account_number: seller.dft_account_number || "",
    },
    resolver: zodResolver(EditStoreSchema),
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

  const { fields } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  })

  const { mutateAsync, isPending } = useUpdateMe()

  const hasInvalidFiles = useCallback(
    (fileList: FileType[]) => {
      const invalidFile = fileList.find(
        (f) => !SUPPORTED_FORMATS.includes(f.file.type)
      )

      if (invalidFile) {
        form.setError("media", {
          type: "invalid_file",
          message: t("products.media.invalidFileType", {
            name: invalidFile.file.name,
            types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", "),
          }),
        })

        return true
      }

      return false
    },
    [form, t]
  )

  const onUploaded = useCallback(
    (files: FileType[]) => {
      form.clearErrors("media")
      if (hasInvalidFiles(files)) {
        return
      }

      form.setValue("media", [{ ...files[0], isThumbnail: false }])
    },
    [form, hasInvalidFiles]
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    let uploadedMedia: (HttpTypes.AdminFile & {
      isThumbnail: boolean
    })[] = []
    try {
      if (values.media?.length) {
        const fileReqs = []
        fileReqs.push(
          uploadFilesQuery(values.media).then((r: any) =>
            r.files.map((f: any) => ({
              ...f,
              isThumbnail: false,
            }))
          )
        )

        uploadedMedia = (await Promise.all(fileReqs)).flat()
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }

    await mutateAsync(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        description: values.description,
        photo: uploadedMedia[0]?.url || seller.photo || "",
        dft_bank_name: values.dft_bank_name,
        dft_bank_code: values.dft_bank_code,
        dft_swift_code: values.dft_swift_code,
        dft_bank_address: values.dft_bank_address,
        dft_beneficiary_name: values.dft_beneficiary_name,
        dft_beneficiary_code: values.dft_beneficiary_code,
        dft_beneficiary_address: values.dft_beneficiary_address,
        dft_account_number: values.dft_account_number,
      },
      {
        onSuccess: () => {
          toast.success("Store updated")

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <Form.Field
              name="media"
              control={form.control}
              render={() => {
                return (
                  <Form.Item>
                    <div className="flex flex-col gap-y-2">
                      <div className="flex flex-col gap-y-1">
                        <Form.Label optional>Logo</Form.Label>
                      </div>
                      <Form.Control>
                        <FileUpload
                          uploadedImage={fields[0]?.url || ""}
                          multiple={false}
                          label={t("products.media.uploadImagesLabel")}
                          hint={t("products.media.uploadImagesHint")}
                          hasError={!!form.formState.errors.media}
                          formats={SUPPORTED_FORMATS}
                          onUploaded={onUploaded}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </div>
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              name="name"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Name</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name="email"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Email</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name="phone"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name="description"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Description</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            
            {/* DFT Bank Information Section */}
            <div className="border-t border-ui-border-base pt-8">
              <div className="mb-6">
                <h3 className="text-ui-fg-base font-medium">Bank Information for DFT</h3>
                <p className="text-ui-fg-subtle text-sm">
                  Required for generating DFT files for bank transfers and payouts
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Form.Field
                  name="dft_bank_name"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Bank Name</Form.Label>
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
                      <Form.Label>Bank Code</Form.Label>
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
                      <Form.Label>SWIFT Code</Form.Label>
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
                      <Form.Label>Account Number</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Enter account number" />
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
                      <Form.Label>Beneficiary Name</Form.Label>
                      <Form.Control>
                        <Input {...field} placeholder="Enter beneficiary name" />
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
                        <Input {...field} placeholder="Enter beneficiary code" />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
              
              <div className="mt-6">
                <Form.Field
                  name="dft_bank_address"
                  control={form.control}
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Bank Address</Form.Label>
                      <Form.Control>
                        <Textarea {...field} placeholder="Enter bank address" />
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
                      <Form.Label>Beneficiary Address</Form.Label>
                      <Form.Control>
                        <Textarea {...field} placeholder="Enter beneficiary address" />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" isLoading={isPending} type="submit">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
