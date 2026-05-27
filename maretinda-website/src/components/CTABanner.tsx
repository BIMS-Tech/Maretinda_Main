import Image from "next/image";
import { FiArrowRight, FiMail } from "react-icons/fi";

export default function CTABanner() {
  return (
    <section className="relative py-24 overflow-hidden text-center">
      {/* Background */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(150deg, #1E1130 0%, #3D1A5E 45%, #5C3E88 100%)" }} />

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      {/* Orbs */}
      <div className="absolute rounded-full float-orb pointer-events-none"
        style={{ width:500, height:500, top:-180, right:-80,
          background:"radial-gradient(circle, rgba(255,197,51,.13), transparent 70%)", filter:"blur(80px)" }} />
      <div className="absolute rounded-full float-orb-rev pointer-events-none"
        style={{ width:360, height:360, bottom:-100, left:-60,
          background:"radial-gradient(circle, rgba(155,128,210,.18), transparent 70%)", filter:"blur(70px)" }} />

      {/* Horizontal glow line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none"
        style={{ background:"linear-gradient(to right, transparent, rgba(255,197,51,.2) 30%, rgba(155,128,210,.3) 50%, rgba(255,197,51,.2) 70%, transparent)" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        <div data-aos="zoom-in">
          {/* Logo */}
          <div className="relative h-9 w-[160px] mx-auto mb-8">
            <Image src="/Logo-maretinda-white.svg" alt="Maretinda" fill className="object-contain" />
          </div>

          {/* Label */}
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-white/60 px-4 py-1.5 rounded-full border border-white/12 mb-5"
            style={{ background:"rgba(255,255,255,.06)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow pulse-dot" />
            Join 2,500+ Filipino Vendors
          </div>

          <h2
            className="font-display font-extrabold text-white leading-tight mb-4 mx-auto"
            style={{ fontSize:"clamp(2rem,4.5vw,3.5rem)", letterSpacing:"-0.025em", maxWidth:640 }}
          >
            Ready to Build Your <span className="gradient-text-gold">Empire Online?</span>
          </h2>

          <p className="text-white/60 text-[15px] max-w-[480px] mx-auto mb-9 leading-relaxed">
            Your first 14 days are completely free. No credit card, no contracts — just your store, live and selling.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-3.5 rounded-full text-[#2A1B3E] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,197,51,.5)]"
              style={{ background:"linear-gradient(135deg,#FFC533,#F2B230)", boxShadow:"0 4px 18px rgba(255,197,51,.38)" }}
            >
              Start Free Trial
              <FiArrowRight size={15} />
            </a>
            <a
              href="mailto:sales@maretinda.com"
              className="inline-flex items-center gap-2 font-medium text-[15px] px-8 py-3.5 rounded-full text-white border border-white/22 hover:bg-white/8 hover:border-white/40 transition-all duration-200"
            >
              <FiMail size={15} />
              Talk to Sales
            </a>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {["No credit card required", "Cancel anytime", "14-day free trial"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[13px] text-white/45 font-medium">
                <span className="w-1 h-1 rounded-full bg-brand-yellow/60" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
