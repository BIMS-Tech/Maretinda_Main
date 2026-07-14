import { RouteDrawer } from "../../../components/modals"
import { useMe } from "../../../hooks/api"
import { EditVerificationForm } from "./components/edit-verification-form"

export const StoreEditVerification = () => {
  const { seller, isPending: isLoading, isError, error } = useMe()

  if (isError) {
    throw error
  }

  const ready = !!seller && !isLoading
  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title>Business Verification</RouteDrawer.Title>
      </RouteDrawer.Header>
      {ready && <EditVerificationForm seller={seller} />}
    </RouteDrawer>
  )
}
