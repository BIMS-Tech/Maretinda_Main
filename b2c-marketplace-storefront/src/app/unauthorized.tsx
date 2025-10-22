import type { Metadata } from "next"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowUpIcon } from "@/icons"

export const metadata: Metadata = {
  description: "Unauthorized",
  title: "401",
}

export default function Unauthorized() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center py-24">
      <h1 className="text-2xl-semi text-ui-fg-base">Unauthorized</h1>
      <p className="text-small-regular text-ui-fg-base">
        Please login to access this page
      </p>
      <LocalizedClientLink
        className="flex gap-x-1 items-center group"
        href="/login"
      >
        Go to login page
        <ArrowUpIcon
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </LocalizedClientLink>
    </div>
  )
}
