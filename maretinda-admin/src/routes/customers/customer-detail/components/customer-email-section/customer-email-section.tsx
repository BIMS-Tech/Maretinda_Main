import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui"

import {
  useConfirmCustomerEmail,
  useCustomerEmailVerification,
} from "../../../../../hooks/api/customer-email-verification"

const HOW: Record<string, string> = {
  link: "with the link we emailed",
  google: "by signing in with Google",
  existing: "account made before email confirmation started",
  admin: "by the Maretinda team",
}

/**
 * Whether the buyer has confirmed their email. Buyers can't pay or place an
 * order until they have; support can confirm it for them when the link never
 * arrives and they've shown they own the address.
 */
export const CustomerEmailSection = ({ customer }: { customer: HttpTypes.AdminCustomer }) => {
  const prompt = usePrompt()
  const { data, isPending } = useCustomerEmailVerification(customer.id)
  const confirm = useConfirmCustomerEmail(customer.id)

  // Guest checkouts have no account and nothing to confirm
  if (!customer.has_account) return null

  const markConfirmed = async () => {
    const ok = await prompt({
      title: "Mark this email as confirmed?",
      description: `Only do this if ${customer.email} has shown you they own this address, for example by replying from it. They will then be able to place orders.`,
      confirmText: "Mark as confirmed",
      cancelText: "Cancel",
    })
    if (!ok) return
    try {
      await confirm.mutateAsync()
      toast.success(`${customer.email} is confirmed.`)
    } catch (e: any) {
      toast.error(e?.message || "Could not confirm the email")
    }
  }

  return (
    <Container className="divide-y p-0" data-testid="customer-email-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Email confirmation</Heading>
        {!isPending && data && (
          <StatusBadge color={data.verified ? "green" : "orange"}>{data.verified ? "Confirmed" : "Not confirmed"}</StatusBadge>
        )}
      </div>
      <div className="flex flex-col gap-3 px-6 py-4">
        {isPending || !data ? (
          <Text size="small" className="text-ui-fg-subtle">Checking…</Text>
        ) : data.verified ? (
          <Text size="small" className="text-ui-fg-subtle">
            Confirmed {data.method ? HOW[data.method] ?? "" : ""}
            {data.verified_at ? ` on ${new Date(data.verified_at).toLocaleDateString()}` : ""}.
          </Text>
        ) : (
          <>
            <Text size="small" className="text-ui-fg-subtle">
              This buyer hasn't opened the confirmation link yet, so they can't pay or place an order. They can ask for a
              new link at checkout.
            </Text>
            <div>
              <Button size="small" variant="secondary" isLoading={confirm.isPending} onClick={markConfirmed}>
                Mark as confirmed
              </Button>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}
