import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
  Badge,
} from "@medusajs/ui"
import { useHeroSettings, useUpdateHeroSettings, useTrendingProducts, type HeroSettings, type TrendingProduct } from "../../hooks/api/site-settings"

const DEFAULTS: HeroSettings = {
  heading: "Shop the Philippines. All in one place.",
  subheading:
    "From fresh palengke produce to fashion-forward finds — discover thousands of trusted local sellers, with fast nationwide delivery and cash on delivery available.",
  badge: "New season · Pampanga local",
  featured_product_name: "Filipiniana Sundress",
  featured_product_category: "Fashion · Summer Drop",
  featured_product_price: 89900,
  featured_product_original_price: 129900,
  featured_product_rating_count: 248,
  featured_product_sold_this_week: 247,
  featured_product_link: "/categories",
  featured_product_image: "/images/featured-products/fashion.png",
  vendors_count: "12,800+",
  welcome_promo_code: "",
  featured_campaign_id: "",
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-ui-border-base last:border-0">
      <div>
        <Label className="text-sm font-medium text-ui-fg-base">{label}</Label>
        {hint && <Text size="small" className="text-ui-fg-muted mt-0.5">{hint}</Text>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ProductPickerCard({
  product,
  isSelected,
  onSelect,
}: {
  product: TrendingProduct
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
        isSelected
          ? "border-[#432C63] bg-[#F5F0FF] shadow-sm"
          : "border-ui-border-base bg-ui-bg-base hover:border-ui-border-strong"
      }`}
    >
      {isSelected && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#432C63]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
      )}

      {/* Thumbnail */}
      <div className="mb-2 h-24 w-full overflow-hidden rounded-lg bg-ui-bg-subtle flex items-center justify-center">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ui-fg-muted">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>

      <p className="text-xs font-semibold text-ui-fg-base line-clamp-2 leading-tight">{product.title}</p>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ui-fg-muted">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFC533"><path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" /></svg>
          {product.avg_rating > 0 ? product.avg_rating.toFixed(1) : "—"}
        </span>
        <span className="text-[11px] text-ui-fg-subtle">
          {product.trending_score > 0 ? `${product.trending_score} sold/wk` : "No sales yet"}
        </span>
      </div>
    </button>
  )
}

export const StoreFront = () => {
  const { settings, updatedAt, isLoading } = useHeroSettings()
  const { mutateAsync: save, isPending: isSaving } = useUpdateHeroSettings()
  const { data: trendingProducts, isLoading: isLoadingProducts } = useTrendingProducts()
  const [form, setForm] = useState<HeroSettings>(DEFAULTS)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({ ...DEFAULTS, ...settings })
      setIsDirty(false)
    }
  }, [settings])

  const set = (key: keyof HeroSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    try {
      await save(form)
      toast.success("Home page settings saved successfully.")
      setIsDirty(false)
    } catch {
      toast.error("Failed to save settings. Please try again.")
    }
  }

  const handleReset = () => {
    if (settings) setForm({ ...DEFAULTS, ...settings })
    else setForm(DEFAULTS)
    setIsDirty(false)
  }

  const applyTrendingProduct = (product: TrendingProduct) => {
    setForm((prev) => ({
      ...prev,
      featured_product_name: product.title,
      featured_product_link: `/products/${product.handle}`,
      featured_product_image: product.thumbnail || prev.featured_product_image,
      featured_product_rating_count: product.review_count || prev.featured_product_rating_count,
      featured_product_sold_this_week: product.trending_score || prev.featured_product_sold_this_week,
    }))
    setIsDirty(true)
    toast.success(`"${product.title}" applied to hero. Adjust price and category below, then save.`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Text className="text-ui-fg-muted">Loading…</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold text-ui-fg-base">
            Store Front
          </Heading>
          <Text className="text-ui-fg-muted mt-1">
            Control what appears on the home page hero section.
          </Text>
          {updatedAt && (
            <Text size="small" className="text-ui-fg-muted mt-0.5">
              Last saved: {new Date(updatedAt).toLocaleString()}
            </Text>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
              Discard
            </Button>
          )}
          <Button onClick={handleSave} isLoading={isSaving} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </div>

      {/* Most-Sold Product Picker */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="text-base font-semibold">Most Sold Products</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Click a product to auto-fill the hero featured product fields. Adjust price and category below, then save.
          </Text>
        </div>
        <div className="px-6 py-4">
          {isLoadingProducts ? (
            <Text size="small" className="text-ui-fg-muted">Loading products…</Text>
          ) : !trendingProducts?.length ? (
            <Text size="small" className="text-ui-fg-muted">
              No product sales data yet. The trending score job runs hourly and updates once orders are placed.
            </Text>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {trendingProducts.map((product) => (
                <ProductPickerCard
                  key={product.id}
                  product={product}
                  isSelected={form.featured_product_name === product.title}
                  onSelect={() => applyTrendingProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Hero Main Card */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="text-base font-semibold">Hero — Main Card</Heading>
          <Text size="small" className="text-ui-fg-muted">The large left card with the heading and featured product.</Text>
        </div>
        <div className="px-6 py-2">
          <FieldRow label="Heading" hint="Shown as large serif text">
            <Input
              value={form.heading}
              onChange={(e) => set("heading", e.target.value)}
              placeholder={DEFAULTS.heading}
            />
          </FieldRow>
          <FieldRow label="Subheading" hint="Paragraph below the heading (desktop only)">
            <Textarea
              value={form.subheading}
              onChange={(e) => set("subheading", e.target.value)}
              rows={3}
              placeholder={DEFAULTS.subheading}
            />
          </FieldRow>
          <FieldRow label="Badge text" hint="Small label above the heading">
            <Input
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              placeholder={DEFAULTS.badge}
            />
          </FieldRow>
          <FieldRow label="Sellers count" hint='Shown as "X+ sellers" in the hero'>
            <Input
              value={form.vendors_count}
              onChange={(e) => set("vendors_count", e.target.value)}
              placeholder={DEFAULTS.vendors_count}
            />
          </FieldRow>
        </div>
      </Container>

      {/* Featured Product */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="text-base font-semibold">Hero — Featured Product</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Product card shown on the right side of the hero (desktop). Prices are in centavos (₱100 = 10000).
            Use the picker above to auto-fill from real product data.
          </Text>
        </div>
        <div className="px-6 py-2">
          <FieldRow label="Product name">
            <Input
              value={form.featured_product_name}
              onChange={(e) => set("featured_product_name", e.target.value)}
              placeholder={DEFAULTS.featured_product_name}
            />
          </FieldRow>
          <FieldRow label="Category label" hint='e.g. "Fashion · Summer Drop"'>
            <Input
              value={form.featured_product_category}
              onChange={(e) => set("featured_product_category", e.target.value)}
              placeholder={DEFAULTS.featured_product_category}
            />
          </FieldRow>
          <FieldRow label="Price (centavos)" hint="₱899 = 89900">
            <Input
              type="number"
              value={form.featured_product_price}
              onChange={(e) => set("featured_product_price", Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label="Original price (centavos)" hint="Used to compute the discount badge">
            <Input
              type="number"
              value={form.featured_product_original_price}
              onChange={(e) => set("featured_product_original_price", Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label="Rating count" hint="Number shown next to the stars">
            <Input
              type="number"
              value={form.featured_product_rating_count}
              onChange={(e) => set("featured_product_rating_count", Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label="Sold this week" hint="Shown in the 'X sold this week' chip">
            <Input
              type="number"
              value={form.featured_product_sold_this_week}
              onChange={(e) => set("featured_product_sold_this_week", Number(e.target.value))}
            />
          </FieldRow>
          <FieldRow label="Product link" hint="Where the → arrow navigates">
            <Input
              value={form.featured_product_link}
              onChange={(e) => set("featured_product_link", e.target.value)}
              placeholder={DEFAULTS.featured_product_link}
            />
          </FieldRow>
          <FieldRow label="Product image URL" hint="Full URL or path from /public (auto-filled from product picker above)">
            <Input
              value={form.featured_product_image}
              onChange={(e) => set("featured_product_image", e.target.value)}
              placeholder={DEFAULTS.featured_product_image}
            />
          </FieldRow>
        </div>
      </Container>

      {/* Sidebar Promo Cards */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2" className="text-base font-semibold">Sidebar Promo Cards</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Pin a specific promotion or campaign to the sidebar cards. Leave blank to auto-show the first active one.
          </Text>
        </div>
        <div className="px-6 py-2">
          <FieldRow
            label="Welcome offer code"
            hint='Yellow card — enter a promotion code (e.g. HELLOMRTD). Leave blank to auto-pick the first active promo.'
          >
            <Input
              value={form.welcome_promo_code}
              onChange={(e) => set("welcome_promo_code", e.target.value)}
              placeholder="e.g. HELLOMRTD"
            />
          </FieldRow>
          <FieldRow
            label="Featured campaign ID"
            hint='Dark card — paste a Campaign ID from Promotions → Campaigns. Leave blank to auto-pick the first active campaign.'
          >
            <Input
              value={form.featured_campaign_id}
              onChange={(e) => set("featured_campaign_id", e.target.value)}
              placeholder="procamp_xxxxxxxxxxxx"
            />
          </FieldRow>
        </div>
      </Container>
    </div>
  )
}
