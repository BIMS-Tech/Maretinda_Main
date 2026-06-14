import { useSubscriptionStatus } from "./subscription"

const STAFF_LIMITS: Record<string, number> = {
  Starter: 1,
  Growth: 5,
  Premium: 15,
}

export const usePlanLimits = () => {
  const { data, isLoading } = useSubscriptionStatus()

  const planName = data?.subscription?.plan_name ?? null
  const features = data?.plan?.features as Record<string, unknown> | null

  const maxProducts =
    typeof features?.max_products === "number" ? features.max_products : -1

  const maxStaff = planName ? (STAFF_LIMITS[planName] ?? -1) : -1

  const analyticsLevel: "basic" | "advanced" | "full" =
    planName === "Starter"
      ? "basic"
      : planName === "Growth"
      ? "advanced"
      : "full"

  const canExport = planName === "Premium"

  const supportLevel: "email" | "priority" | "dedicated" =
    planName === "Starter"
      ? "email"
      : planName === "Growth"
      ? "priority"
      : "dedicated"

  const inventoryLevel: "standard" | "smart" | "advanced" =
    planName === "Starter"
      ? "standard"
      : planName === "Growth"
      ? "smart"
      : "advanced"

  return {
    isLoading,
    planName,
    maxProducts,
    maxStaff,
    analyticsLevel,
    canExport,
    supportLevel,
    inventoryLevel,
  }
}
