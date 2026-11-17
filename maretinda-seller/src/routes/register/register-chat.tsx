import { useState, useRef, useEffect, ReactNode } from "react"
import { Link } from "react-router-dom"
import { backendUrl, publishableApiKey, sdk } from "../../lib/client/client"
import { MEDUSA_STOREFRONT_URL } from "../../lib/storefront"
import phLocations from "../../lib/ph-locations.json"
import { Accent, AuthShell, Butterfly, GlassCard, PRIMARY_BUTTON } from "../../components/auth/auth-shell"
import { submitSellerApplication } from "./submit-application"
import { CAPTCHA_SITE_KEY, CaptchaWidget } from "../../components/common/captcha-widget/captcha-widget"

// ---------------------------------------------------------------------------
// The assistant's persona
// ---------------------------------------------------------------------------

const BOT_NAME = "Tala"
const BRAND = "#432C63"

// ---------------------------------------------------------------------------
// Constants. The backend checks the same rules (backend/src/lib/seller-application.ts).
// ---------------------------------------------------------------------------

const ORG_TYPES: { value: string; label: string }[] = [
  { value: "Sole Proprietorship", label: "Sole proprietor (DTI)" },
  { value: "Corporation", label: "Corporation or OPC (SEC)" },
  { value: "Partnership", label: "Partnership (SEC)" },
  { value: "Cooperative", label: "Cooperative (CDA)" },
  { value: "Association", label: "Association" },
  { value: "Government", label: "Government office" },
  { value: "Transportation", label: "Transport business" },
  { value: "Others", label: "Other" },
]

const NEEDS_SIGNATORY = ["Corporation", "Partnership", "Cooperative", "Association", "Government"]

const REGISTRY: Record<string, string> = {
  "Sole Proprietorship": "your DTI certificate",
  Corporation: "your SEC registration",
  Partnership: "your SEC registration",
  Cooperative: "your CDA registration",
}

const PRODUCT_COUNTS = ["1–10", "11–50", "51–200", "More than 200"]
const PRODUCT_SOURCES = [
  "I make them myself",
  "My own brand",
  "Authorized reseller or distributor of other brands",
  "Unbranded or general merchandise",
]
/** Used when the live category list can't be loaded. */
const FALLBACK_CATEGORIES = ["Fashion", "Food & Beverages", "Health & Beauty", "Home & Living", "Electronics", "Toys & Hobbies"]

const CITIES: Record<string, string[]> = phLocations as Record<string, string[]>
const PROVINCES = Object.keys(CITIES).sort((a, b) => a.localeCompare(b))

const isPhMobile = (v: string) => {
  const d = v.replace(/\D/g, "")
  const local = d.startsWith("63") ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d
  return /^9\d{9}$/.test(local)
}
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isTin = (v: string) => [9, 12, 14].includes(v.replace(/\D/g, "").length)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  first_name: string; last_name: string; mobile_number: string; email: string
  form_of_organization: string; business_name: string; shop_name: string; designation: string
  signatory_first_name: string; signatory_middle_name: string; signatory_last_name: string
  signatory_email: string; signatory_mobile: string
  business_tin: string; vat_registered: boolean | null
  business_province: string; business_city: string; business_barangay: string
  business_street: string; business_postal_code: string
  main_category: string; product_count: string; product_source: string
  sells_regulated: boolean | null; store_links: string
  promo_code: string
  password: string; confirm_password: string
  terms_accepted: boolean; privacy_consent: boolean
}

const INITIAL: FormData = {
  first_name: "", last_name: "", mobile_number: "", email: "",
  form_of_organization: "", business_name: "", shop_name: "", designation: "",
  signatory_first_name: "", signatory_middle_name: "", signatory_last_name: "",
  signatory_email: "", signatory_mobile: "",
  business_tin: "", vat_registered: null,
  business_province: "", business_city: "", business_barangay: "",
  business_street: "", business_postal_code: "",
  main_category: "", product_count: "", product_source: "",
  sells_regulated: null, store_links: "",
  promo_code: "",
  password: "", confirm_password: "",
  terms_accepted: false, privacy_consent: false,
}

type Setter = <K extends keyof FormData>(k: K, v: FormData[K]) => void

// ---------------------------------------------------------------------------
// Conversation script — each entry maps to one or more FormData fields
// ---------------------------------------------------------------------------

type QType =
  | "names" | "text" | "email" | "tel" | "tin"
  | "org" | "signatory-names" | "contact" | "choice" | "address"
  | "password" | "promo"

type Choice = { label: string; value: string | boolean }

