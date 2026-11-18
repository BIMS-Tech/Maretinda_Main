import { useTranslation } from "react-i18next"

import { StatusCell } from "../../common/status-cell"
import { HttpTypes } from "@medusajs/types"

type ProductStatusCellProps = {
  status: HttpTypes.AdminProductStatus
  /** Published while the shop wasn't open; goes live when it is (backend lib/held-products) */
  held?: boolean
}

export const ProductStatusCell = ({ status, held }: ProductStatusCellProps) => {
  const { t } = useTranslation()

  if (!status) return null
  if (status === "draft" && held) return <StatusCell color="blue">Live when approved</StatusCell>

  const [color, text] = {
    draft: ["grey", t("products.productStatus.draft")],
    proposed: ["orange", t("products.productStatus.proposed")],
    published: ["green", t("products.productStatus.published")],
    rejected: ["red", t("products.productStatus.rejected")],
  }[status] as ["grey" | "orange" | "green" | "red", string]

  return <StatusCell color={color}>{text}</StatusCell>
}

export const ProductStatusHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.status")}</span>
    </div>
  )
}
