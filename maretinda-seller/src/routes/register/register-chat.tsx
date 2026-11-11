import { useState, useRef, useEffect, ChangeEvent, ReactNode } from "react"
import { Link } from "react-router-dom"
import { backendUrl, publishableApiKey, sdk } from "../../lib/client/client"
import { Accent, AuthShell, Butterfly, GlassCard, PRIMARY_BUTTON } from "../../components/auth/auth-shell"
import { submitSellerApplication } from "./submit-application"

// ---------------------------------------------------------------------------
// The assistant's persona
// ---------------------------------------------------------------------------

const BOT_NAME = "Tala"
const BRAND = "#432C63"


// ---------------------------------------------------------------------------
// Constants (mirror of the classic registration form)
// ---------------------------------------------------------------------------

const DIGITAL_SUPPORT_OPTIONS = [
  "Website", "Facebook", "Instagram", "TikTok", "Twitter/X",
  "YouTube", "Email Newsletter", "SMS/Viber", "None",
]

const ORG_TYPES = [
  "Sole Proprietorship", "Corporation", "Partnership",
  "Cooperative", "Association", "Government", "Transportation", "Others",
]

const NEEDS_SIGNATORY = ["Corporation", "Partnership", "Cooperative", "Association", "Government"]

const ORG_DOCUMENTS: Record<string, { key: string; label: string }[]> = {
  "Sole Proprietorship": [
    { key: "dti_registration", label: "DTI Registration Certificate" },
    { key: "mayors_permit", label: "Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government ID" },
  ],
  Corporation: [
    { key: "board_resolution", label: "Board Resolution" },
    { key: "articles_bylaws", label: "Articles of Incorporation / By-Laws" },
    { key: "sec_registration", label: "SEC Registration Certificate" },
    { key: "mayors_permit", label: "DTI / Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs of Signatories" },
  ],
  Partnership: [
    { key: "partnership_agreement", label: "Partnership Agreement" },
    { key: "sec_registration", label: "SEC Registration Certificate" },
    { key: "mayors_permit", label: "Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs of Partners" },
  ],
  Cooperative: [
    { key: "cda_registration", label: "CDA Registration Certificate" },
    { key: "bylaws", label: "By-Laws" },
    { key: "mayors_permit", label: "Mayor's Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs" },
  ],
  Association: [
    { key: "registration_certificate", label: "Registration Certificate" },
    { key: "bylaws", label: "By-Laws / Constitution" },
    { key: "board_resolution", label: "Board Resolution" },
    { key: "valid_id", label: "Valid Government IDs of Officers" },
  ],
  Government: [
    { key: "authorization_letter", label: "Official Authorization Letter" },
    { key: "valid_id", label: "Government ID of Authorized Representative" },
  ],
  Transportation: [
    { key: "business_permit", label: "Business / Franchise Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government IDs" },
  ],
  Others: [
    { key: "business_permit", label: "Business Permit" },
    { key: "bir_certificate", label: "BIR Certificate of Registration" },
    { key: "valid_id", label: "Valid Government ID" },
  ],
}

// ---------------------------------------------------------------------------
// Types (identical payload shape to the classic form)
// ---------------------------------------------------------------------------

interface FormData {
  first_name: string; last_name: string; complete_address: string
  mobile_number: string; email: string; designation: string; target_go_live: string
  business_name: string; business_address: string; business_landline: string
  business_mobile: string; business_email: string; business_tin: string
  form_of_organization: string; merchant_category: string; business_activity: string
  signatory_first_name: string; signatory_middle_name: string; signatory_last_name: string
  signatory_email: string; signatory_landline: string; signatory_mobile: string
  documents: Record<string, string>
  brand_colors: string; digital_support: string[]; has_marketing_budget: boolean | null
  promo_code: string
  password: string; confirm_password: string
}

const INITIAL: FormData = {
  first_name: "", last_name: "", complete_address: "", mobile_number: "",
  email: "", designation: "", target_go_live: "",
  business_name: "", business_address: "", business_landline: "", business_mobile: "",
  business_email: "", business_tin: "", form_of_organization: "", merchant_category: "",
  business_activity: "",
  signatory_first_name: "", signatory_middle_name: "", signatory_last_name: "",
  signatory_email: "", signatory_landline: "", signatory_mobile: "",
  documents: {},
  brand_colors: "", digital_support: [], has_marketing_budget: null,
  promo_code: "",
  password: "", confirm_password: "",
}

