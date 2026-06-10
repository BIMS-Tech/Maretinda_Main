import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"

import { useTranslation } from "react-i18next"

import { fetchQuery } from "../../../../../lib/client"
import { getStylizedAmount } from "../../../../../lib/money-amount-helpers"
import { getOrderPaymentStatus } from "../../../../../lib/order-helpers"

type OrderPaymentSectionProps = {
  order: HttpTypes.AdminOrder
}

export const getPaymentsFromOrder = (order: HttpTypes.AdminOrder) => {
  return order.payment_collections
    ?.map((collection: HttpTypes.AdminPaymentCollection) => collection.payments)
    .flat(1)
    .filter(Boolean) as HttpTypes.AdminPayment[]
}

export const OrderPaymentSection = ({ order }: OrderPaymentSectionProps) => {
  return (
    <Container className="divide-y divide-dashed p-0">
      <Header order={order} />
      <Actions order={order} />
      <Total order={order} />
    </Container>
  )
}

const Header = ({ order }: { order: any }) => {
  const { t } = useTranslation()
  // COD orders have captured_amount = 0 (or null/undefined) because the seller
  // hasn't physically collected cash yet. Online payments set captured_amount > 0.
  const splitPayment = order?.split_order_payment
  const isCOD = splitPayment != null && Number(splitPayment.captured_amount ?? 0) === 0
  const effectiveStatus = isCOD ? "awaiting" : order.payment_status
  const { label, color } = getOrderPaymentStatus(t, effectiveStatus)

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("orders.payment.title")}</Heading>

      <StatusBadge color={color} className="text-nowrap">
        {label}
      </StatusBadge>
    </div>
  )
}

const Actions = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)

  const payments = getPaymentsFromOrder(order) || []
  const hasCOD = payments.some((p: any) => p?.provider_id === "pp_system_default")

  const splitPayment = (order as any)?.split_order_payment
  const isCaptured = splitPayment
    ? splitPayment.status === "captured"
    : order.payment_status === "captured"

  if (!hasCOD) {
    return null
  }

  return (
    <div className="flex items-center justify-end gap-x-2 px-6 py-4">
      <Button
        size="small"
        variant="secondary"
        disabled={isCaptured || isPending}
        onClick={async () => {
          setIsPending(true)
          try {
            await fetchQuery(`/vendor/orders/${order.id}/capture`, { method: "POST" })
            toast.success((t as any)("orders.payment.captured"))
          } catch (e: any) {
            toast.error(e?.message ?? "Failed to capture payment")
          } finally {
            setIsPending(false)
          }
        }}
      >
        {(t as any)("orders.actions.capturePayment")}
      </Button>
    </div>
  )
}

const Total = ({ order }: { order: any }) => {
  const { t } = useTranslation()
  const authorized = order?.split_order_payment?.authorized_amount ?? order?.total ?? 0
  const captured = order?.split_order_payment?.captured_amount ?? 0
  const currency = order?.split_order_payment?.currency_code ?? order?.currency_code
  const totalPending = Math.max(0, authorized - captured)

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("orders.payment.totalPaidByCustomer")}
        </Text>

        <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(captured, currency)}
        </Text>
      </div>

      {(order?.split_order_payment?.status === "refunded" ||
        order?.split_order_payment?.status === "partially_refunded") && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Refunded
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(order?.split_order_payment?.refunded_amount ?? 0, currency)}
          </Text>
        </div>
      )}

      {order.status !== "canceled" && totalPending > 0 && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Total pending
          </Text>

          <Text size="small" weight="plus" leading="compact">
            {getStylizedAmount(totalPending, currency)}
          </Text>
        </div>
      )}
    </div>
  )
}
