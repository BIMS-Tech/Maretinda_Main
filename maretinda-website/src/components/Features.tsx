import Image from "next/image";

// Every item maps to a section that exists in the seller panel today.
const groups = [
  {
    title: "Orders & buyers",
    desc: "See what needs fulfilling and shipping today, message buyers from the panel, and reply to reviews before they go cold.",
    items: ["Orders", "Customers", "Messages", "Reviews"],
  },
  {
    title: "Products & stock",
    desc: "List products with variants and photos, keep stock counts honest, and set special prices for specific buyer groups.",
    items: ["Products", "Inventory", "Price lists"],
  },
  {
    title: "Promotions",
    desc: "Run flash sales on the storefront, issue vouchers, and turn regulars into repeat orders with subscription products.",
    items: ["Flash sales", "Promotions", "Subscription products"],
  },
  {
    title: "Payments",
    desc: "GCash, InstaPay, QR Ph and cards through GiyaPay, plus cash on delivery. Payment status shows on every order.",
    items: ["GiyaPay", "Cash on delivery"],
  },
  {
    title: "Shipping",
    desc: "Set shipping options per region and book deliveries with Flying Tigers without leaving the panel.",
    items: ["Shipping", "Flying Tigers"],
  },
  {
    title: "Reels",
    desc: "Post short product videos. Buyers find them on your shop page and in the Reels feed on maretinda.com.",
    items: ["Seller reels"],
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-paper py-20 lg:py-28">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-12 gap-y-6 lg:gap-x-10 items-end">
          <div className="col-span-12 lg:col-span-7" data-aos>
            <p className="eyebrow text-brand-purple">The seller panel</p>
            <h2
              className="font-display text-ink mt-5 leading-[1.02] tracking-[-0.015em]"
              style={{ fontSize: "clamp(34px, 4.4vw, 58px)" }}
            >
              Your whole shop, run from one screen.
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-5 text-[16px] leading-[1.7] text-muted lg:pb-2" data-aos>
            No spreadsheets or chat threads to piece together. This is the actual seller
            panel at seller.maretinda.com, the one you sign in to after you register.
          </p>
        </div>

        {/* Real screenshot */}
        <div className="mt-12 lg:mt-16 relative" data-aos>
          <div className="absolute -inset-x-4 sm:-inset-x-6 lg:-inset-x-10 top-16 bottom-[-40px] plum-stripes rounded-[32px]" />
          <div className="relative rounded-2xl overflow-hidden bg-white border border-line shadow-[0_40px_80px_-40px_rgba(42,27,62,.6)]">
            <div className="flex items-center gap-1.5 px-4 h-9 border-b border-line bg-[#F7F5FA]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5DFEC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5DFEC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5DFEC]" />
              <span className="mx-auto text-[12px] text-muted">seller.maretinda.com/dashboard</span>
            </div>
            <Image
              src="/media/seller-dashboard.png"
              alt="Maretinda seller dashboard with total orders, revenue, reviews, actions required and a performance chart"
              width={2000}
              height={954}
              sizes="(min-width: 1240px) 1192px, 100vw"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Capability groups */}
        <div className="mt-24 lg:mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
          {groups.map((g, i) => (
            <div key={g.title} className="border-t border-ink/15 pt-6 pb-10" data-aos>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[20px] text-brand-purple/50 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[19px] font-semibold text-ink tracking-[-0.01em]">{g.title}</h3>
              </div>
              <p className="mt-3 text-[15px] leading-[1.7] text-muted">{g.desc}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <li key={item} className="text-[12px] font-medium text-brand-purple bg-brand-purple/[.07] px-2.5 py-1 rounded-md">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
