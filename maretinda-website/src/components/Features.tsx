import {
  FiZap, FiBarChart2, FiTag, FiRefreshCw, FiCreditCard,
  FiSmartphone, FiPackage, FiUsers, FiLock
} from "react-icons/fi";

interface Feature {
  icon: typeof FiZap;
  title: string;
  desc: string;
  tag: string;
  accent: string;
  wide?: boolean;
}

const features: Feature[] = [
  {
    icon: FiZap,
    title: "Blazing-Fast Storefront",
    desc: "Your store loads in under 1 second on any device. Higher speed = higher conversions. We handle all the optimization so you can focus on selling.",
    tag: "Performance",
    accent: "#FFC533",
    wide: true,
  },
  {
    icon: FiBarChart2,
    title: "Real-Time Analytics",
    desc: "Know exactly what's selling, who's buying, and where your revenue is coming from — live dashboard, zero delays.",
    tag: "Insights",
    accent: "#9B80D2",
  },
  {
    icon: FiTag,
    title: "Flash Sales & Vouchers",
    desc: "Run time-limited flash sales and issue discount vouchers to drive urgency and reward loyal buyers.",
    tag: "Promotions",
    accent: "#F87171",
  },
  {
    icon: FiRefreshCw,
    title: "Subscription Products",
    desc: "Turn one-time buyers into recurring revenue. Set up subscription boxes, memberships, and repeat deliveries effortlessly.",
    tag: "Revenue",
    accent: "#4ADE80",
  },
  {
    icon: FiCreditCard,
    title: "GiyaPay Integration",
    desc: "Accept GCash, Maya, bank transfers, and credit cards seamlessly. Filipino payment methods, natively supported.",
    tag: "Payments",
    accent: "#60A5FA",
  },
  {
    icon: FiSmartphone,
    title: "Mobile-First seller Panel",
    desc: "Manage your entire store from your phone. Process orders, update inventory, respond to customers — all from a beautifully designed mobile interface that's always with you.",
    tag: "Mobile",
    accent: "#A78BFA",
    wide: true,
  },
  {
    icon: FiPackage,
    title: "Smart Inventory",
    desc: "Auto-alerts on low stock, variant tracking, bulk uploads — inventory management that works as hard as you do.",
    tag: "Inventory",
    accent: "#FB923C",
  },
  {
    icon: FiUsers,
    title: "Multi-Staff Support",
    desc: "Add team members, manage roles and permissions, and collaborate with staff without sharing your main credentials.",
    tag: "Teams",
    accent: "#34D399",
  },
  {
    icon: FiLock,
    title: "Bank-Grade Security",
    desc: "SSL encryption, fraud detection, and PCI-DSS compliant payment processing. Your store and customers are always protected.",
    tag: "Security",
    accent: "#F472B6",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#F6F4FB] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(67,44,99,.055) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        {/* Header */}
        <div data-aos="fade-up" className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-purple-mid bg-[rgba(92,62,136,.09)] border border-[rgba(92,62,136,.18)] px-3.5 py-1.5 rounded-full mb-4">
            Platform Features
          </span>
          <h2
            className="font-display font-extrabold leading-tight mb-3"
            style={{ fontSize:"clamp(1.75rem,3vw,2.4rem)", letterSpacing:"-0.02em" }}
          >
            Everything You Need to <span className="gradient-text">Dominate Online</span>
          </h2>
          <p className="text-[#6B6480] text-[15px] max-w-[500px] mx-auto leading-relaxed">
            Powered by cutting-edge technology, designed with Filipino sellers in mind.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                data-aos="fade-up"
                data-aos-delay={String(i * 55)}
                className={`group bg-white rounded-3xl p-8 relative overflow-hidden border border-[rgba(67,44,99,.07)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(67,44,99,.13)] hover:-translate-y-1.5 grad-border ${f.wide ? "lg:col-span-2" : ""}`}
              >
                {/* Icon box */}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
                  style={{ background: `${f.accent}18`, border: `1.5px solid ${f.accent}35` }}
                >
                  <Icon size={19} style={{ color: f.accent }} />
                </div>

                <h3 className="font-display font-bold text-[#1A1228] text-[17px] mb-2.5">{f.title}</h3>
                <p className="text-[#6B6480] text-[14px] leading-[1.7] mb-4">{f.desc}</p>

                <span
                  className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background:`${f.accent}14`, color: f.accent }}
                >
                  {f.tag}
                </span>

                {/* Hover glow */}
                <div
                  className="absolute -bottom-14 -right-14 w-44 h-44 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background:`radial-gradient(circle, ${f.accent}18, transparent 70%)`, filter:"blur(24px)" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
