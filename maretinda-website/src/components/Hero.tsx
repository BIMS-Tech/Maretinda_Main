import { FiArrowRight } from "react-icons/fi";

import HeroVisual from "./HeroVisual";
import Masked from "./Masked";
import { SELLER_REGISTER_URL } from "@/lib/site";

export default function Hero() {
  return (
    <section id="hero" className="relative bg-paper pt-[68px] overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12 lg:pt-20 pb-16 lg:pb-24 grid grid-cols-12 gap-y-14 lg:gap-x-10 items-center">
        {/* Copy */}
        <div className="col-span-12 lg:col-span-7">
          <p className="eyebrow text-brand-purple rise-in">Sell on Maretinda</p>

          <h1
            className="font-display text-ink mt-6 leading-[0.98] tracking-[-0.02em]"
            style={{ fontSize: "clamp(44px, 5.5vw, 80px)" }}
          >
            <Masked text="Open your shop." delay={80} />
            <br />
            <span className="text-brand-purple">
              <Masked text="Reach the" delay={260} />{" "}
              <span className="scribble">
                <Masked text="whole" delay={380} />
              </span>{" "}
              <Masked text="Philippines." delay={440} />
            </span>
          </h1>

          <p className="rise-in mt-7 text-[17px] leading-[1.65] text-muted max-w-[500px]" style={{ animationDelay: "520ms" }}>
            Maretinda is the marketplace where Filipino shops sell everything from palengke
            staples to local fashion. List your products, take GCash and card payments, and
            ship nationwide from one seller panel.
          </p>

          <div className="rise-in mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "640ms" }}>
            <a
              href={SELLER_REGISTER_URL}
              className="press inline-flex items-center gap-2 h-[52px] px-7 rounded-full text-[15px] font-bold bg-brand-yellow text-brand-purple hover:bg-brand-yellow-deep"
            >
              Start selling <FiArrowRight size={16} className="nudge" />
            </a>
            <a
              href="#how-it-works"
              className="press inline-flex items-center h-[52px] px-7 rounded-full text-[15px] font-semibold text-brand-purple border border-brand-purple/30 hover:border-brand-purple"
            >
              How it works
            </a>
          </div>

          <ul className="rise-in mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] font-medium text-[#3D3748]" style={{ animationDelay: "760ms" }}>
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
