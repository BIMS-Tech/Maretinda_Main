import { Spinner } from "@medusajs/icons"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMe } from "../../../hooks/api/users"
import {
  isSubscriptionActive,
  isSubscriptionRoute,
  useSubscriptionStatus,
} from "../../../hooks/api/subscription"
import { SearchProvider } from "../../../providers/search-provider"
import { SidebarProvider } from "../../../providers/sidebar-provider"
import { TalkjsProvider } from "../../../providers/talkjs-provider"

export const ProtectedRoute = () => {
  const { seller, isPending, error } = useMe()
  const isSuspended = seller?.store_status === "SUSPENDED"

  /**
   * Fetched here rather than in the layouts so it resolves in parallel with
   * `useMe` — otherwise the dashboard renders every nav item for a frame and
   * then collapses once the subscription check comes back.
   */
  const { data: subscription, isPending: isSubscriptionPending } =
    useSubscriptionStatus()

  const location = useLocation()

  const loadingScreen = (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="text-ui-fg-interactive animate-spin" />
    </div>
  )

  if (isPending) {
    return loadingScreen
  }

  if (!seller) {
    // Handle authentication errors gracefully
    if (error) {
      console.warn("Authentication error in protected route:", error)
      // Clear any invalid tokens
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("medusa_auth_token")
      }
    }
    
    // Only surface auth errors (4xx), not network/fetch errors
    const isAuthError = error && (error as any).status >= 400 && (error as any).status < 500
    return (
      <Navigate
        to={`/login${isAuthError ? `?reason=${error!.message}` : ""}`}
        state={{ from: location }}
        replace
      />
    )
  }

  /**
   * Checked after the auth redirect so a logged-out seller isn't held behind a
   * subscription request that is only going to 401.
   */
  if (isSubscriptionPending) {
    return loadingScreen
  }

  /**
   * Nothing in the panel — settings and profile included — is reachable until a
   * plan is active. `/subscription` itself stays open so they can pay.
   */
  if (
    !isSubscriptionActive(subscription) &&
    !isSubscriptionRoute(location.pathname)
  ) {
    return <Navigate to="/subscription" replace />
  }

  return (
    <TalkjsProvider>
      <SidebarProvider>
        <SearchProvider>
          {isSuspended && (
            <div className="w-full bg-red-600 text-white p-1 text-center text-sm">
              Your store is <b>suspended</b>. Please contact support.
            </div>
          )}
          <Outlet />
        </SearchProvider>
      </SidebarProvider>
    </TalkjsProvider>
  )
}
