import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { FileType, FileUpload } from "../../../../../components/common/file-upload"
import { AdminBrand, useUpdateBrand } from "../../../../../hooks/api/admin-brands"
import { sdk } from "../../../../../lib/client"

type BrandEditFormProps = {
  brand: AdminBrand
}

const EditBrandSchema = zod.object({
  name: zod.string().min(1),
  description: zod.string().optional(),
  is_active: zod.boolean(),
})

export const BrandEditForm = ({ brand }: BrandEditFormProps) => {
  const { handleSuccess } = useRouteModal()

  const existingUrl = brand.logo_url ?? ""
  const [imagePreview, setImagePreview] = useState(existingUrl)
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageSelected = async (files: FileType[]) => {
    const file = files[0]
    if (!file) return
    setImagePreview(file.url)
    setIsUploading(true)
    try {
      const { files: uploaded } = await sdk.admin.upload.create({ files: [file.file] })
      setUploadedUrl(uploaded[0]?.url ?? "")
    } catch {
      toast.error("Image upload failed. Please try again.")
      setImagePreview(existingUrl)
      setUploadedUrl(existingUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const form = useForm<zod.infer<typeof EditBrandSchema>>({
    defaultValues: {
      name: brand.name,
      description: brand.description ?? "",
      is_active: brand.is_active,
    },
    resolver: zodResolver(EditBrandSchema),
  })

  const { mutateAsync, isPending } = useUpdateBrand()

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isUploading) {
      toast.error("Please wait for the image to finish uploading.")
      return
    }
    await mutateAsync(
      {
        id: brand.id,
        name: data.name,
        description: data.description || undefined,
        is_active: data.is_active,
        logo_url: uploadedUrl && !uploadedUrl.startsWith("blob:") ? uploadedUrl : null,
      },
      {
        onSuccess: () => {
          toast.success("Brand updated")
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
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
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

            {/* Brand logo */}
            <div className="flex flex-col gap-y-2">
              <Text size="small" weight="plus">Logo</Text>
              {imagePreview && (
                <div className="relative w-fit">
                  <img
                    alt="Brand preview"
                    className="h-32 w-32 rounded-lg object-contain border border-ui-border-base"
                    src={imagePreview}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
              )}
              <FileUpload
                label={isUploading ? "Uploading…" : imagePreview ? "Replace logo" : "Upload brand logo"}
                hint="PNG, JPG, WebP — max 10 MB"
                multiple={false}
                formats={["image/jpeg", "image/png", "image/webp", "image/gif"]}
                onUploaded={handleImageSelected}
              />
              {imagePreview && !isUploading && (
                <button
                  type="button"
                  className="text-ui-fg-subtle text-xs underline self-start"
                  onClick={() => { setImagePreview(""); setUploadedUrl("") }}
                >
                  Remove logo
                </button>
              )}
            </div>

            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>Description</Form.Label>
                  <Form.Control>
                    <Textarea {...field} rows={2} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="is_active"
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Item>
                  <div className="flex items-center gap-x-3">
                    <Form.Control>
                      <Switch checked={value} onCheckedChange={onChange} {...field} />
                    </Form.Control>
                    <Form.Label className="!mt-0">Active (sellers can assign it)</Form.Label>
                  </div>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">Cancel</Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>Save</Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
