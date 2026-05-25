import { Outlet } from "react-router-dom"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useExtension } from "../../../providers/extension-provider"
import { FlashSaleListTable } from "./components/flash-sale-list-table"

export const FlashSaleList = () => {
  const { getWidgets } = useExtension()

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("flash_sale.list.before"),
        after: getWidgets("flash_sale.list.after"),
      }}
    >
      <FlashSaleListTable />
      <Outlet />
    </SingleColumnPage>
  )
}
