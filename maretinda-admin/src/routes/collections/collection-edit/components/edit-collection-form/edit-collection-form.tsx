import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { FileType, FileUpload } from "../../../../../components/common/file-upload"
import { useUpdateCollection } from "../../../../../hooks/api/collections"
import { sdk } from "../../../../../lib/client"

type EditCollectionFormProps = {
  collection: HttpTypes.AdminCollection
}

const EditCollectionSchema = zod.object({
  title: zod.string().min(1),
  handle: zod.string().min(1),
})

export const EditCollectionForm = ({ collection }: EditCollectionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const raw = collection.metadata?.image_url as string | undefined
  const existingUrl = raw && raw.startsWith("https://") ? raw : ""

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

  const form = useForm<zod.infer<typeof EditCollectionSchema>>({
    defaultValues: {
      title: collection.title,
      handle: collection.handle,
    },
    resolver: zodResolver(EditCollectionSchema),
  })

  const { mutateAsync, isPending } = useUpdateCollection(collection.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isUploading) {
      toast.error("Please wait for the image to finish uploading.")
      return
    }
    await mutateAsync(
      {
        ...data,
        metadata: {
          ...(collection.metadata ?? {}),
          ...(uploadedUrl && !uploadedUrl.startsWith("blob:")
            ? { image_url: uploadedUrl }
            : {}),
        },
      },
      {
        onSuccess: () => {
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
              name="title"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.title")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
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
                  <Form.Label tooltip={t("collections.handleTooltip")}>
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r">
                        <Text className="text-ui-fg-muted" size="small" leading="compact" weight="plus">
                          /
                        </Text>
                      </div>
                      <Input {...field} className="pl-10" />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            {/* Collection Image */}
            <div className="flex flex-col gap-y-2">
              <Text size="small" weight="plus">Collection Image</Text>
              {imagePreview && (
                <div className="relative w-fit">
                  <img
                    alt="Collection preview"
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
                label={isUploading ? "Uploading…" : imagePreview ? "Replace image" : "Upload collection image"}
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
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
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
