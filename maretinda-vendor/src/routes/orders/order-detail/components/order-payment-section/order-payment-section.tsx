import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"

import { useTranslation } from "react-i18next"

import { getStylizedAmount } from "../../../../../lib/money-amount-helpers"
import { getOrderPaymentStatus } from "../../../../../lib/order-helpers"
import { useVendorCapturePayment } from "../../../../../hooks/api/payments"

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
  const { label, color } = getOrderPaymentStatus(t, order.payment_status)

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
  const payments = getPaymentsFromOrder(order) || []
  const codPayment = payments.find((p: any) => p?.provider_id === "pp_system_default")
  const codPaymentId = typeof (codPayment as any)?.id === "string" ? (codPayment as any).id : ""

  const { mutateAsync: vendorCapture, isPending } = useVendorCapturePayment(order.id, codPaymentId)

  if (!codPaymentId) {
    return null
  }

  // Treat COD as awaiting until vendor captures
  const hasCOD = payments.some((p: any) => p?.provider_id === "pp_system_default")
  const paymentStatus = hasCOD ? "awaiting" : order.payment_status
  const disabled = paymentStatus === "captured"

  return (
    <div className="flex items-center justify-end gap-x-2 px-6 py-4">
      <Button
        size="small"
        variant="secondary"
        disabled={disabled || isPending}
        onClick={async () => {
          await vendorCapture(undefined, {
            onSuccess: () => toast.success((t as any)("orders.payment.captured")),
            onError: (e) => toast.error(e.message),
          })
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