interface Question {
  id: string
  type: QType
  when?: (d: FormData) => boolean
  ask: string | ((d: FormData) => string)
  hint?: string | ((d: FormData) => string)
  optional?: boolean
  key?: keyof FormData
  placeholder?: string
  fields?: { key: keyof FormData; label: string; type?: string; placeholder?: string }[]
  /** For "choice": the options; "categories" means the shop's live category list. */
  choices?: Choice[] | "categories"
}

const yesNo = (yes: string, no: string): Choice[] => [{ label: yes, value: true }, { label: no, value: false }]

const QUESTIONS: Question[] = [
  {
    id: "names", type: "names",
    ask: "Let's start with you. What's your name?",
    hint: "As it appears on your government ID.",
  },
  {
    id: "mobile_number", type: "tel", key: "mobile_number",
    ask: d => `Nice to meet you, ${d.first_name || "there"}. What's your mobile number?`,
    hint: "We call or text this number only about your application and urgent order issues.",
    placeholder: "0917 123 4567",
  },
  {
    id: "email", type: "email", key: "email",
    ask: "And your email address? You'll use it to sign in to your seller account.",
    placeholder: "juan@example.com",
  },
  {
    id: "form_of_organization", type: "org",
    ask: "Now your business. How is it registered?",
    hint: "This decides which documents you'll upload after approval.",
  },
  {
    id: "business_name", type: "text", key: "business_name",
    ask: d => `What's the registered business name, exactly as on ${REGISTRY[d.form_of_organization] || "your business registration"}?`,
    placeholder: "e.g. Juan's Handicrafts",
  },
  {
    id: "shop_name", type: "text", key: "shop_name",
    ask: "What should buyers see as your shop name?",
    hint: "Your business name or a trade name, up to 60 characters. You can change it later.",
    placeholder: "Shop name",
  },
  {
    id: "designation", type: "text", key: "designation",
    when: d => NEEDS_SIGNATORY.includes(d.form_of_organization),
    ask: "What's your role in the business?",
    placeholder: "e.g. General Manager",
  },
  {
    id: "signatory", type: "signatory-names",
    when: d => NEEDS_SIGNATORY.includes(d.form_of_organization),
    ask: d => `Who is the authorized signatory for this ${d.form_of_organization.toLowerCase()}?`,
    hint: "The person named in your board resolution or authorization. It can be you.",
  },
  {
    id: "signatory_contact", type: "contact", optional: true,
    when: d => NEEDS_SIGNATORY.includes(d.form_of_organization),
    ask: "How can we reach the signatory, if it isn't you?",
    fields: [
      { key: "signatory_email", label: "Email", type: "email", placeholder: "Signatory email" },
      { key: "signatory_mobile", label: "Mobile", placeholder: "Signatory mobile" },
    ],
  },
  {
    id: "business_tin", type: "tin", key: "business_tin",
    ask: "What's the business TIN?",
    hint: "From your BIR Certificate of Registration (Form 2303), with the branch code if you have one. The BIR requires marketplaces to keep it on file for every seller.",
    placeholder: "123-456-789-00000",
  },
  {
    id: "vat_registered", type: "choice", key: "vat_registered",
    ask: "Is the business registered for VAT?",
    hint: "Check your Certificate of Registration. It decides whether your invoices show 12% VAT.",
    choices: yesNo("VAT-registered", "Non-VAT"),
  },
  {
    id: "business_address", type: "address",
    ask: "Where is the business located?",
    hint: "The address on your business registration. You'll set your pickup address separately.",
  },
  {
    id: "main_category", type: "choice", key: "main_category",
    ask: "What do you mainly sell?",
    choices: "categories",
  },
  {
    id: "product_count", type: "choice", key: "product_count",
    ask: "About how many products will you list at first?",
    choices: PRODUCT_COUNTS.map(v => ({ label: v, value: v })),
  },
  {
    id: "product_source", type: "choice", key: "product_source",
    ask: "Where do your products come from?",
    hint: "Branded goods you don't own may need an authorization letter from the brand.",
    choices: PRODUCT_SOURCES.map(v => ({ label: v, value: v })),
  },
  {
    id: "sells_regulated", type: "choice", key: "sells_regulated",
    ask: "Will you sell food, drinks, supplements, cosmetics or health products?",
    hint: "These need FDA permits (a License to Operate and product registration). We'll ask for them before those products go live.",
    choices: yesNo("Yes", "No"),
  },
  {
    id: "store_links", type: "text", key: "store_links", optional: true,
    ask: "Do you already sell online? Share a link to your page or shop.",
    hint: "Facebook page, Shopee, Lazada, TikTok Shop or your website. It helps us review your application faster.",
    placeholder: "https://",
  },
  {
    id: "password", type: "password",
    ask: "Almost done. Create a password for your seller account.",
    hint: "At least 8 characters.",
  },
  {
    id: "promo_code", type: "promo", key: "promo_code", optional: true,
    ask: "Do you have a promo code? Your first month is already free either way.",
    placeholder: "Enter promo code",
  },
]

