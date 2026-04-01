import { Heading, Input, Select, Text, Textarea } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import { FileType, FileUpload } from "../../../../../components/common/file-upload"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { CreateCategorySchema } from "./schema"

type CreateCategoryDetailsProps = {
  form: UseFormReturn<CreateCategorySchema>
  imagePreview: string
  isUploading: boolean
  onImageSelected: (files: FileType[]) => void
  onRemoveImage: () => void
}

export const CreateCategoryDetails = ({
  form,
  imagePreview,
  isUploading,
  onImageSelected,
  onRemoveImage,
}: CreateCategoryDetailsProps) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()

  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading>{t("categories.create.header")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("categories.create.hint")}
          </Text>
        </div>

        {/* Category Image */}
        <div className="flex flex-col gap-y-2">
          <Text size="small" weight="plus">
            Category Image
          </Text>
          {imagePreview ? (
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
          ) : null}
          <FileUpload
            label={
              isUploading
                ? "Uploading…"
                : imagePreview
                ? "Replace image"
                : "Upload category image"
            }
            hint="PNG, JPG, WebP — max 10 MB • Uploads instantly to Google Cloud Storage"
            multiple={false}
            formats={["image/jpeg", "image/png", "image/webp", "image/gif"]}
            onUploaded={onImageSelected}
          />
          {imagePreview && !isUploading && (
            <button
              type="button"
              className="text-ui-fg-subtle text-xs underline self-start"
              onClick={onRemoveImage}
            >
              Remove image
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("fields.title")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="off" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label optional tooltip={t("collections.handleTooltip")}>
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        </div>
        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label optional>{t("fields.description")}</Form.Label>
                <Form.Control>
                  <Textarea {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )
          }}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="status"
            render={({ field: { ref, onChange, ...field } }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("categories.fields.status.label")}</Form.Label>
                  <Form.Control>
                    <Select dir={direction} {...field} onValueChange={onChange}>
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="active">
                          {t("categories.fields.status.active")}
                        </Select.Item>
                        <Select.Item value="inactive">
                          {t("categories.fields.status.inactive")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="visibility"
            render={({ field: { ref, onChange, ...field } }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t("categories.fields.visibility.label")}
                  </Form.Label>
                  <Form.Control>
                    <Select dir={direction} {...field} onValueChange={onChange}>
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="public">
                          {t("categories.fields.visibility.public")}
                        </Select.Item>
                        <Select.Item value="internal">
                          {t("categories.fields.visibility.internal")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}
