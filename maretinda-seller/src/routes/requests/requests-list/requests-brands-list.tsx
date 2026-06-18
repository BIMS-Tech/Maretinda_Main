import { useState } from "react"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useMyBrandRequests, useRequestBrand } from "../../../hooks/api/brands"
import { uploadFilesQuery } from "../../../lib/client"

export const RequestsBrandsList = () => {
  const { data, isLoading } = useMyBrandRequests()
  const { mutateAsync: requestBrand, isPending } = useRequestBrand()
  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  const requests = data?.requests ?? []

  const onPickLogo = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const { files } = await uploadFilesQuery([{ file }])
      const url = files?.[0]?.url
      if (url) {
        setLogoUrl(url)
        toast.success("Logo uploaded")
      }
    } catch {
      toast.error("Logo upload failed")
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!name.trim()) return toast.error("Enter a brand name")
    try {
      const r: any = await requestBrand({ name: name.trim(), logo_url: logoUrl || undefined })
      toast.success(r?.message ?? "Brand requested")
      setName("")
      setLogoUrl("")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to request brand")
    }
  }

  return (
    <SingleColumnPage widgets={{ after: [], before: [] }}>
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Brand requests</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Request a brand to use on your products. An admin reviews and approves it.
            </Text>
          </div>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4 max-w-xl">
          <div className="flex flex-col gap-2 rounded-lg border border-ui-border-base p-4 bg-ui-bg-subtle">
            <div className="flex flex-col gap-1">
              <Text size="small" weight="plus">Brand name</Text>
              <Input placeholder="e.g. Nike" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Text size="small" weight="plus">Logo (optional)</Text>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-md border border-ui-border-base bg-ui-bg-base flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-ui-fg-muted text-xs">{(name || "?").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-1.5 text-sm hover:bg-ui-bg-subtle">
                    {uploading ? "Uploading…" : logoUrl ? "Replace image" : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => onPickLogo(e.target.files?.[0])}
                  />
                </label>
                {logoUrl && (
                  <Button size="small" variant="transparent" onClick={() => setLogoUrl("")}>Remove</Button>
                )}
              </div>
            </div>

            <div>
              <Button variant="primary" isLoading={isPending} disabled={uploading} onClick={submit}>
                Request brand
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Text className="text-ui-fg-muted">Loading…</Text>
          ) : requests.length === 0 ? (
            <Text className="text-ui-fg-muted">You haven&apos;t requested any brands yet.</Text>
          ) : (
            <div className="flex flex-col divide-y rounded-lg border border-ui-border-base">
              {requests.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="h-8 w-8 rounded object-contain border border-ui-border-base" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-xs text-ui-fg-muted">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <Text size="small" weight="plus">{b.name}</Text>
                  </div>
                  <Badge color={b.status === "approved" ? "green" : "orange"} size="2xsmall">
                    {b.status === "approved" ? "Approved" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </SingleColumnPage>
  )
}
