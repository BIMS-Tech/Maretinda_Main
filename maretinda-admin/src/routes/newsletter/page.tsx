import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

type Subscriber = { email: string; source: string; created_at: string }

/** The storefront newsletter list, ready to download for a mailing tool. */
export const NewsletterPage = () => {
  const { data, isLoading } = useQuery<{ subscribers: Subscriber[]; count: number }>({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => (await sdk.client.fetch("/admin/newsletter-subscribers", { method: "GET" })) as any,
  })
  const subscribers = data?.subscribers ?? []

  const download = () => {
    const csv = ["email,signed_up_at", ...subscribers.map((s) => `${s.email},${new Date(s.created_at).toISOString()}`)].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "newsletter-subscribers.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Newsletter</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {data ? `${data.count} people signed up on the storefront` : "People who signed up on the storefront"}
          </Text>
        </div>
        <Button size="small" variant="secondary" disabled={!subscribers.length} onClick={download}>
          Download CSV
        </Button>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Signed up</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row><Table.Cell colSpan={2} className="text-center py-8 text-ui-fg-subtle">Loading…</Table.Cell></Table.Row>
          )}
          {!isLoading && subscribers.length === 0 && (
            <Table.Row><Table.Cell colSpan={2} className="text-center py-8 text-ui-fg-subtle">No sign-ups yet.</Table.Cell></Table.Row>
          )}
          {subscribers.map((s) => (
            <Table.Row key={s.email}>
              <Table.Cell>{s.email}</Table.Cell>
              <Table.Cell>{new Date(s.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}
