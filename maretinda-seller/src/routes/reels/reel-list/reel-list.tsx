import { Outlet } from "react-router-dom"

import { ReelListTable } from "./components/reel-list-table"

export const ReelList = () => {
  return (
    <div className="flex flex-col gap-y-3">
      <ReelListTable />
      <Outlet />
    </div>
  )
}
