import { FiArrowRight } from "react-icons/fi";

import HeroVisual from "./HeroVisual";
import { SELLER_REGISTER_URL } from "@/lib/site";

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

        {/* Visual */}
        <div className="col-span-12 lg:col-span-5 relative">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
