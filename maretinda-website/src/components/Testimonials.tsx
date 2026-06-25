import { FiStar } from "react-icons/fi";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarGradient: string;
  featured?: boolean;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "I went from selling in tiangge on weekends to running a full online business. Maretinda's flash sales feature tripled my income in just 3 months!",
    name: "Maria Reyes",
    role: "Fashion seller, Cebu City",
    initials: "MR",
    avatarGradient: "linear-gradient(135deg,#432C63,#9B80D2)",
  },
  {
    quote:
      "The analytics dashboard is incredible. I know exactly which products to restock, when to run promotions, and who my best customers are. It's like having a business consultant in your pocket.",
    name: "Jose Dela Cruz",
    role: "Electronics Seller, Manila",
    initials: "JD",
    avatarGradient: "linear-gradient(135deg,#FFC533,#F2B230)",
    featured: true,
  },
  {
    quote:
      "GiyaPay integration means my customers pay however they like — GCash, Maya, cards. My conversion rate jumped 40% the very first week after switching to Maretinda.",
    name: "Ana Lim",
    role: "Food Business Owner, Davao",
    initials: "AL",
    avatarGradient: "linear-gradient(135deg,#17A34A,#4ADE80)",
  },
];

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5 mb-5">
      {Array.from({ length: count }).map((_, i) => (
        <FiStar
          key={i}
          size={14}
          className="fill-current"
          style={{ color: "#FFC533" }}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-[#F6F4FB] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(67,44,99,.055) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div data-aos="fade-up" className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-purple-mid bg-[rgba(92,62,136,.09)] border border-[rgba(92,62,136,.18)] px-3.5 py-1.5 rounded-full mb-4">
            seller Stories
          </span>
          <h2
            className="font-display font-extrabold leading-tight"
            style={{ fontSize:"clamp(1.75rem,3vw,2.4rem)", letterSpacing:"-0.02em" }}
          >
            Real sellers, <span className="gradient-text">Real Results</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              data-aos="fade-up"
              data-aos-delay={String(i * 100)}
              className="rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1.5 grad-border"
              style={
                t.featured
                  ? {
                      background: "linear-gradient(150deg, #2A1B3E, #432C63 60%, #5C3E88)",
                      boxShadow: "0 16px 48px rgba(67,44,99,.32)",
                      transform: "scale(1.04)",
                    }
                  : {
                      background: "white",
                      border: "1px solid rgba(67,44,99,.08)",
                      boxShadow: "0 2px 16px rgba(67,44,99,.07)",
                    }
              }
            >
              <Stars />

              {/* Quote mark */}
              <div
                className="text-[56px] font-display leading-none mb-[-16px] mt-[-8px]"
                style={{ color: t.featured ? "rgba(255,197,51,.3)" : "rgba(67,44,99,.1)" }}
              >
                "
              </div>

              <p
                className="text-[14.5px] leading-[1.75] mb-7"
                style={{ color: t.featured ? "rgba(255,255,255,.78)" : "#6B6480" }}
              >
                {t.quote}
              </p>

              <div className="flex items-center gap-3.5 pt-4"
                style={{ borderTop: t.featured ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(67,44,99,.08)" }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[14px] text-white flex-shrink-0"
                  style={{ background: t.avatarGradient }}
                >
                  {t.initials}
                </div>
                <div>
                  <div
                    className="font-semibold text-[14px]"
                    style={{ color: t.featured ? "white" : "#1A1228" }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: t.featured ? "rgba(255,255,255,.5)" : "#6B6480" }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
