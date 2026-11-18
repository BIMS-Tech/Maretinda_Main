import { CheckCircle, EyeSlash, PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDashboardExtension } from "../../../../../extensions"
import { useDeleteProduct, useUpdateProductStatus } from "../../../../../hooks/api/products"

const productStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "grey"
    case "proposed":
      return "orange"
    case "published":
      return "green"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

type ProductGeneralSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductGeneralSection = ({
  product,
}: ProductGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { getDisplays } = useDashboardExtension()

  const displays = getDisplays("product", "general")

  const { mutateAsync } = useDeleteProduct(product.id)
  const { mutateAsync: setStatus } = useUpdateProductStatus(product.id)
  const held = product.status === "draft" && (product.metadata as any)?.publish_when_ready === true

  const changeStatus = async (status: "draft" | "published") => {
    try {
      const result = await setStatus(status)
      if (result?.held) toast.info(result.message ?? "Saved. It goes live once your shop is approved.", { duration: 10000 })
      else toast.success(status === "published" ? `${product.title} is live on Maretinda.` : `${product.title} is hidden from buyers.`)
    } catch (e: any) {
      toast.error(e?.message || "Could not change the product's status")
    }
  }

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("..")
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{product.title}</Heading>
        <div className="flex items-center gap-x-4">
          {product.status === "draft" && (product.metadata as any)?.publish_when_ready === true ? (
            // Published while the shop wasn't open; goes live by itself once it is
            <StatusBadge color="blue">Live when your shop is approved</StatusBadge>
          ) : (
            <StatusBadge color={productStatusColor(product.status)}>
              {t(`products.productStatus.${product.status}`)}
            </StatusBadge>
          )}
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: "edit",
                    icon: <PencilSquare />,
                  },
                  // Before this there was no way to publish a draft or take a product off sale
                  ...(product.status === "published"
                    ? [{ label: "Unpublish (hide from buyers)", onClick: () => changeStatus("draft"), icon: <EyeSlash /> }]
                    : !held && product.status !== "proposed"
                      ? [{ label: "Publish", onClick: () => changeStatus("published"), icon: <CheckCircle /> }]
                      : []),
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    icon: <Trash />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      <SectionRow title={t("fields.description")} value={product.description} />
      {/* <SectionRow title={t("fields.subtitle")} value={product.subtitle} /> */}
      <SectionRow title={t("fields.handle")} value={`/${product.handle}`} />
      <SectionRow
        title={t("fields.discountable")}
        value={product.discountable ? t("fields.true") : t("fields.false")}
      />
      {displays.map((Component, index) => {
        return <Component key={index} data={product} />
      })}
    </Container>
  )
}
