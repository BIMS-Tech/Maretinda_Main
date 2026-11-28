import { FiCheck, FiMinus, FiArrowRight } from "react-icons/fi";
import Masked from "./Masked";

import { SELLER_REGISTER_URL } from "@/lib/site";

interface PlanFeature { text: string; included: boolean; comingSoon?: boolean }
interface Plan {
  name: string;
  tagline: string;
  /** Pesos, as the seller panel charges them. Yearly is ten months' worth. */
  monthlyPrice: number;
  yearlyPrice: number;
  /** Only Growth starts with a free month (owner's decision, 28 November 2026). */
  freeMonth?: boolean;
  features: PlanFeature[];
  cta: string;
  featured?: boolean;
}

// Mirrors the plans in the seller panel (subscription_plan and its features)
const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Perfect to get started",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    cta: "Get started",
    features: [
      { text: "Up to 50 products", included: true },
      { text: "Basic analytics dashboard", included: true },
      { text: "Standard storefront", included: true },
      { text: "1 staff account", included: true },
      { text: "GiyaPay payments", included: true },
      { text: "Inventory management", included: true },
      { text: "Email support", included: true },
      { text: "Flash sales & vouchers", included: false },
      { text: "Subscription products", included: false },
      { text: "3D Model Generation", included: false },
      { text: "AI seller agent", included: false },
    ],
  },
  {
    name: "Growth",
    tagline: "For scaling businesses",
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    freeMonth: true,
    cta: "Start your free month",
    featured: true,
    features: [
      { text: "Up to 500 products", included: true },
      { text: "Advanced analytics & reports", included: true },
      { text: "Standard storefront", included: true },
      { text: "5 staff accounts", included: true },
      { text: "GiyaPay payments", included: true },
      { text: "Smart inventory + alerts", included: true },
      { text: "Priority email & live chat", included: true },
      { text: "Flash sales & vouchers", included: true },
      { text: "Subscription products", included: true },
      { text: "3D Model Generation", included: true, comingSoon: true },
      { text: "AI seller agent", included: false },
    ],
  },
  {
    name: "Premium",
    tagline: "For high-volume brands",
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    cta: "Choose Premium",
    features: [
      { text: "Unlimited products", included: true },
      { text: "Full analytics suite + exports", included: true },
      { text: "Standard storefront", included: true },
      { text: "15 staff accounts", included: true },
      { text: "GiyaPay payments", included: true },
      { text: "Advanced inventory + forecasting", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Flash sales & vouchers", included: true },
      { text: "Subscription products", included: true },
      { text: "99.9% SLA guarantee", included: true },
      { text: "3D Model Generation", included: true, comingSoon: true },
      { text: "AI seller agent", included: true, comingSoon: true },
    ],
  },
];

const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

export default function Pricing() {
  return (
    <section id="pricing" className="bg-paper py-20 lg:py-28">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-12 gap-y-6 lg:gap-x-10 items-end">
          <div className="col-span-12 lg:col-span-7" data-aos>
            <p className="eyebrow text-brand-purple">Seller plans</p>
            <h2
              className="font-display text-ink mt-5 leading-[1.02] tracking-[-0.015em]"
              style={{ fontSize: "clamp(34px, 4.4vw, 58px)" }}
            >
              <Masked text="A flat monthly plan. Never a cut of your sales." />
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-5 text-[16px] leading-[1.7] text-muted lg:pb-2" data-aos>
            Maretinda runs on subscriptions, not commission. Pick the plan that fits your catalog
            today and switch any time from your seller panel.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
          {plans.map((plan) => {
            const dark = plan.featured;
            return (
              <div
                key={plan.name}
                data-aos
                className={`lift relative rounded-[24px] p-7 sm:p-8 flex flex-col ${
                  dark ? "bg-brand-purple text-white" : "bg-white border border-line"
                }`}
              >
                <div className="flex min-h-[26px] items-center justify-between gap-2">
                  <h3 className={`font-display text-[34px] leading-none ${dark ? "text-white" : "text-ink"}`}>{plan.name}</h3>
                  {plan.featured && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-yellow text-brand-purple">
                      Most popular
                    </span>
                  )}
                </div>
                <p className={`text-[14px] mt-2 ${dark ? "text-white/70" : "text-muted"}`}>{plan.tagline}</p>

                <div className={`mt-7 pb-7 border-b ${dark ? "border-white/15" : "border-line"}`}>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display leading-none ${dark ? "text-brand-yellow" : "text-brand-purple"}`} style={{ fontSize: 56 }}>
                      {peso(plan.monthlyPrice)}
                    </span>
                    <span className={`text-[14px] ${dark ? "text-white/60" : "text-muted"}`}>/ month</span>
                  </div>
                  <p className={`mt-2 text-[13px] ${dark ? "text-white/65" : "text-muted"}`}>
                    or {peso(plan.yearlyPrice)} a year (save 17%)
                  </p>
                  {plan.freeMonth ? (
                    <p className="mt-3 inline-flex h-[26px] items-center rounded-full bg-brand-yellow px-3 text-[12px] font-bold text-brand-purple">
                      First month free
                    </p>
                  ) : (
                    <p className={`mt-3 flex h-[26px] items-center text-[12px] ${dark ? "text-white/55" : "text-muted"}`}>
                      Paid from the first day
                    </p>
                  )}
                </div>

                <ul className="mt-6 flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className={`flex items-start gap-2.5 text-[14px] ${
                        f.included ? (dark ? "text-white/90" : "text-[#2C2840]") : dark ? "text-white/35" : "text-[#B9B4C2]"
                      }`}
                    >
                      {f.included ? (
                        <FiCheck size={15} className={`mt-0.5 flex-shrink-0 ${dark ? "text-brand-yellow" : "text-brand-purple"}`} />
                      ) : (
                        <FiMinus size={15} className="mt-0.5 flex-shrink-0" />
                      )}
                      <span>
                        {f.text}
                        {f.comingSoon && (
                          <span
                            className={`ml-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded align-middle ${
                              dark ? "bg-brand-yellow text-brand-purple" : "bg-brand-yellow/25 text-[#8A6100]"
                            }`}
                          >
                            Soon
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={SELLER_REGISTER_URL}
                  className={`press mt-8 inline-flex items-center justify-center gap-2 h-12 rounded-full text-[14px] font-bold ${
                    dark
                      ? "bg-brand-yellow text-brand-purple hover:bg-white"
                      : "border border-brand-purple/30 text-brand-purple hover:border-brand-purple hover:bg-brand-purple hover:text-white"
                  }`}
                >
                  {plan.cta} <FiArrowRight size={14} className="nudge" />
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-[13.5px] text-muted text-center" data-aos>
          First month free on Growth · No listing fees · No commission on sales · Payment
          processing fees may apply · Prices in Philippine pesos
        </p>
      </div>
    </section>
  );
}
