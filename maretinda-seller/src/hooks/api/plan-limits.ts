import { useSubscriptionStatus } from "./subscription"

const STAFF_LIMITS: Record<string, number> = {
  Foundation: 1,
  Boost: 5,
  Managed: 15,
}

export const usePlanLimits = () => {
  const { data, isLoading } = useSubscriptionStatus()

  const planName = data?.subscription?.plan_name ?? null
  const features = data?.plan?.features as Record<string, unknown> | null

  const maxProducts =
    typeof features?.max_products === "number" ? features.max_products : -1

  const maxStaff = planName ? (STAFF_LIMITS[planName] ?? -1) : -1

  const analyticsLevel: "basic" | "advanced" | "full" =
    planName === "Foundation"
      ? "basic"
      : planName === "Boost"
      ? "advanced"
      : "full"

  const canExport = planName === "Managed"

  const supportLevel: "email" | "priority" | "dedicated" =
    planName === "Foundation"
      ? "email"
      : planName === "Boost"
      ? "priority"
      : "dedicated"

  const inventoryLevel: "standard" | "smart" | "advanced" =
    planName === "Foundation"
      ? "standard"
      : planName === "Boost"
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
