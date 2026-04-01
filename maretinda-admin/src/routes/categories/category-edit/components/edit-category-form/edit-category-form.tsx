import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { FileType, FileUpload } from "../../../../../components/common/file-upload"
import { useUpdateProductCategory } from "../../../../../hooks/api/categories"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { sdk } from "../../../../../lib/client"

const EditCategorySchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  visibility: z.enum(["public", "internal"]),
})

type EditCategoryFormProps = {
  category: HttpTypes.AdminProductCategory
}

export const EditCategoryForm = ({ category }: EditCategoryFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()

  const raw = category.metadata?.image_url as string | undefined
  const existingUrl = raw && raw.startsWith("https://") ? raw : ""

  // imagePreview: blob URL while uploading, GCS URL after, or existing URL
  const [imagePreview, setImagePreview] = useState(existingUrl)
  const [uploadedUrl, setUploadedUrl] = useState(existingUrl)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageSelected = async (files: FileType[]) => {
    const file = files[0]
    if (!file) return
    setImagePreview(file.url) // instant preview
    setIsUploading(true)
    try {
      const { files: uploaded } = await sdk.admin.upload.create({
        files: [file.file],
      })
      const gcsUrl = uploaded[0]?.url ?? ""
      console.log("[upload] GCS URL:", gcsUrl)
      setUploadedUrl(gcsUrl)
    } catch {
      toast.error("Image upload failed. Please try again.")
      setImagePreview(existingUrl)
      setUploadedUrl(existingUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const form = useForm<z.infer<typeof EditCategorySchema>>({
    defaultValues: {
      name: category.name,
      handle: category.handle,
      description: category.description || "",
      status: category.is_active ? "active" : "inactive",
      visibility: category.is_internal ? "internal" : "public",
    },
    resolver: zodResolver(EditCategorySchema),
  })

  const { mutateAsync, isPending } = useUpdateProductCategory(category.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isUploading) {
      toast.error("Please wait for the image to finish uploading.")
      return
    }

    await mutateAsync(
      {
        name: data.name,
        description: data.description,
        handle: data.handle,
        is_active: data.status === "active",
        is_internal: data.visibility === "internal",
        metadata: {
          ...(category.metadata ?? {}),
          // Only set image_url if we have a real GCS URL (not blank/blob)
          ...(uploadedUrl && !uploadedUrl.startsWith("blob:")
            ? { image_url: uploadedUrl }
            : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(t("categories.edit.successToast"))
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
                  <Form.Label>{t("fields.title")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="off" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional tooltip={t("collections.handleTooltip")}>
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.description")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="status"
                render={({ field: { ref, onChange, ...field } }) => (
                  <Form.Item>
                    <Form.Label>{t("categories.fields.status.label")}</Form.Label>
                    <Form.Control>
                      <Select dir={direction} {...field} onValueChange={onChange}>
                        <Select.Trigger ref={ref}><Select.Value /></Select.Trigger>
                        <Select.Content>
                          <Select.Item value="active">{t("categories.fields.status.active")}</Select.Item>
                          <Select.Item value="inactive">{t("categories.fields.status.inactive")}</Select.Item>
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="visibility"
                render={({ field: { ref, onChange, ...field } }) => (
                  <Form.Item>
                    <Form.Label>{t("categories.fields.visibility.label")}</Form.Label>
                    <Form.Control>
                      <Select dir={direction} {...field} onValueChange={onChange}>
                        <Select.Trigger ref={ref}><Select.Value /></Select.Trigger>
                        <Select.Content>
                          <Select.Item value="public">{t("categories.fields.visibility.public")}</Select.Item>
                          <Select.Item value="internal">{t("categories.fields.visibility.internal")}</Select.Item>
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            {/* Category Image — uploads immediately on selection */}
            <div className="flex flex-col gap-y-2">
              <Text size="small" weight="plus">Category Image</Text>
              {imagePreview && (
                <div className="relative w-fit">
                  <img
                    alt="Category preview"
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
                label={isUploading ? "Uploading…" : imagePreview ? "Replace image" : "Upload category image"}
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
                  Remove image
                </button>
              )}
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">{t("actions.cancel")}</Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
