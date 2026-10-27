import Image from "next/image";
import { FiShoppingBag, FiTruck, FiMessageSquare, FiStar } from "react-icons/fi";

// Labels mirror the seller panel's "Actions required" panel.
const actions = [
  { icon: FiShoppingBag, label: "Orders to fulfill", count: 4, hot: true },
  { icon: FiTruck, label: "Orders to ship", count: 2 },
  { icon: FiStar, label: "Reviews to reply", count: 1 },
  { icon: FiMessageSquare, label: "Unread messages", count: 3 },
];

function PriceSticker({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute w-[96px] h-[96px] rounded-full bg-brand-yellow text-brand-purple flex flex-col items-center justify-center text-center shadow-[0_12px_24px_-10px_rgba(42,27,62,.5)] ${className}`}
    >
      <span className="font-display text-[30px] leading-none">₱0</span>
      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] mt-1 leading-tight">
        to open
        <br />
        your shop
      </span>
    </div>
  );
}

function ActionsCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-white border border-line shadow-[0_24px_48px_-24px_rgba(42,27,62,.45)] ${className}`}>
      <div className="px-4 pt-4 pb-3 border-b border-line">
        <p className="text-[13.5px] font-semibold text-ink">Actions required</p>
        <p className="text-[11.5px] text-muted">Items that need your attention</p>
      </div>
      <ul className="p-2 grid grid-cols-1 gap-1">
        {actions.map(({ icon: Icon, label, count, hot }) => (
          <li key={label} className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-paper">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold tabular-nums ${
                hot ? "bg-brand-yellow text-brand-purple" : "bg-[#F3F0F7] text-[#3D3748]"
              }`}
            >
              {count}
            </span>
            <span className="text-[13px] text-ink flex-1">{label}</span>
            <Icon size={14} className="text-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* A — one strong photo, a crisp seller-panel card pinned to it */
function Editorial() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] pb-10 sm:pb-0">
      <div className="absolute right-[18%] -top-6 bottom-24 -left-2 rounded-[28px] plum-stripes" />
      <figure className="relative ml-auto w-[88%] aspect-[4/5] rounded-[24px] overflow-hidden sand-stripes shadow-[0_30px_60px_-30px_rgba(42,27,62,.55)]">
        <Image
          src="/media/shop-groceries.png"
          alt="A paper bag and a basket full of fresh produce, bread and dairy"
          fill
          sizes="(min-width: 1024px) 460px, 88vw"
          className="object-contain object-[50%_22%] scale-[1.12] drop-shadow-[0_24px_24px_rgba(42,27,62,.22)]"
          priority
        />
        <figcaption className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 backdrop-blur px-3 py-1.5 text-[12px] font-semibold text-ink">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
          Selling now · Groceries
        </figcaption>
      </figure>
      <ActionsCard className="absolute left-0 bottom-0 sm:-bottom-6 w-[64%] sm:w-[58%]" />
      <PriceSticker className="right-[-2%] bottom-[22%] rotate-[8deg]" />
    </div>
  );
}

export default function HeroVisual() {
  return <Editorial />;
}
