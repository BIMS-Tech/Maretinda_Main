"use client";

import { FiUserPlus, FiShoppingBag, FiTrendingUp, FiArrowRight } from "react-icons/fi";
import { useState } from "react";

const steps = [
  {
    num: "01",
    icon: FiUserPlus,
    title: "Create Your Account",
    desc: "Sign up in 60 seconds. Tell us about your business, verify your identity, and you're in. No complicated forms, no waiting weeks.",
    accent: "#9B80D2",
  },
  {
    num: "02",
    icon: FiShoppingBag,
    title: "Build Your Store",
    desc: "Use our drag-and-drop store builder to create your perfect storefront. Upload products, set prices, and configure shipping — guided setup all the way.",
    accent: "#FFC533",
  },
  {
    num: "03",
    icon: FiTrendingUp,
    title: "Start Earning",
    desc: "Your store is live and visible to hundreds of thousands of shoppers. Manage orders from your dashboard and watch your revenue grow.",
    accent: "#4ADE80",
  },
];

export default function HowItWorks() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="relative py-24 bg-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(67,44,99,.045) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div data-aos="fade-up" className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-purple-mid bg-[rgba(92,62,136,.09)] border border-[rgba(92,62,136,.18)] px-3.5 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2
            className="font-display font-extrabold leading-tight mb-3"
            style={{ fontSize:"clamp(1.75rem,3vw,2.4rem)", letterSpacing:"-0.02em" }}
          >
            Go Live in <span className="gradient-text">3 Simple Steps</span>
          </h2>
          <p className="text-[#6B6480] text-[15px] max-w-[460px] mx-auto leading-relaxed">
            From signup to your first sale in under an hour. No technical skills needed.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14 max-w-3xl mx-auto md:max-w-none">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isHovered = hovered === i;
            return (
              <div
                key={step.num}
                data-aos="fade-up"
                data-aos-delay={String(i * 140)}
                className="relative group"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Connector */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-[52px] left-[calc(50%+48px)] right-[-calc(50%-48px)] h-px z-0"
                    style={{ background:`linear-gradient(to right, ${step.accent}55, transparent)`, width:"calc(100% - 96px)" }}
                  />
                )}

                <div
                  className="relative bg-white border rounded-3xl p-7 text-center transition-all duration-300 cursor-default"
                  style={{
                    borderColor: isHovered ? step.accent + "55" : "rgba(67,44,99,.09)",
                    boxShadow: isHovered ? `0 12px 36px ${step.accent}20` : "none",
                    transform: isHovered ? "translateY(-6px)" : "none",
                  }}
                >
                  {/* Step number */}
                  <div
                    className="absolute top-5 right-5 font-display font-extrabold text-[11px] tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background:`${step.accent}16`, color: step.accent }}
                  >
                    STEP {step.num}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-[72px] h-[72px] rounded-2xl mx-auto mb-5 flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isHovered
                        ? `linear-gradient(135deg, ${step.accent}, ${step.accent}cc)`
                        : `${step.accent}14`,
                      border: `1.5px solid ${step.accent}${isHovered ? "80" : "30"}`,
                      transform: isHovered ? "scale(1.08) rotate(-5deg)" : "none",
                    }}
                  >
                    <Icon
                      size={28}
                      style={{ color: isHovered ? "white" : step.accent }}
                    />
                  </div>

                  <h3 className="font-display font-bold text-[#1A1228] text-[17px] mb-2.5">{step.title}</h3>
                  <p className="text-[#6B6480] text-[14px] leading-[1.7]">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div data-aos="fade-up" className="text-center">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-3.5 rounded-full text-[#2A1B3E] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,197,51,.45)]"
            style={{ background:"linear-gradient(135deg,#FFC533,#F2B230)", boxShadow:"0 4px 16px rgba(255,197,51,.35)" }}
          >
            Launch My Store Today
            <FiArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
