import { useState, useEffect } from "react"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useHeroSettings, useUpdateHeroSettings, type HeroSettings } from "../../hooks/api/site-settings"

const DEFAULTS: HeroSettings = {
  heading: "Shop the Philippines. All in one place.",
  subheading:
    "From fresh palengke produce to fashion-forward finds — discover thousands of trusted local vendors, with fast nationwide delivery and cash on delivery available.",
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

export const StoreFront = () => {
  const { settings, updatedAt, isLoading } = useHeroSettings()
  const { mutateAsync: save, isPending: isSaving } = useUpdateHeroSettings()
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
          <FieldRow label="Vendors count" hint='Shown as "X+ vendors"'>
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
          <FieldRow label="Product image path" hint="Relative path from /public">
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