type Setter = <K extends keyof FormData>(k: K, v: FormData[K]) => void

// ---------------------------------------------------------------------------
// Conversation script — each entry maps to one or more FormData fields
// ---------------------------------------------------------------------------

type QType =
  | "names" | "text" | "email" | "tel" | "date"
  | "org" | "signatory-names" | "contact" | "multichoice"
  | "yesno" | "files" | "password" | "promo"

interface Question {
  id: string
  type: QType
  when?: (d: FormData) => boolean
  ask: string | ((d: FormData) => string)
  hint?: string
  optional?: boolean
  key?: keyof FormData
  placeholder?: string
  fields?: { key: keyof FormData; label: string; type?: string; placeholder?: string }[]
  options?: string[]
}

const QUESTIONS: Question[] = [
  {
    id: "names", type: "names",
    ask: "Let's start with you. What's your name?",
    hint: "Your personal first and last name.",
  },
  {
    id: "complete_address", type: "text", key: "complete_address",
    ask: d => `Nice to meet you, ${d.first_name || "there"}. What's your complete address?`,
    hint: "House No., Street, Barangay, City, Province, ZIP",
    placeholder: "House No., Street, Barangay, City, Province, ZIP",
  },
  {
    id: "mobile_number", type: "tel", key: "mobile_number",
    ask: "What's the best mobile number to reach you?",
    placeholder: "+63 9XX XXX XXXX",
  },
  {
    id: "email", type: "email", key: "email",
    ask: "And your email address? You'll use this to sign in to your seller account.",
    placeholder: "juan@example.com",
  },
  {
    id: "designation", type: "text", key: "designation", optional: true,
    ask: "What's your role or designation in the business?",
    placeholder: "e.g. Owner, CEO",
  },
  {
    id: "target_go_live", type: "date", key: "target_go_live", optional: true,
    ask: "Do you have a target go-live date in mind? Pick one, or skip for now.",
  },
  {
    id: "business_name", type: "text", key: "business_name",
    ask: "Now let's talk about your business. What's the business name?",
    placeholder: "ABC Trading Co.",
  },
  {
    id: "business_address", type: "text", key: "business_address",
    ask: "What's the complete business address?",
    placeholder: "Complete business address",
  },
  {
    id: "business_contact", type: "contact", optional: true,
    ask: "Any business contact details you'd like to add? All of these are optional.",
    fields: [
      { key: "business_landline", label: "Landline", placeholder: "(02) XXXX XXXX" },
      { key: "business_mobile", label: "Mobile", placeholder: "+63 9XX XXX XXXX" },
      { key: "business_email", label: "Business Email", type: "email", placeholder: "biz@example.com" },
    ],
  },
  {
    id: "merchant_category", type: "text", key: "merchant_category", optional: true,
    ask: "How would you categorize your business?",
    placeholder: "e.g. Retail, Food & Beverage",
  },
  {
    id: "business_activity", type: "text", key: "business_activity", optional: true,
    ask: "What's your main business activity?",
    placeholder: "Main business activity",
  },
  {
    id: "form_of_organization", type: "org",
    ask: "What's your form of organization? This tells me which documents you'll need.",
  },
  {
    id: "signatory", type: "signatory-names",
    when: d => NEEDS_SIGNATORY.includes(d.form_of_organization),
    ask: d => `Since you're a ${d.form_of_organization}, I'll need your authorized signatory. What's their name?`,
    hint: "First and last name are required.",
  },
  {
    id: "signatory_contact", type: "contact", optional: true,
    when: d => NEEDS_SIGNATORY.includes(d.form_of_organization),
    ask: "Any contact details for your signatory?",
    fields: [
      { key: "signatory_email", label: "Email", type: "email" },
      { key: "signatory_landline", label: "Landline" },
      { key: "signatory_mobile", label: "Mobile" },
    ],
  },
  {
    id: "brand_colors", type: "text", key: "brand_colors", optional: true,
    ask: "Almost done. Do you have brand colors?",
    placeholder: "e.g. #FF5733, Blue and White",
  },
  {
    id: "digital_support", type: "multichoice", key: "digital_support", optional: true,
    ask: "Where does your business show up online? Select all that apply.",
    options: DIGITAL_SUPPORT_OPTIONS,
  },
  {
    id: "has_marketing_budget", type: "yesno",
    ask: "Do you have a dedicated marketing budget?",
  },
  {
    id: "password", type: "password",
    ask: "Last thing — let's secure your account. Create a password.",
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

function isValid(q: Question, d: FormData): boolean {
  switch (q.type) {
    case "names": return !!(d.first_name.trim() && d.last_name.trim())
    case "signatory-names": return !!(d.signatory_first_name.trim() && d.signatory_last_name.trim())
    case "org": return !!d.form_of_organization
    case "yesno": return d.has_marketing_budget !== null
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
    case "multichoice": return (d.digital_support || []).length > 0
    case "files": return Object.values(d.documents).some(Boolean)
    case "date": return !!d.target_go_live
    default:
      return !!(q.key && String(d[q.key] ?? "").trim())
  }
}

function bubbleFor(q: Question, d: FormData): string {
  switch (q.type) {
    case "names": return `${d.first_name} ${d.last_name}`.trim()
    case "signatory-names":
      return [d.signatory_first_name, d.signatory_middle_name, d.signatory_last_name].filter(Boolean).join(" ")
    case "org": return d.form_of_organization
    case "yesno": return d.has_marketing_budget ? "Yes" : "No"
    case "password": return "Password set"
    case "multichoice":
      return d.digital_support.length ? d.digital_support.join(", ") : "Skipped"
    case "files": {
      const n = Object.values(d.documents).filter(Boolean).length
      return n ? `Uploaded ${n} document${n > 1 ? "s" : ""}` : "Skipped for now"
    }
    case "contact": {
      const vals = (q.fields || []).map(f => String(d[f.key] ?? "").trim()).filter(Boolean)
      return vals.length ? vals.join(" · ") : "Skipped"
    }
    case "date": return d.target_go_live || "Skipped"
    default:
      return q.key ? String(d[q.key] ?? "").trim() || "Skipped" : "Skipped"
  }
}

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

function FileUpload({ docKey, label, value, onChange }: {
  docKey: string; label: string; value: string; onChange: (key: string, url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setErr("")
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch(`${backendUrl}/store/uploads`, {
        method: "POST",
        body: fd,
        headers: { "x-publishable-api-key": publishableApiKey },
      })
      if (!res.ok) throw new Error("Upload failed")
      const json = await res.json()
      const url = json.files?.[0]?.url || json.url
      if (!url) throw new Error("No URL returned")
      onChange(docKey, url)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base p-3 text-sm">
      <p className="text-xs font-medium text-ui-fg-base mb-2">{label}</p>
      {value ? (
        <div className="flex items-center gap-2">
          <span className="text-ui-tag-green-text text-xs font-medium inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Uploaded
          </span>
          <button
            type="button"
            onClick={() => { onChange(docKey, ""); if (inputRef.current) inputRef.current.value = "" }}
            className="text-ui-tag-red-text text-xs underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-xs text-ui-fg-subtle hover:bg-ui-bg-field-hover transition-colors">
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="sr-only" />
          {uploading ? "Uploading…" : "+ Choose file"}
        </label>
      )}
      {err && <p className="text-ui-tag-red-text text-xs mt-1">{err}</p>}
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

function Composer({ q, data, set, setDoc, onSend, disabled }: {
  q: Question
  data: FormData
  set: Setter
  setDoc: (k: string, url: string) => void
  onSend: (chosen?: Partial<FormData>) => void
  disabled: boolean
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
  if (["text", "email", "tel", "date", "promo"].includes(q.type)) {
    const inputType = q.type === "promo" ? "text" : q.type === "text" ? "text" : q.type
    return (
      <div className={SHELL}>
        <input
          autoFocus
          type={inputType}
          value={String(data[q.key!] ?? "")}
          onChange={e => set(q.key!, q.type === "promo" ? e.target.value.toUpperCase() : e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={q.placeholder || "Type your answer…"}
          disabled={disabled}
          className={FIELD}
        />
        {send}
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
        {ORG_TYPES.map(t => {
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
              {t}
            </button>
          )
        })}
      </div>
    )
  }

  if (q.type === "yesno") {
    return (
      <div className="flex gap-2">
        {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(o => (
          <button
            key={o.l}
            type="button"
            disabled={disabled}
            onClick={() => onSend({ has_marketing_budget: o.v })}
            className="flex-1 rounded-xl border border-ui-border-base bg-ui-bg-field px-4 py-3 text-sm font-semibold text-ui-fg-base transition-all duration-200 hover:-translate-y-0.5 hover:border-[#432C63]/60 hover:text-[#432C63] hover:shadow-sm active:scale-95"
          >
            {o.l}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === "multichoice") {
    const values = data.digital_support
    const toggle = (v: string) =>
      set("digital_support", values.includes(v) ? values.filter(x => x !== v) : [...values, v])
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(q.options || []).map(opt => {
            const on = values.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-all duration-200 active:scale-95 ${
                  on ? "border-transparent text-white shadow-sm" : "border-ui-border-base text-ui-fg-base bg-ui-bg-field hover:border-[#432C63]/60"
                }`}
                style={on ? { background: `linear-gradient(135deg, ${BRAND}, #5a3d80)` } : undefined}
              >
                {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {opt}
              </button>
            )
          })}
        </div>
        <div className="flex justify-end">{send}</div>
      </div>
    )
  }

  if (q.type === "files") {
    const docList = ORG_DOCUMENTS[data.form_of_organization] || []
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
          {docList.map(doc => (
            <FileUpload key={doc.key} docKey={doc.key} label={doc.label} value={data.documents[doc.key] || ""} onChange={setDoc} />
          ))}
        </div>
        <div className="flex justify-end">{send}</div>
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
  add("Name", `${data.first_name} ${data.last_name}`, "names")
  add("Address", data.complete_address, "complete_address")
  add("Mobile", data.mobile_number, "mobile_number")
  add("Email", data.email, "email")
  add("Designation", data.designation, "designation")
  add("Target go-live", data.target_go_live, "target_go_live")
  add("Business", data.business_name, "business_name")
  add("Business address", data.business_address, "business_address")
  add("Business landline", data.business_landline, "business_contact")
  add("Business mobile", data.business_mobile, "business_contact")
  add("Business email", data.business_email, "business_contact")
  add("Category", data.merchant_category, "merchant_category")
  add("Activity", data.business_activity, "business_activity")
  add("Organization", data.form_of_organization, "form_of_organization")
  if (data.signatory_first_name || data.signatory_last_name)
    add("Signatory", [data.signatory_first_name, data.signatory_middle_name, data.signatory_last_name].filter(Boolean).join(" "), "signatory")
  add("Signatory email", data.signatory_email, "signatory_contact")
  add("Brand colors", data.brand_colors, "brand_colors")
  if (data.digital_support.length) add("Digital presence", data.digital_support.join(", "), "digital_support")
  if (data.has_marketing_budget !== null) add("Marketing budget", data.has_marketing_budget ? "Yes" : "No", "has_marketing_budget")
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
  const [error, setError] = useState("")
  const [editingQid, setEditingQid] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const set: Setter = (key, value) => setData(prev => ({ ...prev, [key]: value }))
  const setDoc = (key: string, url: string) =>
    setData(prev => ({ ...prev, documents: { ...prev.documents, [key]: url } }))

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
      if (q.hint) pushBot(<span className="text-ui-fg-subtle">{q.hint}</span>)
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
    const d: FormData = chosen ? { ...data, ...chosen } : data
    if (chosen) setData(d)
    if (!isValid(q, d)) return

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
            body: JSON.stringify(data),
          }),
      })
      if (result.ok) setPhase("success")
      else setError(result.message)
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

            {phase === "review" ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-ui-fg-subtle">By submitting, you agree to Maretinda's seller terms.</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: BRAND }}
                >
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </div>
            ) : activeQ && !botTyping ? (
              <>
                <Composer q={activeQ} data={data} set={set} setDoc={setDoc} onSend={handleSend} disabled={botTyping} />
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
