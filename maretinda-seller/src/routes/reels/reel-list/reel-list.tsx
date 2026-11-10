import { Outlet } from "react-router-dom"

import { SetupGate } from "../../../components/common/setup-gate"
import { ReelListTable } from "./components/reel-list-table"

export const ReelList = () => {
  return (
    <div className="flex flex-col gap-y-3">
      <SetupGate feature="post reels">
        <ReelListTable />
        <Outlet />
      </SetupGate>
    </div>
  )
}