// ---------------------------------------------------------------------------
// Per-question helpers
// ---------------------------------------------------------------------------

function askText(q: Question, d: FormData): string {
  return typeof q.ask === "function" ? q.ask(d) : q.ask
}

function hintText(q: Question, d: FormData): string | undefined {
  return typeof q.hint === "function" ? q.hint(d) : q.hint
}

function isValid(q: Question, d: FormData): boolean {
  switch (q.type) {
    case "names": return !!(d.first_name.trim() && d.last_name.trim())
    case "signatory-names": return !!(d.signatory_first_name.trim() && d.signatory_last_name.trim())
    case "org": return !!d.form_of_organization
    case "tel": return isPhMobile(d.mobile_number)
    case "email": return isEmail(d.email)
    case "tin": return isTin(d.business_tin)
    case "choice": return q.key ? d[q.key] !== null && d[q.key] !== "" : false
    case "address":
      return !!(d.business_province && d.business_city && d.business_street.trim() && /^\d{4}$/.test(d.business_postal_code.trim()))
    case "contact":
      return !d.signatory_email.trim() || isEmail(d.signatory_email)
    case "password":
      return d.password.length >= 8 && d.password === d.confirm_password
    default:
      if (q.optional) return true
      return !!(q.key && String(d[q.key] ?? "").trim())
  }
}

function isFilled(q: Question, d: FormData): boolean {
  switch (q.type) {
    case "contact": return (q.fields || []).some(f => String(d[f.key] ?? "").trim())
    default:
      return !!(q.key && String(d[q.key] ?? "").trim())
  }
}

const choiceLabel = (q: Question, d: FormData) => {
  const v = q.key ? d[q.key] : null
  const list = Array.isArray(q.choices) ? q.choices : []
  return list.find(c => c.value === v)?.label ?? String(v ?? "")
}

function bubbleFor(q: Question, d: FormData): string {
  switch (q.type) {
    case "names": return `${d.first_name} ${d.last_name}`.trim()
    case "signatory-names":
      return [d.signatory_first_name, d.signatory_middle_name, d.signatory_last_name].filter(Boolean).join(" ")
    case "org": return ORG_TYPES.find(o => o.value === d.form_of_organization)?.label ?? d.form_of_organization
    case "choice": return choiceLabel(q, d)
    case "address": return addressLine(d)
    case "password": return "Password set"
    case "contact": {
      const vals = (q.fields || []).map(f => String(d[f.key] ?? "").trim()).filter(Boolean)
      return vals.length ? vals.join(" · ") : "Skipped"
    }
    default:
      return q.key ? String(d[q.key] ?? "").trim() || "Skipped" : "Skipped"
  }
}

const addressLine = (d: FormData) =>
  [d.business_street, d.business_barangay, d.business_city, `${d.business_province} ${d.business_postal_code}`]
    .map(s => s.trim())
    .filter(Boolean)
    .join(", ")

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------


function Sparkle({ size = 18, color = "white" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M12 2c.55 4.9 2.6 6.95 7.5 7.5-4.9.55-6.95 2.6-7.5 7.5-.55-4.9-2.6-6.95-7.5-7.5C9.4 8.95 11.45 6.9 12 2Z" fill={color} />
      <path d="M19 3.5c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" fill={color} opacity="0.85" />
    </svg>
  )
}

