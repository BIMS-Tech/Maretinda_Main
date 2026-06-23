"use client";

import { useState } from "react";
import { FiCheck, FiMinus, FiArrowRight, FiSun, FiTrendingUp, FiAward, FiClock } from "react-icons/fi";

interface PlanFeature { text: string; included: boolean; comingSoon?: boolean }
interface Plan {
  icon: typeof FiSun;
  tier: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  cta: string;
  style: "outline" | "cta" | "primary";
  featured?: boolean;
}

const plans: Plan[] = [
  {
    icon: FiSun,
    tier: "Starter",
    name: "Foundation",
    tagline: "Perfect to get started",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Get Started Free",
    style: "outline",
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
      { text: "Dedicated account manager", included: false },
      { text: "3D Model Generation", included: false },
    ],
  },
  {
    icon: FiTrendingUp,
    tier: "Growth",
    name: "Boost",
    tagline: "For scaling businesses",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Start Growing Now",
    style: "cta",
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
      { text: "Dedicated account manager", included: false },
      { text: "3D Model Generation", included: false },
    ],
  },
  {
    icon: FiAward,
    tier: "Premium",
    name: "Managed",
    tagline: "For high-volume brands",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Contact Sales",
    style: "primary",
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
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background:`radial-gradient(ellipse 60% 40% at 0% 100%, rgba(67,44,99,.04) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 40% at 100% 0%, rgba(255,197,51,.05) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div data-aos="fade-up" className="text-center mb-9">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-purple-mid bg-[rgba(92,62,136,.09)] border border-[rgba(92,62,136,.18)] px-3.5 py-1.5 rounded-full mb-4">
            Vendor Plans
          </span>
          <h2
            className="font-display font-bold leading-tight mb-3"
            style={{ fontSize:"clamp(1.75rem,3vw,2.4rem)", letterSpacing:"-0.02em" }}
          >
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-[#6B6480] text-[15px] max-w-[500px] mx-auto leading-relaxed">
            All plans include a 14-day free trial — no credit card required.
          </p>
        </div>

        {/* Billing toggle */}
        <div data-aos="fade-up" className="flex items-center justify-center gap-3.5 mb-12">
          <span className={`text-[14px] font-medium transition-colors ${!annual ? "text-brand-purple font-semibold" : "text-[#6B6480]"}`}>
            Monthly
          </span>
          <label className="relative w-[48px] h-[26px] cursor-pointer">
            <input type="checkbox" className="sr-only" checked={annual} onChange={(e) => setAnnual(e.target.checked)} />
            <span className="absolute inset-0 rounded-full transition-colors duration-300"
              style={{ background: annual ? "#432C63" : "#C8C2D8" }} />
            <span className="absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
              style={{ transform: annual ? "translateX(22px)" : "none" }} />
          </label>
          <span className={`text-[14px] font-medium transition-colors ${annual ? "text-brand-purple font-semibold" : "text-[#6B6480]"}`}>
            Annual
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full align-middle"
              style={{ background:"#FFC533", color:"#2A1B3E" }}>
              Save 20%
            </span>
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.name}
                data-aos="fade-up"
                data-aos-delay={String(i * 130)}
                className="rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 relative"
                style={
                  plan.featured
                    ? { border:"2px solid #432C63", boxShadow:"0 8px 40px rgba(67,44,99,.22)", transform:"scale(1.04)" }
                    : { border:"1.5px solid rgba(67,44,99,.1)" }
                }
              >
                {plan.featured && (
                  <div className="absolute top-5 right-5 z-10 text-[11px] font-bold tracking-wider px-3 py-1 rounded-full"
                    style={{ background:"linear-gradient(135deg,#FFC533,#F2B230)", color:"#2A1B3E" }}>
                    Most Popular
                  </div>
                )}

                {/* Card header */}
                <div
                  className="px-8 pt-9 pb-7"
                  style={
                    plan.featured
                      ? { background:"linear-gradient(150deg,#2A1B3E,#432C63 60%,#5C3E88)" }
                      : { background:"linear-gradient(135deg,#F6F4FB,#fff)" }
                  }
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                    style={
                      plan.featured
                        ? { background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)" }
                        : { background:"rgba(67,44,99,.09)", border:"1px solid rgba(67,44,99,.13)" }
                    }
                  >
                    <Icon size={19} style={{ color: plan.featured ? "#FFC533" : "#432C63" }} />
                  </div>

                  {/* Tier label */}
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: plan.featured ? "rgba(255,197,51,.7)" : "#9B80D2" }}>
                    {plan.tier}
                  </p>

                  <h3 className="font-display font-bold text-[22px] mb-0.5"
                    style={{ color: plan.featured ? "white" : "#1A1228" }}>
                    {plan.name}
                  </h3>
                  <p className="text-[13px] mb-6" style={{ color: plan.featured ? "rgba(255,255,255,.55)" : "#6B6480" }}>
                    {plan.tagline}
                  </p>

                  <div className="flex items-end gap-0.5 leading-none">
                    <span className="text-[20px] font-bold pb-1.5" style={{ color: plan.featured ? "#FFC533" : "#432C63" }}>₱</span>
                    <span
                      className="font-display font-bold"
                      style={{ fontSize:"clamp(2.5rem,4vw,3.25rem)", letterSpacing:"-0.03em", color: plan.featured ? "white" : "#1A1228" }}
                    >
                      {price.toLocaleString("en-PH")}
                    </span>
                    <span className="text-[13px] pb-1.5 ml-1" style={{ color: plan.featured ? "rgba(255,255,255,.5)" : "#6B6480" }}>
                      /mo
                    </span>
                  </div>
                  {annual && (
                    <p className="text-[12px] mt-1.5" style={{ color: plan.featured ? "rgba(255,255,255,.4)" : "#6B6480" }}>
                      Billed ₱{(plan.annualPrice * 12).toLocaleString("en-PH")}/year
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height:1, background: plan.featured ? "rgba(255,255,255,.1)" : "rgba(67,44,99,.07)" }} />

                {/* Features */}
                <div className="px-8 py-7 bg-white flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <div key={f.text} className="flex items-start gap-2.5 text-[13.5px]">
                      <span
                        className="w-4.5 h-4.5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                        style={{
                          background: f.comingSoon
                            ? "rgba(255,197,51,.15)"
                            : f.included
                              ? "rgba(23,163,74,.1)"
                              : "rgba(163,163,163,.1)",
                        }}
                      >
                        {f.comingSoon
                          ? <FiClock size={10} style={{ color:"#F2B230" }} />
                          : f.included
                            ? <FiCheck size={10} style={{ color:"#17A34A" }} />
                            : <FiMinus size={10} style={{ color:"#C4C4C4" }} />
                        }
                      </span>
                      <span style={{ color: f.included ? "#2C2840" : "#C4C4C4" }}>
                        {f.text}
                        {f.comingSoon && (
                          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full align-middle"
                            style={{ background:"rgba(255,197,51,.18)", color:"#B8860B" }}>
                            Soon
                          </span>
                        )}
                      </span>
                    </div>
                  ))}

                  <div className="mt-3">
                    {plan.style === "cta" && (
                      <a href="#" className="flex items-center justify-center gap-1.5 w-full font-semibold text-[14px] py-3.5 rounded-full text-[#2A1B3E] transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background:"linear-gradient(135deg,#FFC533,#F2B230)", boxShadow:"0 4px 16px rgba(255,197,51,.35)" }}>
                        {plan.cta} <FiArrowRight size={14} />
                      </a>
                    )}
                    {plan.style === "outline" && (
                      <a href="#" className="flex items-center justify-center gap-1.5 w-full font-semibold text-[14px] py-3.5 rounded-full border-2 border-brand-purple text-brand-purple transition-all duration-200 hover:bg-brand-purple hover:text-white hover:-translate-y-0.5">
                        {plan.cta} <FiArrowRight size={14} />
                      </a>
                    )}
                    {plan.style === "primary" && (
                      <a href="#" className="flex items-center justify-center gap-1.5 w-full font-semibold text-[14px] py-3.5 rounded-full text-white transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background:"linear-gradient(135deg,#432C63,#5C3E88,#7C3AED)", boxShadow:"0 4px 14px rgba(67,44,99,.25)" }}>
                        {plan.cta} <FiArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div data-aos="fade-up" className="flex items-center justify-center gap-2 mt-9 text-[13px] text-[#6B6480]">
          <FiCheck size={15} style={{ color:"#9B80D2" }} />
          All plans include 14-day free trial · No credit card required · Cancel anytime · Prices in Philippine Pesos (₱) + VAT
        </div>
      </div>
    </section>
  );
}
