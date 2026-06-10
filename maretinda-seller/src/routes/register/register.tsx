import { useState, useRef, ChangeEvent } from "react"
import { Link } from "react-router-dom"
import { CircleHalfSolid, Moon, Sun } from "@medusajs/icons"
import { Input } from "@medusajs/ui"
import { useSignUpWithEmailPass } from "../../hooks/api"
import { backendUrl } from "../../lib/client/client"
import { useTheme } from "../../providers/theme-provider"

function MaretindaFlower({ color = "white", size = 44 }: { color?: string; size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size}>
      {[45, 135, 225, 315].map(angle => (
        <path
          key={angle}
          d="M16,17 C12.5,14 11,7.5 16,5 C21,7.5 19.5,14 16,17Z"
          fill={color}
          transform={`rotate(${angle},16,16)`}
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Constants
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
// Types
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
  password: "", confirm_password: "",
}

function getSteps(data: FormData) {
  const steps: { id: string; label: string }[] = [
    { id: "merchant", label: "Merchant Details" },
    { id: "business", label: "Business Profile" },
  ]
  if (NEEDS_SIGNATORY.includes(data.form_of_organization))
    steps.push({ id: "signatory", label: "Authorized Signatory" })
  if (data.form_of_organization)
    steps.push({ id: "documents", label: "Documents" })
  steps.push(
    { id: "branding", label: "Branding & Digital" },
    { id: "account", label: "Account Setup" },
  )
  return steps
}

// ---------------------------------------------------------------------------
// Theme toggle button
// ---------------------------------------------------------------------------

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${theme}`}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-ui-border-base bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-subtle-hover hover:text-ui-fg-base transition-colors"
    >
      {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "light" ? <Sun className="w-4 h-4" /> : <CircleHalfSolid className="w-4 h-4" />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// UI primitives — theme-aware via Medusa CSS variables
// ---------------------------------------------------------------------------

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ui-fg-base mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}


function RadioGroup({ name, options, value, onChange }: {
  name: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
            value === opt.value
              ? "border-[#432C63] bg-[#432C63]/10 text-[#432C63] font-medium"
              : "border-ui-border-base text-ui-fg-base bg-ui-bg-field hover:border-[#432C63]/60"
          }`}
        >
          <input type="radio" name={name} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="sr-only" />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function CheckboxGroup({ options, values, onChange }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (v: string) =>
    values.includes(v) ? onChange(values.filter(x => x !== v)) : onChange([...values, v])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label
          key={opt}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
            values.includes(opt)
              ? "border-[#432C63] bg-[#432C63]/10 text-[#432C63] font-medium"
              : "border-ui-border-base text-ui-fg-base bg-ui-bg-field hover:border-[#432C63]/60"
          }`}
        >
          <input type="checkbox" checked={values.includes(opt)} onChange={() => toggle(opt)} className="sr-only" />
          {values.includes(opt) ? "✓ " : ""}{opt}
        </label>
      ))}
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
      const res = await fetch(`${backendUrl}/store/uploads`, { method: "POST", body: fd })
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
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3 text-sm">
      <p className="text-xs font-medium text-ui-fg-base mb-2">{label}</p>
      {value ? (
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-xs font-medium">✓ Uploaded</span>
          <button
            type="button"
            onClick={() => { onChange(docKey, ""); if (inputRef.current) inputRef.current.value = "" }}
            className="text-red-500 text-xs underline"
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
      {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step panels
// ---------------------------------------------------------------------------

function StepMerchant({ data, set }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name" required>
          <Input value={data.first_name} onChange={e => set("first_name", e.target.value)} placeholder="Juan" />
        </Field>
        <Field label="Last Name" required>
          <Input value={data.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Dela Cruz" />
        </Field>
      </div>
      <Field label="Complete Address" required>
        <Input value={data.complete_address} onChange={e => set("complete_address", e.target.value)} placeholder="House No., Street, Barangay, City, Province, ZIP" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile Number" required>
          <Input value={data.mobile_number} onChange={e => set("mobile_number", e.target.value)} placeholder="+63 9XX XXX XXXX" />
        </Field>
        <Field label="Email Address" required>
          <Input type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="juan@example.com" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Designation / Position">
          <Input value={data.designation} onChange={e => set("designation", e.target.value)} placeholder="e.g. Owner, CEO" />
        </Field>
        <Field label="Target Go-Live Date">
          <Input type="date" value={data.target_go_live} onChange={e => set("target_go_live", e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

function StepBusiness({ data, set }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Business Name" required>
          <Input value={data.business_name} onChange={e => set("business_name", e.target.value)} placeholder="ABC Trading Co." />
        </Field>
        <Field label="Business TIN">
          <Input value={data.business_tin} onChange={e => set("business_tin", e.target.value)} placeholder="XXX-XXX-XXX-000" />
        </Field>
      </div>
      <Field label="Business Address" required>
        <Input value={data.business_address} onChange={e => set("business_address", e.target.value)} placeholder="Complete business address" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Landline">
          <Input value={data.business_landline} onChange={e => set("business_landline", e.target.value)} placeholder="(02) XXXX XXXX" />
        </Field>
        <Field label="Mobile">
          <Input value={data.business_mobile} onChange={e => set("business_mobile", e.target.value)} placeholder="+63 9XX XXX XXXX" />
        </Field>
        <Field label="Business Email">
          <Input type="email" value={data.business_email} onChange={e => set("business_email", e.target.value)} placeholder="biz@example.com" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Merchant Category">
          <Input value={data.merchant_category} onChange={e => set("merchant_category", e.target.value)} placeholder="e.g. Retail, Food & Beverage" />
        </Field>
        <Field label="Business Activity">
          <Input value={data.business_activity} onChange={e => set("business_activity", e.target.value)} placeholder="Main business activity" />
        </Field>
      </div>
      <Field label="Form of Organization" required>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {ORG_TYPES.map(t => (
            <label
              key={t}
              className={`flex items-center justify-center rounded-lg border px-2 py-2 text-xs cursor-pointer text-center transition-colors ${
                data.form_of_organization === t
                  ? "border-[#432C63] bg-[#432C63]/10 text-[#432C63] font-medium"
                  : "border-ui-border-base text-ui-fg-base bg-ui-bg-field hover:border-[#432C63]/60"
              }`}
            >
              <input type="radio" name="org_type" checked={data.form_of_organization === t} onChange={() => set("form_of_organization", t)} className="sr-only" />
              {t}
            </label>
          ))}
        </div>
      </Field>
    </div>
  )
}

function StepSignatory({ data, set }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-400">
        Authorized signatory for <strong>{data.form_of_organization}</strong>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="First Name" required>
          <Input value={data.signatory_first_name} onChange={e => set("signatory_first_name", e.target.value)} />
        </Field>
        <Field label="Middle Name">
          <Input value={data.signatory_middle_name} onChange={e => set("signatory_middle_name", e.target.value)} />
        </Field>
        <Field label="Last Name" required>
          <Input value={data.signatory_last_name} onChange={e => set("signatory_last_name", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Email">
          <Input type="email" value={data.signatory_email} onChange={e => set("signatory_email", e.target.value)} />
        </Field>
        <Field label="Landline">
          <Input value={data.signatory_landline} onChange={e => set("signatory_landline", e.target.value)} />
        </Field>
        <Field label="Mobile">
          <Input value={data.signatory_mobile} onChange={e => set("signatory_mobile", e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

function StepDocuments({ data, setDoc }: { data: FormData; setDoc: (k: string, url: string) => void }) {
  const docList = ORG_DOCUMENTS[data.form_of_organization] || []
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
        Upload documents for <strong>{data.form_of_organization}</strong>. These are optional at registration.
      </div>
      <div className="grid grid-cols-2 gap-3">
        {docList.map(doc => (
          <FileUpload key={doc.key} docKey={doc.key} label={doc.label} value={data.documents[doc.key] || ""} onChange={setDoc} />
        ))}
      </div>
      <p className="text-xs text-ui-fg-muted">Accepted formats: PDF, JPG, PNG (max 10 MB each)</p>
    </div>
  )
}

function StepBranding({ data, set }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Brand Colors">
        <Input value={data.brand_colors} onChange={e => set("brand_colors", e.target.value)} placeholder="e.g. #FF5733, Blue and White" />
      </Field>
      <Field label="Digital Presence / Marketing Channels">
        <CheckboxGroup options={DIGITAL_SUPPORT_OPTIONS} values={data.digital_support} onChange={v => set("digital_support", v)} />
      </Field>
      <Field label="Dedicated Marketing Budget?">
        <RadioGroup name="marketing_budget" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} value={data.has_marketing_budget === null ? "" : String(data.has_marketing_budget)} onChange={v => set("has_marketing_budget", v === "true")} />
      </Field>
    </div>
  )
}

function StepAccount({ data, set }: { data: FormData; set: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2 text-xs text-ui-fg-muted">
        Set a password for your seller account. Your email (<strong className="text-ui-fg-subtle">{data.email || "from Step 1"}</strong>) will be your login.
      </div>
      <Field label="Password" required>
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={data.password}
            onChange={e => set("password", e.target.value)}
            placeholder="At least 8 characters"
            className="pr-14"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      <Field label="Confirm Password" required>
        <Input
          type={show ? "text" : "password"}
          value={data.confirm_password}
          onChange={e => set("confirm_password", e.target.value)}
          placeholder="Re-enter your password"
        />
      </Field>
      {data.password && data.password.length < 8 && (
        <p className="text-red-500 text-xs">Password must be at least 8 characters.</p>
      )}
      {data.password && data.password.length >= 8 && data.confirm_password && data.password !== data.confirm_password && (
        <p className="text-red-500 text-xs">Passwords do not match.</p>
      )}
      {data.password && data.password.length >= 8 && data.confirm_password && data.password === data.confirm_password && (
        <p className="text-green-500 text-xs">Passwords match ✓</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step progress nav (compact horizontal)
// ---------------------------------------------------------------------------

function StepNav({ steps, current }: { steps: { id: string; label: string }[]; current: number }) {
  return (
    <div className="flex items-center overflow-x-auto pb-1 mb-5">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center shrink-0">
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap transition-colors ${
            i === current ? "bg-indigo-600 text-white" : i < current ? "text-indigo-500" : "text-ui-fg-muted"
          }`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
              i === current ? "bg-white/20" : i < current ? "bg-indigo-500/20" : "bg-ui-bg-subtle"
            }`}>
              {i < current ? "✓" : i + 1}
            </span>
            <span className={i !== current ? "hidden xl:inline" : ""}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-3 shrink-0 ${i < current ? "bg-indigo-500/40" : "bg-ui-border-base"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const Register = () => {
  const [data, setData] = useState<FormData>(INITIAL)
  const [stepIdx, setStepIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const { mutateAsync: signUp } = useSignUpWithEmailPass()

  const steps = getSteps(data)
  const currentStep = steps[stepIdx]

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function setDoc(key: string, url: string) {
    setData(prev => ({ ...prev, documents: { ...prev.documents, [key]: url } }))
  }

  function handleOrgChange(v: string) {
    set("form_of_organization", v)
    if (stepIdx > 1) setStepIdx(1)
  }

  function canNext(): boolean {
    switch (currentStep?.id) {
      case "merchant": return !!(data.first_name && data.last_name && data.complete_address && data.mobile_number && data.email)
      case "business": return !!(data.business_name && data.business_address && data.form_of_organization)
      case "signatory": return !!(data.signatory_first_name && data.signatory_last_name)
      case "documents": return true
      case "branding": return true
      case "account": return !!(data.password && data.confirm_password && data.password === data.confirm_password && data.password.length >= 8)
      default: return true
    }
  }

  async function handleSubmit() {
    if (data.password !== data.confirm_password) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await signUp({ name: data.business_name, email: data.email, password: data.password, confirmPassword: data.confirm_password })
      try {
        await fetch(`${backendUrl}/store/seller-application`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } catch {
        // account created; application submission best-effort
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ---- Success screen ----
  if (success) {
    return (
      <div className="min-h-dvh w-dvw flex items-center justify-center bg-ui-bg-base px-6">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-indigo-500/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-ui-fg-base mb-2">Registration submitted!</h2>
          <p className="text-ui-fg-subtle text-sm leading-relaxed mb-8">
            Thank you for applying to become a seller on Maretinda. Your application is under review.
            You will receive an email once your account is activated.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)" }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  // ---- Registration form ----
  return (
    <div className="min-h-dvh w-dvw flex">

      {/* Left panel — fixed dark branding (matches login.tsx) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo-m.png" alt="Maretinda" className="w-10 h-10 brightness-200" />
          <div>
            <span className="text-white text-2xl font-bold tracking-wide">Maretinda</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "#c7d2fe" }}>seller</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Start selling<br />on Maretinda<br />today
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
            Join our growing marketplace and reach thousands of customers across the Philippines.
          </p>
          <div className="mt-10 flex flex-col gap-3">
            {[
              { icon: <CheckCircle />, label: "Free to register & get started" },
              { icon: <RocketLaunch />, label: "Quick onboarding process" },
              { icon: <GlobeEurope />, label: "Reach customers nationwide" },
              { icon: <CurrencyDollar />, label: "Fast & secure payouts" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full text-white flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>{icon}</span>
                <span className="text-indigo-100 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step progress */}
        <div className="relative z-10">
          <p className="text-indigo-300 text-xs mb-2">Step {stepIdx + 1} of {steps.length}</p>
          <div className="flex gap-1 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= stepIdx ? "bg-white" : "bg-white/20"}`} />
            ))}
          </div>
          <p className="text-white text-sm font-semibold">{currentStep?.label}</p>
          <p className="text-indigo-300 text-xs mt-3">© {new Date().getFullYear()} Maretinda. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — theme-aware */}
      <div className="flex-1 flex flex-col bg-ui-bg-base overflow-y-auto">
        <div className="flex-1 flex flex-col px-8 py-10 max-w-[600px] mx-auto w-full">

          {/* Mobile logo + theme toggle row */}
          <div className="flex items-center justify-between mb-6">
            <div className="lg:hidden flex items-center gap-2">
              <img src="/logo-m.png" alt="Maretinda" className="w-8 h-8" />
              <span className="text-xl font-bold" style={{ color: "#6366f1" }}>Maretinda</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">seller</span>
            </div>
            <div className="ml-auto">
              <ThemeToggleButton />
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-indigo-500/10 text-indigo-500">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              seller Registration
            </div>
            <h2 className="text-2xl font-bold text-ui-fg-base mb-1">Create your seller account</h2>
            <p className="text-ui-fg-subtle text-sm">Step {stepIdx + 1} of {steps.length} — {currentStep?.label}</p>
          </div>

          {/* Step nav */}
          <StepNav steps={steps} current={stepIdx} />

          {/* Progress bar */}
          <div className="w-full bg-ui-bg-subtle rounded-full h-1 mb-6">
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)", width: `${Math.round(((stepIdx + 1) / steps.length) * 100)}%` }}
            />
          </div>

          {/* Step card */}
          <div className="bg-ui-bg-subtle rounded-xl border border-ui-border-base p-6 mb-4">
            <h3 className="text-sm font-semibold text-ui-fg-base mb-5">
              <span className="text-indigo-500">{stepIdx + 1}.</span> {currentStep?.label}
            </h3>

            {currentStep?.id === "merchant" && <StepMerchant data={data} set={set} />}
            {currentStep?.id === "business" && (
              <StepBusiness data={data} set={(k, v) => { if (k === "form_of_organization") handleOrgChange(v as string); else set(k, v) }} />
            )}
            {currentStep?.id === "signatory" && <StepSignatory data={data} set={set} />}
            {currentStep?.id === "documents" && <StepDocuments data={data} setDoc={setDoc} />}
            {currentStep?.id === "branding" && <StepBranding data={data} set={set} />}
            {currentStep?.id === "account" && <StepAccount data={data} set={set} />}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setStepIdx(i => i - 1); setError("") }}
              disabled={stepIdx === 0}
              className="rounded-lg border border-ui-border-base px-5 py-2 text-sm font-medium text-ui-fg-base bg-ui-bg-base hover:bg-ui-bg-subtle disabled:opacity-40 transition-colors"
            >
              ← Back
            </button>

            {stepIdx < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => { if (canNext()) { setStepIdx(i => i + 1); setError("") } }}
                disabled={!canNext()}
                className="rounded-lg px-6 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)" }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !canNext()}
                className="rounded-lg px-6 py-2 text-sm font-semibold text-white disabled:opacity-60 transition-all"
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" }}
              >
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <span className="text-ui-fg-subtle text-sm">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400 transition-colors">Sign In</Link>
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