function BotAvatar({ size = 34 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 shadow-sm ring-1 ring-white/10"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${BRAND}, #7d5aa8)` }}
    >
      <Sparkle size={size * 0.52} color="white" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message model
// ---------------------------------------------------------------------------

interface Message {
  id: number
  role: "bot" | "user"
  content: ReactNode
}

let msgId = 0
const nextId = () => ++msgId

// ---------------------------------------------------------------------------
// Composer — renders the right input for the active question
// ---------------------------------------------------------------------------

// Shared field/shell styling for a seamless "input bar" look
const FIELD =
  "flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none"
const SHELL =
  "flex items-center gap-1 rounded-2xl border border-ui-border-base bg-ui-bg-field px-1.5 py-1.5 shadow-sm transition-all duration-200 focus-within:border-[#432C63] focus-within:ring-4 focus-within:ring-[#432C63]/10 focus-within:shadow-md"

function SendButton({ label, canSend, onClick }: { label: string; canSend: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => canSend && onClick()}
      disabled={!canSend}
      className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
        canSend
          ? "text-white hover:-translate-y-0.5"
          : "text-ui-fg-disabled bg-ui-bg-disabled border border-ui-border-base cursor-not-allowed"
      }`}
      style={canSend ? { background: `linear-gradient(135deg, ${BRAND}, #5a3d80)`, boxShadow: "0 6px 16px -6px rgba(67,44,99,0.55)" } : undefined}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={canSend ? "transition-transform group-hover:translate-x-0.5" : ""}>
        <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function Composer({ q, data, set, onSend, disabled, categories }: {
  q: Question
  data: FormData
  set: Setter
  onSend: (chosen?: Partial<FormData>) => void
  disabled: boolean
  categories: string[]
}) {
  const [showPass, setShowPass] = useState(false)
  const valid = isValid(q, data)
  const filled = isFilled(q, data)
  const canSend = valid && !disabled
  const sendLabel = q.optional && !filled ? "Skip" : "Send"

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && canSend) { e.preventDefault(); onSend() }
  }

  const send = <SendButton label={sendLabel} canSend={canSend} onClick={() => onSend()} />

  // -- single-line text-like inputs --
  if (["text", "email", "tel", "tin", "promo"].includes(q.type)) {
    const inputType = q.type === "email" ? "email" : q.type === "tel" ? "tel" : "text"
    const value = String(data[q.key!] ?? "")
    const problem =
      !value.trim() || valid
        ? ""
        : q.type === "tel"
          ? "Enter a Philippine mobile number, like 0917 123 4567."
          : q.type === "email"
            ? "Enter a valid email address."
            : q.type === "tin"
              ? "A TIN has 9 digits, plus a 3- or 5-digit branch code if you have one."
              : ""
    return (
      <div className="space-y-1.5">
        <div className={SHELL}>
          <input
            autoFocus
            type={inputType}
            value={value}
            maxLength={q.id === "shop_name" ? 60 : undefined}
            onChange={e => set(q.key!, (q.type === "promo" ? e.target.value.toUpperCase() : e.target.value) as never)}
            onKeyDown={onKeyDown}
            placeholder={q.placeholder || "Type your answer…"}
            disabled={disabled}
            className={FIELD}
          />
          {send}
        </div>
        {problem && <p className="text-ui-tag-red-text text-xs">{problem}</p>}
      </div>
    )
  }

  if (q.type === "names") {
    return (
      <div className={SHELL}>
        <input autoFocus value={data.first_name} onChange={e => set("first_name", e.target.value)} onKeyDown={onKeyDown} placeholder="First name" className={FIELD} />
        <span className="h-6 w-px bg-ui-border-base shrink-0" />
        <input value={data.last_name} onChange={e => set("last_name", e.target.value)} onKeyDown={onKeyDown} placeholder="Last name" className={FIELD} />
        {send}
      </div>
    )
  }

  if (q.type === "signatory-names") {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className={`${SHELL} flex-1`}>
          <input autoFocus value={data.signatory_first_name} onChange={e => set("signatory_first_name", e.target.value)} onKeyDown={onKeyDown} placeholder="First name" className={FIELD} />
          <span className="hidden sm:block h-6 w-px bg-ui-border-base shrink-0" />
          <input value={data.signatory_middle_name} onChange={e => set("signatory_middle_name", e.target.value)} onKeyDown={onKeyDown} placeholder="Middle (optional)" className={FIELD} />
          <span className="hidden sm:block h-6 w-px bg-ui-border-base shrink-0" />
          <input value={data.signatory_last_name} onChange={e => set("signatory_last_name", e.target.value)} onKeyDown={onKeyDown} placeholder="Last name" className={FIELD} />
        </div>
        <div className="flex justify-end sm:block">{send}</div>
      </div>
    )
  }

  if (q.type === "contact") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(q.fields || []).map(f => (
            <div key={f.key} className={SHELL}>
              <input
                type={f.type || "text"}
                value={String(data[f.key] ?? "")}
                onChange={e => set(f.key, e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={f.placeholder || f.label}
                className={FIELD}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">{send}</div>
      </div>
    )
  }

  if (q.type === "org") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ORG_TYPES.map(({ value: t, label }) => {
          const on = data.form_of_organization === t
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => onSend({ form_of_organization: t })}
              className={`rounded-xl border px-2 py-2.5 text-xs font-medium text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                on ? "border-transparent text-white shadow-md" : "border-ui-border-base text-ui-fg-base bg-ui-bg-field hover:border-[#432C63]/60 hover:shadow-sm"
              }`}
              style={on ? { background: `linear-gradient(135deg, ${BRAND}, #5a3d80)` } : undefined}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  if (q.type === "choice") {
    const list: Choice[] = q.choices === "categories"
      ? [...categories, "Other"].map(c => ({ label: c, value: c }))
      : q.choices || []
    return (
      <div className="flex flex-wrap gap-2">
        {list.map(o => (
          <button
            key={String(o.value)}
            type="button"
            disabled={disabled}
            onClick={() => onSend({ [q.key!]: o.value } as Partial<FormData>)}
            className="rounded-xl border border-ui-border-base bg-ui-bg-field px-4 py-2.5 text-sm font-medium text-ui-fg-base transition-all duration-200 hover:-translate-y-0.5 hover:border-[#432C63]/60 hover:text-[#432C63] hover:shadow-sm active:scale-95"
          >
            {o.label}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === "address") {
    const cities = CITIES[data.business_province] || []
    const select = `${FIELD} appearance-none`
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className={SHELL}>
            <select
              aria-label="Province"
              value={data.business_province}
              onChange={e => { set("business_province", e.target.value); set("business_city", "") }}
              className={select}
            >
              <option value="">Province</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className={SHELL}>
            <select
              aria-label="City or municipality"
              value={data.business_city}
              onChange={e => set("business_city", e.target.value)}
              disabled={!cities.length}
              className={select}
            >
              <option value="">City / municipality</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={SHELL}>
            <input value={data.business_barangay} onChange={e => set("business_barangay", e.target.value)} onKeyDown={onKeyDown} placeholder="Barangay" className={FIELD} />
          </div>
          <div className={SHELL}>
            <input
              value={data.business_postal_code}
              onChange={e => set("business_postal_code", e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={onKeyDown}
              inputMode="numeric"
              placeholder="ZIP code"
              className={FIELD}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`${SHELL} flex-1`}>
            <input value={data.business_street} onChange={e => set("business_street", e.target.value)} onKeyDown={onKeyDown} placeholder="House / unit no., building, street" className={FIELD} />
          </div>
          {send}
        </div>
      </div>
    )
  }

  if (q.type === "password") {
    const tooShort = data.password.length > 0 && data.password.length < 8
    const mismatch = data.password.length >= 8 && !!data.confirm_password && data.password !== data.confirm_password
    const match = data.password.length >= 8 && !!data.confirm_password && data.password === data.confirm_password
    return (
      <div className="space-y-2">
        <div className={SHELL}>
          <input
            autoFocus
            type={showPass ? "text" : "password"}
            value={data.password}
            onChange={e => set("password", e.target.value)}
            placeholder="Create a password (min. 8 characters)"
            className={FIELD}
          />
          <button type="button" onClick={() => setShowPass(s => !s)} className="shrink-0 px-2 text-xs font-medium text-ui-fg-muted hover:text-ui-fg-subtle">
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`${SHELL} flex-1`}>
            <input
              type={showPass ? "text" : "password"}
              value={data.confirm_password}
              onChange={e => set("confirm_password", e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Confirm password"
              className={FIELD}
            />
          </div>
          {send}
        </div>
        {tooShort && <p className="text-ui-tag-red-text text-xs">Password must be at least 8 characters.</p>}
        {mismatch && <p className="text-ui-tag-red-text text-xs">Passwords do not match.</p>}
        {match && (
          <p className="text-ui-tag-green-text text-xs inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Passwords match
          </p>
        )}
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------

function ReviewCard({ data, onEdit }: { data: FormData; onEdit: (qid: string) => void }) {
  const rows: { label: string; value: string; qid: string }[] = []
  const add = (label: string, value: string | undefined, qid: string) => {
    if (value && value.trim()) rows.push({ label, value, qid })
  }
  const org = ORG_TYPES.find(o => o.value === data.form_of_organization)?.label ?? data.form_of_organization
  add("Name", `${data.first_name} ${data.last_name}`, "names")
  add("Mobile", data.mobile_number, "mobile_number")
  add("Email", data.email, "email")
  add("Registered as", org, "form_of_organization")
  add("Business name", data.business_name, "business_name")
  add("Shop name", data.shop_name, "shop_name")
  add("Your role", data.designation, "designation")
  if (data.signatory_first_name || data.signatory_last_name)
    add("Signatory", [data.signatory_first_name, data.signatory_middle_name, data.signatory_last_name].filter(Boolean).join(" "), "signatory")
  add("Signatory contact", [data.signatory_email, data.signatory_mobile].filter(Boolean).join(" · "), "signatory_contact")
  add("TIN", data.business_tin, "business_tin")
  if (data.vat_registered !== null) add("VAT", data.vat_registered ? "VAT-registered" : "Non-VAT", "vat_registered")
  add("Business address", addressLine(data), "business_address")
  add("Mainly sells", data.main_category, "main_category")
  add("Products", data.product_count, "product_count")
  add("Source", data.product_source, "product_source")
  if (data.sells_regulated !== null) add("FDA-regulated products", data.sells_regulated ? "Yes" : "No", "sells_regulated")
  add("Online shop", data.store_links, "store_links")
  if (data.promo_code) add("Promo code", data.promo_code, "promo_code")

  return (
    <div className="rounded-xl border border-ui-border-base bg-ui-bg-base overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={r.label + i} className={`group relative px-4 py-2.5 ${i % 2 === 0 ? "sm:border-r" : ""} border-b border-ui-border-base`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-ui-fg-muted">{r.label}</p>
                <p className="text-sm text-ui-fg-base break-words">{r.value}</p>
              </div>
              <button
                type="button"
                onClick={() => onEdit(r.qid)}
                title={`Edit ${r.label}`}
                className="shrink-0 mt-0.5 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity text-ui-fg-muted hover:text-[#432C63]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20h4l10-10a2 2 0 0 0-2.83-2.83L5.2 17.2 4 20z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 bg-ui-bg-subtle/60">
        <p className="text-[11px] text-ui-fg-muted">Need a change? Tap the pencil on any field to edit it before submitting.</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/** How far along the sign-up is, beside the conversation. */
function SignupProgress({ progress }: { progress: number }) {
  return (
    <>
      <GlassCard className="absolute left-0 top-0 w-[300px]" tilt={-2}>
        <p className="text-xs opacity-60">Your application</p>
        <p className="mt-1 text-[26px] font-semibold tracking-tight">{progress}% done</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#432C63]/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-[#FFC533] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </GlassCard>
      <GlassCard className="absolute right-0 top-[118px] w-[260px]" tilt={2} delay={1400}>
        <ul className="flex flex-col gap-2 text-sm">
          {["Free to sign up", "A first month free on any plan", "Paid out to your own bank"].map((label) => (
            <li key={label} className="flex items-center gap-2">
              <Butterfly size={14} className="shrink-0 text-[#6B4C9A] dark:text-[#FFC533]" />
              <span className="opacity-90">{label}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </>
  )
}

export const RegisterChat = () => {
  const [data, setData] = useState<FormData>(INITIAL)
  const [messages, setMessages] = useState<Message[]>([])
  const [idx, setIdx] = useState(-1)          // active question index (-1 before intro)
  const [botTyping, setBotTyping] = useState(false)
  const [phase, setPhase] = useState<"intro" | "chat" | "review" | "success">("intro")
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState("")
  const [captchaRound, setCaptchaRound] = useState(0)
  const [error, setError] = useState("")
  const [editingQid, setEditingQid] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const set: Setter = (key, value) => setData(prev => ({ ...prev, [key]: value }))

  // The shop's live top-level categories for "What do you mainly sell?"
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES)
  useEffect(() => {
    fetch(`${backendUrl}/store/product-categories?limit=100&fields=name,parent_category_id`, {
      headers: { "x-publishable-api-key": publishableApiKey },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        const names = (json?.product_categories || [])
          .filter((c: any) => !c.parent_category_id)
          .map((c: any) => String(c.name))
        if (names.length) setCategories(names)
      })
      .catch(() => {})
  }, [])

  const pushBot = (content: ReactNode) => setMessages(m => [...m, { id: nextId(), role: "bot", content }])
  const pushUser = (content: ReactNode) => setMessages(m => [...m, { id: nextId(), role: "user", content }])

  // auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, botTyping, idx, phase])

  // find the next visible question after `from`, evaluated against `d`
  const nextVisible = (from: number, d: FormData) => {
    let n = from + 1
    while (n < QUESTIONS.length && QUESTIONS[n].when && !QUESTIONS[n].when!(d)) n++
    return n
  }

  const askQuestion = (i: number, d: FormData, delay = 550) => {
    setBotTyping(true)
    window.setTimeout(() => {
      setBotTyping(false)
      const q = QUESTIONS[i]
      pushBot(askText(q, d))
      const hint = hintText(q, d)
      if (hint) pushBot(<span className="text-ui-fg-subtle">{hint}</span>)
      setIdx(i)
    }, delay)
  }

  const goReview = () => {
    setBotTyping(true)
    window.setTimeout(() => {
      setBotTyping(false)
      pushBot("That's everything I need. Here's a quick summary — review it and submit when you're ready.")
      setIdx(-1)
      setPhase("review")
    }, 650)
  }

  // kick off the conversation on mount
  useEffect(() => {
    if (started.current) return
    started.current = true
    setBotTyping(true)
    window.setTimeout(() => {
      setBotTyping(false)
      pushBot(`Hi, I'm ${BOT_NAME} — your onboarding assistant at Maretinda.`)
      window.setTimeout(() => {
        pushBot("Instead of a long form, I'll set up your seller account through a quick chat. It takes about three minutes.")
        setPhase("chat")
        const first = nextVisible(-1, INITIAL)
        askQuestion(first, INITIAL, 700)
      }, 650)
    }, 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Jump back to a single question to correct an answer, then return to review.
  const startEdit = (qid: string) => {
    const i = QUESTIONS.findIndex(q => q.id === qid)
    if (i < 0) return
    setError("")
    setEditingQid(qid)
    setPhase("chat")
    setIdx(i)
    pushBot(<span>Sure — update your answer below and I'll refresh your summary.</span>)
  }

  const handleSend = (chosen?: Partial<FormData>) => {
    const q = QUESTIONS[idx]
    if (!q) return
    let d: FormData = chosen ? { ...data, ...chosen } : data
    if (!isValid(q, d)) return
    // Suggest the business name as the shop name; the applicant can edit it
    if (q.id === "business_name" && !d.shop_name.trim()) d = { ...d, shop_name: d.business_name.trim().slice(0, 60) }
    if (d !== data) setData(d)

    pushUser(bubbleFor(q, d))

    // Editing a single field from the review — apply and go straight back.
    if (editingQid) {
      setEditingQid(null)
      setBotTyping(true)
      window.setTimeout(() => {
        setBotTyping(false)
        pushBot("Updated — here's your refreshed summary.")
        setIdx(-1)
        setPhase("review")
      }, 500)
      return
    }

    const n = nextVisible(idx, d)
    if (n >= QUESTIONS.length) goReview()
    else askQuestion(n, d)
  }

  async function handleSubmit() {
    if (data.password !== data.confirm_password) {
      setError("Passwords do not match.")
      return
    }
    if (!data.terms_accepted || !data.privacy_consent) {
      setError("Please tick both boxes to agree to the Seller Agreement and the privacy notice.")
      return
    }
    if (CAPTCHA_SITE_KEY && !captchaToken) {
      setError("Please complete the verification check first.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const result = await submitSellerApplication(data.email, data.password, {
        register: async (email, password) =>
          String(await sdk.auth.register("seller", "emailpass", { email, password })),
        login: async (email, password) =>
          String(await sdk.auth.login("seller", "emailpass", { email, password })),
        postApplication: (token) =>
          fetch(`${backendUrl}/store/seller-application`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-publishable-api-key": publishableApiKey,
              Authorization: `Bearer ${token}`,
            },
            // The password belongs to the sign-in only, never the application
            body: JSON.stringify((({ password: _p, confirm_password: _c, ...application }) => ({
              ...application,
              ...(captchaToken ? { captcha_token: captchaToken } : {}),
            }))(data)),
          }),
      })
      if (result.ok) setPhase("success")
      else {
        setError(result.message)
        // A captcha token works once, so a failed attempt needs a new one
        setCaptchaRound((round) => round + 1)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      setError(msg || "Registration failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // progress
  const totalVisible = QUESTIONS.filter(q => !q.when || q.when(data)).length
  const answered = phase === "review" || phase === "success" || editingQid
    ? totalVisible
    : Math.max(0, QUESTIONS.slice(0, Math.max(idx, 0)).filter(q => !q.when || q.when(data)).length)
  const progress = phase === "success" ? 100 : Math.round((answered / totalVisible) * 100)

  const activeQ = idx >= 0 ? QUESTIONS[idx] : null

  // ---- Success screen ----
  if (phase === "success") {
    return (
      <AuthShell portal="Seller Centre">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ui-bg-highlight text-ui-fg-interactive">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-display text-ui-fg-base mb-2 text-[34px] leading-tight">Application sent</h2>
          <p className="text-ui-fg-subtle mb-8 text-sm leading-relaxed">
            Thanks for chatting with me, {data.first_name || "friend"}. Your application to sell on Maretinda is now under review,
            and you'll get an email once your account is activated.
          </p>
          <Link to="/login" className={PRIMARY_BUTTON}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      portal="Seller Centre"
      wide
      flush
      headline={
        <>
          Let&apos;s get you
          <br />
          <Accent>selling on Maretinda.</Accent>
        </>
      }
      lede={`No long forms: a quick chat with ${BOT_NAME}, and you're on your way to buyers across the Philippines.`}
      preview={<SignupProgress progress={progress} />}
    >
      <style>{`
        @keyframes mtd-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mtd-blob { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(12px,-16px) scale(1.08);} }
        @keyframes mtd-dot { 0%,80%,100% { transform: scale(0.6); opacity: .4;} 40% { transform: scale(1); opacity: 1;} }
        @keyframes mtd-glow { 0%,100% { opacity: .5; } 50% { opacity: .9; } }
        .mtd-msg { animation: mtd-in .28s ease both; }
        .mtd-dot { animation: mtd-dot 1.2s infinite ease-in-out; }
        .mtd-scroll::-webkit-scrollbar { width: 8px; }
        .mtd-scroll::-webkit-scrollbar-thumb { background: rgba(120,120,120,.28); border-radius: 999px; }
        .mtd-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>


          {/* Header */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-white/50 dark:border-white/10">
            <BotAvatar size={38} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ui-fg-base leading-tight">{BOT_NAME}</p>
              <p className="text-xs text-ui-fg-subtle inline-flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ui-tag-green-icon opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ui-tag-green-icon" />
                </span>
                {botTyping ? "typing…" : "Onboarding assistant · online"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-[10px] font-medium text-ui-fg-muted">{progress}%</span>
                <div className="w-24 h-1.5 rounded-full bg-ui-bg-subtle overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: BRAND }} />
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="mtd-scroll flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-6"
          >
            <div className="space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`mtd-msg flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "bot" && <BotAvatar size={28} />}
                  <div
                    className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "text-white rounded-2xl rounded-br-md"
                        : "bg-white/70 dark:bg-white/[0.07] backdrop-blur text-ui-fg-base rounded-2xl rounded-bl-md border border-white/80 dark:border-white/10"
                    }`}
                    style={m.role === "user" ? { background: `linear-gradient(135deg, ${BRAND}, #5a3d80)` } : undefined}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {botTyping && (
                <div className="mtd-msg flex items-end gap-2 justify-start">
                  <BotAvatar size={28} />
                  <div className="bg-white/70 dark:bg-white/[0.07] backdrop-blur border border-white/80 dark:border-white/10 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="mtd-dot w-1.5 h-1.5 rounded-full bg-ui-fg-muted" style={{ animationDelay: `${i * 0.18}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Review card in the stream */}
              {phase === "review" && (
                <div className="mtd-msg flex items-end gap-2 justify-start">
                  <BotAvatar size={28} />
                  <div className="max-w-[94%] w-full">
                    <ReviewCard data={data} onEdit={startEdit} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Composer / action bar */}
          <div className="border-t border-white/50 dark:border-white/10 bg-white/30 dark:bg-black/10 px-3 sm:px-6 py-4">
            {error && (
              <div className="mb-3 rounded-xl border border-ui-tag-red-border bg-ui-tag-red-bg px-4 py-2.5 text-sm text-ui-tag-red-text">{error}</div>
            )}

            {phase === "review" && (
              <div className="mb-3 flex justify-end empty:hidden">
                <CaptchaWidget onToken={setCaptchaToken} resetKey={captchaRound} />
              </div>
            )}

            {phase === "review" && (
              <div className="mb-3 flex flex-col gap-2 text-xs text-ui-fg-base">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={data.terms_accepted}
                    onChange={e => set("terms_accepted", e.target.checked)}
                  />
                  <span>
                    I have read and agree to the{" "}
                    <a className="underline font-medium" href={`${MEDUSA_STOREFRONT_URL}/ph/terms?doc=seller`} target="_blank" rel="noreferrer">
                      Seller Agreement
                    </a>
                    . I am at least 18 years old and authorized to register this business.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={data.privacy_consent}
                    onChange={e => set("privacy_consent", e.target.checked)}
                  />
                  <span>
                    I agree that Maretinda may process my personal and business information to review this application and run my
                    shop, as described in the{" "}
                    <a className="underline font-medium" href={`${MEDUSA_STOREFRONT_URL}/ph/privacy`} target="_blank" rel="noreferrer">
                      Privacy Policy
                    </a>{" "}
                    (Data Privacy Act of 2012).
                  </span>
                </label>
              </div>
            )}

            {phase === "review" ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-ui-fg-subtle">We'll email you once our team has reviewed your application.</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !data.terms_accepted || !data.privacy_consent}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: BRAND }}
                >
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </div>
            ) : activeQ && !botTyping ? (
              <>
                <Composer q={activeQ} data={data} set={set} onSend={handleSend} disabled={botTyping} categories={categories} />
                {activeQ.optional && (
                  <p className="text-[11px] text-ui-fg-muted mt-2">This one's optional — press Skip to move on.</p>
                )}
              </>
            ) : (
              <div className="h-11 flex items-center gap-2 text-xs text-ui-fg-muted">
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="mtd-dot w-1 h-1 rounded-full bg-ui-fg-muted" style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </span>
                {BOT_NAME} is getting the next question ready…
              </div>
            )}

            <div className="mt-3 text-center">
              <span className="text-ui-fg-subtle text-xs">
                Already have an account?{" "}
                <Link to="/login" className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium">Sign in</Link>
              </span>
            </div>
          </div>
    </AuthShell>
  )
}
