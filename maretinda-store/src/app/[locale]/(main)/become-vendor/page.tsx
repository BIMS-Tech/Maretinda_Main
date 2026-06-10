'use client';

import { ChangeEvent, useRef, useState } from 'react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND ||
  'http://localhost:9000';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

const DIGITAL_SUPPORT_OPTIONS = [
  'Website',
  'Facebook',
  'Instagram',
  'TikTok',
  'Twitter/X',
  'YouTube',
  'Email Newsletter',
  'SMS/Viber',
  'None',
];

const ORG_TYPES = [
  'Sole Proprietorship',
  'Corporation',
  'Partnership',
  'Cooperative',
  'Association',
  'Government',
  'Transportation',
  'Others',
];

const NEEDS_SIGNATORY = ['Corporation', 'Partnership', 'Cooperative', 'Association', 'Government'];

const ORG_DOCUMENTS: Record<string, { key: string; label: string }[]> = {
  'Sole Proprietorship': [
    { key: 'dti_registration', label: 'DTI Registration Certificate' },
    { key: 'mayors_permit', label: "Mayor's Business Permit" },
    { key: 'bir_certificate', label: 'BIR Certificate of Registration' },
    { key: 'valid_id', label: 'Valid Government ID' },
  ],
  Corporation: [
    { key: 'board_resolution', label: 'Board Resolution' },
    { key: 'articles_bylaws', label: 'Articles of Incorporation / By-Laws' },
    { key: 'sec_registration', label: 'SEC Registration Certificate' },
    { key: 'mayors_permit', label: "DTI / Mayor's Business Permit" },
    { key: 'bir_certificate', label: 'BIR Certificate of Registration' },
    { key: 'valid_id', label: 'Valid Government IDs of Signatories' },
  ],
  Partnership: [
    { key: 'partnership_agreement', label: 'Partnership Agreement' },
    { key: 'sec_registration', label: 'SEC Registration Certificate' },
    { key: 'mayors_permit', label: "Mayor's Business Permit" },
    { key: 'bir_certificate', label: 'BIR Certificate of Registration' },
    { key: 'valid_id', label: 'Valid Government IDs of Partners' },
  ],
  Cooperative: [
    { key: 'cda_registration', label: 'CDA Registration Certificate' },
    { key: 'bylaws', label: 'By-Laws' },
    { key: 'mayors_permit', label: "Mayor's Business Permit" },
    { key: 'bir_certificate', label: 'BIR Certificate of Registration' },
    { key: 'valid_id', label: 'Valid Government IDs' },
  ],
  Association: [
    { key: 'registration_certificate', label: 'Registration Certificate' },
    { key: 'bylaws', label: 'By-Laws / Constitution' },
    { key: 'board_resolution', label: 'Board Resolution' },
    { key: 'valid_id', label: 'Valid Government IDs of Officers' },
  ],
  Government: [
    { key: 'authorization_letter', label: 'Official Authorization Letter' },
    { key: 'valid_id', label: 'Government ID of Authorized Representative' },
  ],
  Transportation: [
    { key: 'business_permit', label: 'Business / Franchise Permit' },
    { key: 'bir_certificate', label: 'BIR Certificate of Registration' },
    { key: 'valid_id', label: 'Valid Government IDs' },
  ],
  Others: [
    { key: 'business_permit', label: 'Business Permit' },
    { key: 'bir_certificate', label: 'BIR Certificate of Registration' },
    { key: 'valid_id', label: 'Valid Government ID' },
  ],
};

interface FormData {
  first_name: string;
  last_name: string;
  complete_address: string;
  mobile_number: string;
  email: string;
  designation: string;
  target_go_live: string;
  business_name: string;
  business_address: string;
  business_landline: string;
  business_mobile: string;
  business_email: string;
  business_tin: string;
  form_of_organization: string;
  merchant_category: string;
  business_activity: string;
  signatory_first_name: string;
  signatory_middle_name: string;
  signatory_last_name: string;
  signatory_email: string;
  signatory_landline: string;
  signatory_mobile: string;
  documents: Record<string, string>;
  brand_colors: string;
  digital_support: string[];
  has_marketing_budget: boolean | null;
}

