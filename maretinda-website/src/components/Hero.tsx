import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";

import { SELLER_REGISTER_URL, STORE_URL } from "@/lib/site";

export default function Hero() {
  return (
    <section id="hero" className="relative bg-paper pt-[68px] overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12 lg:pt-20 pb-16 lg:pb-24 grid grid-cols-12 gap-y-14 lg:gap-x-10 items-center">
        {/* Copy */}
        <div className="col-span-12 lg:col-span-7">
          <p className="eyebrow text-brand-purple">Sell on Maretinda</p>

          <h1
            className="font-display text-ink mt-6 leading-[0.98] tracking-[-0.02em]"
            style={{ fontSize: "clamp(44px, 5.5vw, 80px)" }}
          >
            Open your shop.
            <br />
            <span className="text-brand-purple">
              Reach the <span className="scribble">whole</span> Philippines.
            </span>
          </h1>

          <p className="mt-7 text-[17px] leading-[1.65] text-muted max-w-[500px]">
            Maretinda is the marketplace where Filipino shops sell everything from palengke
            staples to local fashion. List your products, take GCash and card payments, and
            ship nationwide from one seller panel.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={SELLER_REGISTER_URL}
              className="inline-flex items-center gap-2 h-[52px] px-7 rounded-full text-[15px] font-bold bg-brand-yellow text-brand-purple hover:bg-brand-yellow-deep transition-colors"
            >
              Start selling <FiArrowRight size={16} />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center h-[52px] px-7 rounded-full text-[15px] font-semibold text-brand-purple border border-brand-purple/30 hover:border-brand-purple transition-colors"
            >
              How it works
            </a>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] font-medium text-[#3D3748]">
            {["First month free", "No listing fees", "No commission on sales"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Collage */}
        <div className="col-span-12 lg:col-span-5 relative">
          <div className="relative mx-auto w-full max-w-[560px] aspect-[1/1.02]">
            {/* Sand panel, same surface as the storefront hero */}
            <div className="absolute right-0 top-0 w-[78%] h-[84%] rounded-[28px] sand-stripes" />

            {/* Main photo */}
            <figure className="absolute left-0 bottom-0 w-[72%] h-[82%] rounded-[24px] overflow-hidden shadow-[0_30px_60px_-30px_rgba(42,27,62,.55)]">
              <Image
                src="/media/shop-fashion.jpg"
                alt="A shopper in a floral blouse and pleated skirt"
                fill
                sizes="(min-width: 1024px) 400px, 72vw"
                className="object-cover object-[50%_30%]"
                priority
              />
              <figcaption className="absolute left-4 bottom-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-white/92 backdrop-blur px-4 py-3">
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Selling now</span>
                  <span className="block text-[14px] font-semibold text-ink">Fashion &amp; apparel</span>
                </span>
                <a
                  href={`${STORE_URL}/categories`}
                  className="text-[12.5px] font-bold text-brand-purple whitespace-nowrap hover:underline"
                >
                  Browse shops
                </a>
              </figcaption>
            </figure>

            {/* Real seller panel crop */}
            <div className="absolute right-0 lg:right-[-6%] top-[9%] w-[58%] rounded-2xl overflow-hidden bg-white border border-line shadow-[0_24px_50px_-24px_rgba(42,27,62,.5)] rotate-[1.5deg]">
              <div className="flex items-center gap-1.5 px-3 h-7 border-b border-line bg-[#F7F5FA]">
                <span className="w-2 h-2 rounded-full bg-[#E5DFEC]" />
                <span className="w-2 h-2 rounded-full bg-[#E5DFEC]" />
                <span className="w-2 h-2 rounded-full bg-[#E5DFEC]" />
                <span className="ml-2 text-[10px] text-muted truncate">seller.maretinda.com/dashboard</span>
              </div>
              <div className="relative aspect-[16/10]">
                <Image
                  src="/media/seller-dashboard.png"
                  alt="The Maretinda seller dashboard showing orders, revenue and actions required"
                  fill
                  sizes="(min-width: 1024px) 330px, 58vw"
                  className="object-cover object-left-top scale-[1.9] origin-[12%_0%]"
                />
              </div>
            </div>

            {/* Price sticker */}
            <div className="absolute left-[-3%] top-[8%] w-[104px] h-[104px] rounded-full bg-brand-purple text-white flex flex-col items-center justify-center text-center -rotate-[10deg] shadow-lg">
              <span className="font-display text-[30px] leading-none text-brand-yellow">₱0</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] mt-1 leading-tight">
                to open
                <br />
                your shop
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
