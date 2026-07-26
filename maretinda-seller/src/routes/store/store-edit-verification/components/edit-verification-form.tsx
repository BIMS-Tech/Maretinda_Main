import { useRef, useState, ChangeEvent } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Select, Text, Badge, toast } from "@medusajs/ui"
import { CheckCircleSolid, ArrowUpTray, Trash } from "@medusajs/icons"

import { RouteDrawer, useRouteModal } from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import { Form } from "../../../../components/common/form"
import { Storeseller } from "../../../../types/user"
import { useUpdateVerification } from "../../../../hooks/api"
import { backendUrl, publishableApiKey } from "../../../../lib/client/client"
import { ORG_TYPES, requiredDocsFor, isVerificationComplete } from "../../../../lib/business-documents"
import { getVerificationProgress } from "../../../../hooks/api/setup-tasks"
import { CompletionBar } from "../../../../components/common/completion-bar"

const Schema = z.object({
  tax_id: z.string().optional(),
  form_of_organization: z.string().optional(),
})

function DocUpload({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr("")
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch(`${backendUrl}/store/uploads`, {
        method: "POST",
        body: fd,
        headers: { "x-publishable-api-key": publishableApiKey },
      })
      if (!res.ok) throw new Error("Upload failed")
      const json = await res.json()
      const url = json.files?.[0]?.url || json.url
      if (!url) throw new Error("No URL returned")
      onChange(url)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
      <div className="flex items-center justify-between gap-2">
        <Text size="small" weight="plus" className="text-ui-fg-base">
          {label}
        </Text>
        {value && (
          <Badge color="green" size="2xsmall" className="flex items-center gap-1">
            <CheckCircleSolid /> Uploaded
          </Badge>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-xs text-ui-fg-subtle hover:bg-ui-bg-field-hover transition-colors">
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="sr-only" />
          <ArrowUpTray />
          {uploading ? "Uploading…" : value ? "Replace file" : "Choose file"}
        </label>
        {value && (
          <>
            <a href={value} target="_blank" rel="noreferrer" className="text-ui-fg-interactive text-xs underline">
              View
            </a>
            <button
              type="button"
              onClick={() => {
                onChange("")
                if (inputRef.current) inputRef.current.value = ""
              }}
              className="inline-flex items-center gap-1 text-ui-fg-error text-xs"
            >
              <Trash /> Remove
            </button>
          </>
        )}
      </div>
      {err && <p className="text-ui-fg-error text-xs mt-1">{err}</p>}
    </div>
  )
}

export const EditVerificationForm = ({ seller }: { seller: Storeseller }) => {
  const { handleSuccess } = useRouteModal()
  const [docs, setDocs] = useState<Record<string, string>>(seller.business_documents || {})

  const form = useForm<z.infer<typeof Schema>>({
    defaultValues: {
      tax_id: seller.tax_id || "",
      form_of_organization: seller.form_of_organization || "",
    },
    resolver: zodResolver(Schema),
  })

  const org = form.watch("form_of_organization")
  const taxId = form.watch("tax_id")
  const required = requiredDocsFor(org)

  const willComplete = isVerificationComplete({
    tax_id: taxId,
    form_of_organization: org,
    business_documents: docs,
  })

  // Reflects unsaved edits, so the bar advances as each document is attached.
  const progress = getVerificationProgress({
    tax_id: taxId,
    form_of_organization: org,
    business_documents: docs,
  })

  const { mutateAsync, isPending } = useUpdateVerification()

  const setDoc = (key: string, url: string) =>
    setDocs((prev) => {
      const next = { ...prev }
      if (url) next[key] = url
      else delete next[key]
      return next
    })

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        tax_id: values.tax_id,
        form_of_organization: values.form_of_organization,
        business_documents: docs,
      } as Storeseller,
      {
        onSuccess: () => {
          toast.success(
            willComplete
              ? "Submitted for verification review"
              : "Verification details saved"
          )
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
        <RouteDrawer.Body className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-y-6">
            <Text size="small" className="text-ui-fg-subtle">
              Add your business TIN and upload the required documents for your organization type.
              Once complete, your business is submitted for review and earns a Verified badge on your
              storefront after approval.
            </Text>

            <div className="flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Completion
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  {progress.percent}% ({progress.completedCount} of{" "}
                  {progress.totalCount})
                </Text>
              </div>
              <CompletionBar percent={progress.percent} />
            </div>

            <Form.Field
              name="tax_id"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Business TIN</Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="XXX-XXX-XXX-000" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              name="form_of_organization"
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Form of Organization</Form.Label>
                  <Form.Control>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <Select.Trigger>
                        <Select.Value placeholder="Select organization type" />
                      </Select.Trigger>
                      <Select.Content>
                        {ORG_TYPES.map((t) => (
                          <Select.Item key={t} value={t}>
                            {t}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <div>
              <Text size="small" weight="plus" className="text-ui-fg-base mb-1">
                Documents
              </Text>
              {required.length === 0 ? (
                <Text size="small" className="text-ui-fg-muted">
                  Select your form of organization to see the documents you need to upload.
                </Text>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {required.map((doc) => (
                    <DocUpload
                      key={doc.key}
                      label={doc.label}
                      value={docs[doc.key] || ""}
                      onChange={(url) => setDoc(doc.key, url)}
                    />
                  ))}
                  <Text size="xsmall" className="text-ui-fg-muted mt-1">
                    Accepted formats: PDF, JPG, PNG (max 10 MB each).
                  </Text>
                </div>
              )}
            </div>

            {required.length > 0 && (
              <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
                <Text size="small" className={willComplete ? "text-ui-fg-interactive" : "text-ui-fg-subtle"}>
                  {willComplete
                    ? "All required details are complete — saving will submit your business for review."
                    : "Add your TIN and all required documents to submit for verification."}
                </Text>
              </div>
            )}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <RouteDrawer.Close asChild>
            <Button size="small" variant="secondary">
              Cancel
            </Button>
          </RouteDrawer.Close>
          <Button type="submit" size="small" isLoading={isPending}>
            Save
          </Button>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
