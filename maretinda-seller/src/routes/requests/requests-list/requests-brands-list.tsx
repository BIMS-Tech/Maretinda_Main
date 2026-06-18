import { useState } from "react"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useMyBrandRequests, useRequestBrand } from "../../../hooks/api/brands"

export const RequestsBrandsList = () => {
  const { data, isLoading } = useMyBrandRequests()
  const { mutateAsync: requestBrand, isPending } = useRequestBrand()
  const [name, setName] = useState("")

  const requests = data?.requests ?? []

  const submit = async () => {
    if (!name.trim()) return toast.error("Enter a brand name")
    try {
      const r: any = await requestBrand({ name: name.trim() })
      toast.success(r?.message ?? "Brand requested")
      setName("")
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

        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex gap-2 max-w-md">
            <Input placeholder="Brand name (e.g. Nike)" value={name} onChange={(e) => setName(e.target.value)} />
            <Button variant="primary" isLoading={isPending} onClick={submit}>Request</Button>
          </div>

          {isLoading ? (
            <Text className="text-ui-fg-muted">Loading…</Text>
          ) : requests.length === 0 ? (
            <Text className="text-ui-fg-muted">You haven&apos;t requested any brands yet.</Text>
          ) : (
            <div className="flex flex-col divide-y rounded-lg border border-ui-border-base">
              {requests.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <Text size="small" weight="plus">{b.name}</Text>
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
