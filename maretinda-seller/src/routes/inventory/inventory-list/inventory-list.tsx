import { Link } from "react-router-dom"

import { HowTo } from "../../../components/common/how-to"
import { StockEditor } from "../../../components/common/stock-editor"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useDashboardExtension } from "../../../extensions"
import { InventoryListTable } from "./components/inventory-list-table"
import { InventorySmartPanel } from "./components/inventory-smart-panel"

export const InventoryItemListTable = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("inventory_item.list.after"),
        before: getWidgets("inventory_item.list.before"),
      }}
    >
      <HowTo
        id="stock"
        title="How to add and update stock"
        steps={[
          <>
            <b>First time?</b> Set your pickup place under{" "}
            <Link to="/shipping?tab=setup" className="text-ui-fg-interactive hover:underline">
              Shipping → Set up delivery
            </Link>
            . Your stock is kept there.
          </>,
          <>
            Type how many you have of each item under <b>On hand</b> and press <b>Save</b>. Count what is on your shelf, including
            items already sold but not yet shipped.
          </>,
          <>
            <b>Restocked?</b> Enter the new total, not the number you added. If you had 4 and bought 10 more, enter 14.
          </>,
          <>
            <b>Sold some outside Maretinda?</b> Lower the number straight away so buyers can't order what you don't have.
          </>,
          <>
            Use the <b>Running low</b> and <b>Out of stock</b> filters to see what to restock. On Growth and Premium we also email you
            when an item drops to 5 left and again when it runs out.
          </>,
        ]}
        note="“Sold, to ship” is taken off automatically when you ship an order, so you don't lower stock for Maretinda orders yourself."
      />
      <StockEditor />
      <InventorySmartPanel />
      <InventoryListTable />
    </SingleColumnPage>
  )
}
