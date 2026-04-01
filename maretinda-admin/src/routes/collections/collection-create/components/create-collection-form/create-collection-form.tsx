import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { FileType, FileUpload } from "../../../../../components/common/file-upload"
import { useCreateCollection } from "../../../../../hooks/api/collections"
import { sdk } from "../../../../../lib/client"

const CreateCollectionSchema = zod.object({
  title: zod.string().min(1),
  handle: zod.string().optional(),
})

export const CreateCollectionForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const [imagePreview, setImagePreview] = useState("")
  const [uploadedUrl, setUploadedUrl] = useState("")
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
      setImagePreview("")
      setUploadedUrl("")
    } finally {
      setIsUploading(false)
    }
  }

  const form = useForm<zod.infer<typeof CreateCollectionSchema>>({
    defaultValues: {
      title: "",
      handle: "",
    },
    resolver: zodResolver(CreateCollectionSchema),
  })

  const { mutateAsync, isPending } = useCreateCollection()

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isUploading) {
      toast.error("Please wait for the image to finish uploading.")
      return
    }
    await mutateAsync(
      {
        ...data,
        ...(uploadedUrl ? { metadata: { image_url: uploadedUrl } } : {}),
      },
      {
        onSuccess: ({ collection }) => {
          handleSuccess(`/collections/${collection.id}`)
          toast.success(t("collections.createSuccess"))
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body className="flex size-full flex-col items-center p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <Heading>{t("collections.createCollection")}</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {t("collections.createCollectionHint")}
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="title"
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
            </div>
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
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button size="small" variant="primary" type="submit" isLoading={isPending}>
            {t("actions.create")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
