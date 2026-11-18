import { Spinner } from "@medusajs/icons"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMe } from "../../../hooks/api/users"
import { isSecondStepError } from "../../../hooks/api/admin-access"
import { SearchProvider } from "../../../providers/search-provider"
import { SidebarProvider } from "../../../providers/sidebar-provider"

export const ProtectedRoute = () => {
  // Don't retry a "second step needed" refusal: send the admin to it straight away
  const { user, isLoading, error } = useMe(undefined, { retry: (count: number, e: unknown) => !isSecondStepError(e) && count < 2 } as any)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Password accepted, second step still to do: authenticator code or setup
    if (isSecondStepError(error)) {
      return <Navigate to="/two-step" state={{ from: location }} replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <SidebarProvider>
      <SearchProvider>
        <Outlet />
      </SearchProvider>
    </SidebarProvider>
  )
}
