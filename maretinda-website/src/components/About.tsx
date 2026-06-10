import { FiCreditCard, FiBarChart2, FiTruck, FiSmartphone, FiShield, FiZap, FiArrowRight } from "react-icons/fi";

const pills = [
  { icon: FiCreditCard,  label: "Local Payments" },
  { icon: FiBarChart2,   label: "Smart Analytics" },
  { icon: FiTruck,       label: "Logistics Ready" },
  { icon: FiSmartphone,  label: "Mobile First" },
  { icon: FiShield,      label: "Secure & Trusted" },
  { icon: FiZap,         label: "Lightning Fast" },
];

export default function About() {
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Light dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(67,44,99,.055) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Visual */}
          <div data-aos="fade-right" className="relative h-[400px] lg:h-[440px]">
            {/* Main card */}
            <div
              className="absolute left-0 right-12 top-8 bottom-8 rounded-3xl p-9 flex flex-col justify-end overflow-hidden"
              style={{ background: "linear-gradient(150deg, #2A1B3E 0%, #432C63 55%, #5C3E88 100%)" }}
            >
              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage:"linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)", backgroundSize:"40px 40px" }} />

              {/* Floating glow */}
              <div className="absolute top-8 right-8 w-24 h-24 rounded-full"
                style={{ background:"radial-gradient(circle, rgba(255,197,51,.3), transparent 70%)", filter:"blur(20px)" }} />

              {/* Icon row */}
              <div className="flex gap-2.5 mb-5">
                {[FiShield, FiBarChart2, FiZap].map((Icon, i) => (
                  <div key={i}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.15)" }}
                  >
                    <Icon size={16} className="text-white/80" />
                  </div>
                ))}
              </div>
              <h3 className="font-display text-white text-xl font-bold mb-1.5">Your Digital Storefront</h3>
              <p className="text-white/58 text-[14px] leading-relaxed">Beautiful, fast, and conversion-optimized — ready in minutes.</p>
            </div>

            {/* Metric chips */}
            <div className="absolute left-44 top-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(67,44,99,.14)] px-5 py-4 text-center border border-[rgba(67,44,99,.07)]">
              <div className="font-display text-[22px] font-extrabold text-brand-purple">₱2.5B+</div>
              <div className="text-[12px] text-[#6B6480] font-medium mt-0.5">Total GMV</div>
            </div>
            <div className="absolute right-0 bottom-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(67,44,99,.14)] px-5 py-4 text-center border border-[rgba(67,44,99,.07)]">
              <div className="font-display text-[22px] font-extrabold text-brand-purple">2.5K+</div>
              <div className="text-[12px] text-[#6B6480] font-medium mt-0.5">sellers</div>
            </div>
          </div>

          {/* Content */}
          <div data-aos="fade-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-purple-mid bg-[rgba(92,62,136,.09)] border border-[rgba(92,62,136,.18)] px-3.5 py-1.5 rounded-full mb-4">
              About Maretinda
            </span>
            <h2
              className="font-display font-extrabold leading-tight mb-5"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.4rem)", letterSpacing: "-0.02em" }}
            >
              The Platform <span className="gradient-text">Built for Your Success</span>
            </h2>
            <p className="text-[#6B6480] text-[15px] leading-[1.75] mb-3.5">
              Maretinda is more than an e-commerce platform — it&apos;s your growth engine. Built from the ground up for Filipino entrepreneurs who understand local payment behaviors, logistics challenges, and what customers truly want.
            </p>
            <p className="text-[#6B6480] text-[15px] leading-[1.75] mb-7">
              Whether you&apos;re a solo artisan, a growing SME, or an established brand — Maretinda gives you enterprise-grade tools at prices that make sense for the Philippine market.
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {pills.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-full border cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ background:"#FDF2FF", color:"#432C63", borderColor:"rgba(92,62,136,.15)" }}
                >
                  <Icon size={13} />
                  {label}
                </span>
              ))}
            </div>

            <a
              href="#features"
              className="inline-flex items-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(67,44,99,.3)]"
              style={{ background: "linear-gradient(135deg,#432C63,#5C3E88,#7C3AED)" }}
            >
              Explore All Features
              <FiArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
