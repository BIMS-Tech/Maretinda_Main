"use client";

import { useState } from "react";
import { FiPlus, FiMinus, FiArrowRight } from "react-icons/fi";

const faqs = [
  {
    q: "What is Maretinda?",
    a: "Maretinda is the Philippines' premier multi-seller e-commerce platform. It enables entrepreneurs and businesses to create and manage their online stores, list products, accept payments, and reach hundreds of thousands of customers across the country.",
  },
  {
    q: "Do I need technical skills to use Maretinda?",
    a: "Not at all! Maretinda is designed to be used by anyone — from tech-savvy developers to business owners who are new to online selling. Our guided setup, drag-and-drop store builder, and intuitive dashboard mean you can launch a professional store without writing a single line of code.",
  },
  {
    q: "What payment methods are supported?",
    a: "All vendors on Maretinda process payments through GiyaPay — our integrated payment gateway. GiyaPay supports GCash, Maya (PayMaya), BPI, BDO, UnionBank, credit/debit cards (Visa, Mastercard), and over-the-counter payments at 7-Eleven and other payment centers nationwide. The same gateway and rates apply across all plans.",
  },
  {
    q: "How long does it take to set up my store?",
    a: "Most sellers complete their store setup within 1 hour. Our onboarding wizard guides you through each step — account creation, store customization, and product listing. You can go from signing up to your first sale the same day.",
  },
  {
    q: "Can I upgrade or downgrade my plan anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time from your vendor dashboard. When you upgrade, you'll be charged the prorated difference. When you downgrade, the credit will be applied to your next billing cycle. No penalties, no hassle.",
  },
  {
    q: "Are there transaction fees?",
    a: "Yes, a standard platform transaction fee applies to every sale across all plans. The rate is the same regardless of which plan you're on — there's no tiered pricing for transaction fees. This keeps things transparent and fair for every vendor on Maretinda.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Every plan comes with a 14-day free trial — no credit card required. You get full access to all features of your chosen plan. At the end of the trial, simply choose to subscribe and keep growing.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(67,44,99,.045) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-14 lg:gap-20 items-start">

          {/* Left sticky panel */}
          <div data-aos="fade-right" className="lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-purple-mid bg-[rgba(92,62,136,.09)] border border-[rgba(92,62,136,.18)] px-3.5 py-1.5 rounded-full mb-4">
              FAQ
            </span>
            <h2
              className="font-display font-extrabold leading-tight mb-4"
              style={{ fontSize:"clamp(1.75rem,3vw,2.4rem)", letterSpacing:"-0.02em" }}
            >
              Got Questions?{" "}
              <span className="gradient-text">We&apos;ve Got Answers.</span>
            </h2>
            <p className="text-[#6B6480] text-[15px] leading-relaxed mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is available 7 days a week, ready to help.
            </p>
            <a
              href="mailto:support@maretinda.com"
              className="inline-flex items-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full border-2 border-brand-purple text-brand-purple transition-all duration-200 hover:bg-brand-purple hover:text-white hover:-translate-y-0.5"
            >
              Contact Support
              <FiArrowRight size={14} />
            </a>

            {/* Decorative card */}
            <div
              className="mt-8 p-5 rounded-2xl"
              style={{ background:"linear-gradient(135deg,#F6F4FB,#FDF2FF)", border:"1px solid rgba(67,44,99,.1)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                {["MR","JD","AL"].map((init, i) => (
                  <div key={init}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                    style={{
                      background:["linear-gradient(135deg,#432C63,#9B80D2)","linear-gradient(135deg,#FFC533,#F2B230)","linear-gradient(135deg,#17A34A,#4ADE80)"][i],
                      marginLeft: i === 0 ? 0 : -8,
                    }}>
                    {init}
                  </div>
                ))}
                <span className="text-[12px] text-[#6B6480] font-medium ml-1">+2,497 sellers</span>
              </div>
              <p className="text-[13px] text-[#6B6480] leading-relaxed">
                Already selling on Maretinda and loving it. <strong className="text-brand-purple">Join them today.</strong>
              </p>
            </div>
          </div>

          {/* Accordion */}
          <div data-aos="fade-left" className="flex flex-col gap-2.5">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden border transition-all duration-200"
                  style={{
                    borderColor: isOpen ? "rgba(67,44,99,.22)" : "rgba(67,44,99,.08)",
                    boxShadow: isOpen ? "0 4px 20px rgba(67,44,99,.09)" : "none",
                    background: "white",
                  }}
                >
                  <button
                    className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left group"
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span
                      className="font-semibold text-[15px] transition-colors duration-200"
                      style={{ color: isOpen ? "#432C63" : "#1A1228" }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isOpen ? "#432C63" : "rgba(67,44,99,.08)",
                        transform: isOpen ? "rotate(0deg)" : "rotate(0deg)",
                      }}
                    >
                      {isOpen
                        ? <FiMinus size={14} className="text-white" />
                        : <FiPlus  size={14} style={{ color:"#432C63" }} />
                      }
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? 260 : 0 }}
                  >
                    <p className="px-6 pb-5 text-[14px] text-[#6B6480] leading-[1.75]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
