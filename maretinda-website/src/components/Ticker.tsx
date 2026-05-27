import { FiStar, FiZap, FiPackage, FiUsers, FiMapPin, FiShoppingBag } from "react-icons/fi";

const items = [
  { icon: FiShoppingBag, text: "2,500+ Active Vendors" },
  { icon: FiPackage,     text: "180,000+ Products Listed" },
  { icon: FiZap,         text: "₱2.5B+ in Sales Processed" },
  { icon: FiStar,        text: "4.9 / 5 Vendor Satisfaction" },
  { icon: FiZap,         text: "99.9% Platform Uptime" },
  { icon: FiMapPin,      text: "Serving All Philippine Regions" },
  { icon: FiUsers,       text: "520,000+ Happy Customers" },
];

const doubled = [...items, ...items];

export default function Ticker() {
  return (
    <div className="bg-brand-purple py-4 overflow-hidden relative z-10">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #432C63, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #432C63, transparent)" }} />

      <div className="overflow-hidden">
        <div className="ticker-track flex items-center gap-0 whitespace-nowrap" style={{ width: "max-content" }}>
          {doubled.map((item, i) => {
            const Icon = item.icon;
            return (
              <span key={i} className="inline-flex items-center gap-7 flex-shrink-0">
                <span className="inline-flex items-center gap-2 text-white/80 text-[13.5px] font-medium">
                  <Icon size={14} className="text-brand-yellow flex-shrink-0" />
                  {item.text}
                </span>
                <span className="text-brand-yellow/50 text-[10px]">◆</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