const INITIAL: FormData = {
  first_name: '',
  last_name: '',
  complete_address: '',
  mobile_number: '',
  email: '',
  designation: '',
  target_go_live: '',
  business_name: '',
  business_address: '',
  business_landline: '',
  business_mobile: '',
  business_email: '',
  business_tin: '',
  form_of_organization: '',
  merchant_category: '',
  business_activity: '',
  signatory_first_name: '',
  signatory_middle_name: '',
  signatory_last_name: '',
  signatory_email: '',
  signatory_landline: '',
  signatory_mobile: '',
  documents: {},
  brand_colors: '',
  digital_support: [],
  has_marketing_budget: null,
};

function getSteps(data: FormData) {
  const steps: { id: string; label: string }[] = [
    { id: 'merchant', label: 'Merchant Details' },
    { id: 'business', label: 'Business Profile' },
  ];
  if (NEEDS_SIGNATORY.includes(data.form_of_organization)) {
    steps.push({ id: 'signatory', label: 'Authorized Signatory' });
  }
  if (data.form_of_organization) {
    steps.push({ id: 'documents', label: 'Documents' });
  }
  steps.push({ id: 'branding', label: 'Branding & Digital' });
  return steps;
}

// ---------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 ${className || ''}`}
    />
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
    >
      {children}
    </select>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
            value === opt.value
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
            values.includes(opt)
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          }`}
        >
          <input
            type="checkbox"
            checked={values.includes(opt)}
            onChange={() => toggle(opt)}
            className="sr-only"
          />
          {values.includes(opt) ? '✓ ' : ''}
          {opt}
        </label>
      ))}
    </div>
  );
}

function FileUpload({
  docKey,
  label,
  value,
  onChange,
}: {
  docKey: string;
  label: string;
  value: string;
  onChange: (key: string, url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch(`${BACKEND_URL}/store/uploads`, {
        method: 'POST',
        body: fd,
        headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.files?.[0]?.url || data.url || data[0]?.url;
      if (!url) throw new Error('No URL returned');
      onChange(docKey, url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {value ? (
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-xs">✓ Uploaded</span>
          <button
            type="button"
            onClick={() => {
              onChange(docKey, '');
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="text-red-400 hover:text-red-600 text-xs underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFile}
            className="sr-only"
          />
          {uploading ? 'Uploading…' : '+ Choose file'}
        </label>
      )}
      {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
    </div>
  );
}

function StepNav({
  steps,
  current,
}: {
  steps: { id: string; label: string }[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1 mb-4 scrollbar-hide">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center shrink-0">
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap ${
              i === current
                ? 'bg-indigo-600 text-white'
                : i < current
                ? 'text-indigo-600'
                : 'text-gray-400'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                i === current
                  ? 'bg-white/20'
                  : i < current
                  ? 'bg-indigo-100'
                  : 'bg-gray-100'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className={i !== current ? 'hidden sm:inline' : ''}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-4 shrink-0 ${i < current ? 'bg-indigo-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step panels
// ---------------------------------------------------------------------------

function StepMerchant({
  data,
  set,
}: {
  data: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required>
          <Input
            value={data.first_name}
            onChange={(e) => set('first_name', e.target.value)}
            placeholder="Juan"
          />
        </Field>
        <Field label="Last Name" required>
          <Input
            value={data.last_name}
            onChange={(e) => set('last_name', e.target.value)}
            placeholder="Dela Cruz"
          />
        </Field>
      </div>
      <Field label="Complete Address" required>
        <Input
          value={data.complete_address}
          onChange={(e) => set('complete_address', e.target.value)}
          placeholder="Unit/House No., Street, Barangay, City, Province, ZIP Code"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Mobile Number" required>
          <Input
            value={data.mobile_number}
            onChange={(e) => set('mobile_number', e.target.value)}
            placeholder="+63 9XX XXX XXXX"
          />
        </Field>
        <Field label="Email Address" required>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="juan@example.com"
          />
        </Field>
        <Field label="Designation / Position">
          <Input
            value={data.designation}
            onChange={(e) => set('designation', e.target.value)}
            placeholder="e.g. Owner, CEO"
          />
        </Field>
      </div>
      <Field label="Target Go-Live Date">
        <Input
          type="date"
          value={data.target_go_live}
          onChange={(e) => set('target_go_live', e.target.value)}
          className="max-w-xs"
        />
      </Field>
    </div>
  );
}

function StepBusiness({
  data,
  set,
}: {
  data: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Business Name" required>
          <Input
            value={data.business_name}
            onChange={(e) => set('business_name', e.target.value)}
            placeholder="ABC Trading Co."
          />
        </Field>
        <Field label="Business TIN">
          <Input
            value={data.business_tin}
            onChange={(e) => set('business_tin', e.target.value)}
            placeholder="XXX-XXX-XXX-000"
          />
        </Field>
      </div>
      <Field label="Business Address" required>
        <Input
          value={data.business_address}
          onChange={(e) => set('business_address', e.target.value)}
          placeholder="Complete business address"
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Business Landline">
          <Input
            value={data.business_landline}
            onChange={(e) => set('business_landline', e.target.value)}
            placeholder="(02) XXXX XXXX"
          />
        </Field>
        <Field label="Business Mobile">
          <Input
            value={data.business_mobile}
            onChange={(e) => set('business_mobile', e.target.value)}
            placeholder="+63 9XX XXX XXXX"
          />
        </Field>
        <Field label="Business Email">
          <Input
            type="email"
            value={data.business_email}
            onChange={(e) => set('business_email', e.target.value)}
            placeholder="business@example.com"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Merchant Category">
          <Input
            value={data.merchant_category}
            onChange={(e) => set('merchant_category', e.target.value)}
            placeholder="e.g. Retail, Food & Beverage"
          />
        </Field>
        <Field label="Business Activity">
          <Input
            value={data.business_activity}
            onChange={(e) => set('business_activity', e.target.value)}
            placeholder="Describe your main business activity"
          />
        </Field>
      </div>
      <Field label="Form of Organization" required>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {ORG_TYPES.map((t) => (
            <label
              key={t}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                data.form_of_organization === t
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="org_type"
                checked={data.form_of_organization === t}
                onChange={() => set('form_of_organization', t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepSignatory({
  data,
  set,
}: {
  data: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
        Provide details of the authorized signatory representing your{' '}
        <span className="font-medium text-blue-700">{data.form_of_organization}</span>.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="First Name" required>
          <Input
            value={data.signatory_first_name}
            onChange={(e) => set('signatory_first_name', e.target.value)}
          />
        </Field>
        <Field label="Middle Name">
          <Input
            value={data.signatory_middle_name}
            onChange={(e) => set('signatory_middle_name', e.target.value)}
          />
        </Field>
        <Field label="Last Name" required>
          <Input
            value={data.signatory_last_name}
            onChange={(e) => set('signatory_last_name', e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email">
          <Input
            type="email"
            value={data.signatory_email}
            onChange={(e) => set('signatory_email', e.target.value)}
          />
        </Field>
        <Field label="Landline">
          <Input
            value={data.signatory_landline}
            onChange={(e) => set('signatory_landline', e.target.value)}
            placeholder="(02) XXXX XXXX"
          />
        </Field>
      </div>
      <Field label="Mobile Number">
        <Input
          value={data.signatory_mobile}
          onChange={(e) => set('signatory_mobile', e.target.value)}
          placeholder="+63 9XX XXX XXXX"
        />
      </Field>
    </div>
  );
}

function StepDocuments({
  data,
  setDoc,
}: {
  data: FormData;
  setDoc: (key: string, url: string) => void;
}) {
  const docList = ORG_DOCUMENTS[data.form_of_organization] || [];
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
        Please upload required documents for{' '}
        <span className="font-medium text-amber-700">{data.form_of_organization}</span>.
        All documents are optional at this stage — you may submit and provide them later upon request.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docList.map((doc) => (
          <FileUpload
            key={doc.key}
            docKey={doc.key}
            label={doc.label}
            value={data.documents[doc.key] || ''}
            onChange={setDoc}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">Accepted formats: PDF, JPG, PNG (max 10 MB per file)</p>
    </div>
  );
}

function StepBranding({
  data,
  set,
}: {
  data: FormData;
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Brand Colors">
        <Input
          value={data.brand_colors}
          onChange={(e) => set('brand_colors', e.target.value)}
          placeholder="e.g. #FF5733, Blue and White, Navy & Gold"
        />
      </Field>
      <Field label="Digital Presence / Marketing Channels">
        <CheckboxGroup
          options={DIGITAL_SUPPORT_OPTIONS}
          values={data.digital_support}
          onChange={(v) => set('digital_support', v)}
        />
      </Field>
      <Field label="Do you have a dedicated marketing budget?">
        <RadioGroup
          name="marketing_budget"
          options={[
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ]}
          value={data.has_marketing_budget === null ? '' : String(data.has_marketing_budget)}
          onChange={(v) => set('has_marketing_budget', v === 'true')}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BecomesellerPage() {
  const [data, setData] = useState<FormData>(INITIAL);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Recompute steps every render since they depend on form_of_organization
  const steps = getSteps(data);
  const currentStep = steps[stepIdx];

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function setDoc(key: string, url: string) {
    setData((prev) => ({ ...prev, documents: { ...prev.documents, [key]: url } }));
  }

  // When org type changes, reset step index to business step if we're ahead of it
  function handleOrgChange(v: string) {
    set('form_of_organization', v);
    // If user changes org type while on a step that may no longer exist, go back to business
    if (stepIdx > 1) setStepIdx(1);
  }

  function canNext(): boolean {
    switch (currentStep?.id) {
      case 'merchant':
        return !!(
          data.first_name &&
          data.last_name &&
          data.complete_address &&
          data.mobile_number &&
          data.email
        );
      case 'business':
        return !!(data.business_name && data.business_address && data.form_of_organization);
      case 'signatory':
        return !!(data.signatory_first_name && data.signatory_last_name);
      case 'documents':
        return true;
      case 'branding':
        return true;
      default:
        return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/store/seller-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Submission failed');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Success screen ----
  if (submitted) {
    return (
      <div className="bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4 py-20 min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
          <p className="text-gray-500 mb-2">
            Thank you for applying to become a seller on Maretinda.
          </p>
          <p className="text-gray-500 mb-6">
            Your request has been processed. We will review your application and activate your
            account shortly. You will receive a confirmation email once approved.
          </p>
          <a
            href="/"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            Back to Homepage
          </a>
        </div>
      </div>
    );
  }

  // ---- Form ----
  return (
    <div className="bg-gradient-to-b from-indigo-50 to-white py-10">
      <div className="mx-auto max-w-3xl px-4 pb-16">
        {/* Compact header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">seller Registration</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Step {stepIdx + 1} of {steps.length} — {currentStep?.label}
            </p>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Maretinda seller
          </span>
        </div>

        {/* Step nav */}
        <StepNav steps={steps} current={stepIdx} />

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1 mb-5">
          <div
            className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.round(((stepIdx + 1) / steps.length) * 100)}%` }}
          />
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            <span className="text-indigo-600">{stepIdx + 1}.</span> {currentStep?.label}
          </h2>

          {currentStep?.id === 'merchant' && <StepMerchant data={data} set={set} />}
          {currentStep?.id === 'business' && (
            <StepBusiness
              data={data}
              set={(k, v) => {
                if (k === 'form_of_organization') handleOrgChange(v as string);
                else set(k, v);
              }}
            />
          )}
          {currentStep?.id === 'signatory' && <StepSignatory data={data} set={set} />}
          {currentStep?.id === 'documents' && <StepDocuments data={data} setDoc={setDoc} />}
          {currentStep?.id === 'branding' && <StepBranding data={data} set={set} />}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button
            type="button"
            onClick={() => {
              setStepIdx((i) => i - 1);
              setError('');
            }}
            disabled={stepIdx === 0}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            ← Back
          </button>

          {stepIdx < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (canNext()) {
                  setStepIdx((i) => i + 1);
                  setError('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={!canNext()}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canNext()}
              className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
