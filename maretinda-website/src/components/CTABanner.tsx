import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";

import { SELLER_REGISTER_URL, SELLER_LOGIN_URL } from "@/lib/site";

export default function CTABanner() {
  return (
    <section className="bg-white pb-20 lg:pb-28">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="relative rounded-[32px] overflow-hidden sand-stripes grid grid-cols-12 items-stretch" data-aos>
          <div className="col-span-12 md:col-span-7 p-8 sm:p-12 lg:p-16 relative z-10">
            <p className="eyebrow text-brand-purple">Your first month is on us</p>
            <h2
              className="font-display text-ink mt-5 leading-[1] tracking-[-0.02em]"
              style={{ fontSize: "clamp(38px, 5vw, 68px)" }}
            >
              Your shop belongs on Maretinda.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.7] text-[#3D3748] max-w-[460px]">
              Register, list your first products, and start taking orders from buyers across the
              Philippines.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={SELLER_REGISTER_URL}
                className="inline-flex items-center gap-2 h-[52px] px-7 rounded-full text-[15px] font-bold bg-brand-purple text-white hover:bg-brand-purple-deep transition-colors"
              >
                Start selling <FiArrowRight size={16} />
              </a>
              <a
                href={SELLER_LOGIN_URL}
                className="inline-flex items-center h-[52px] px-6 text-[15px] font-semibold text-brand-purple hover:underline underline-offset-4"
              >
                I already have a shop
              </a>
            </div>
          </div>
          {/* Seller panel "Actions required" crop, tilted like a note pinned to the board */}
          <div className="hidden md:flex md:col-span-5 relative min-h-[380px] items-center">
            <div className="absolute left-0 right-[-12%] rounded-2xl overflow-hidden bg-white border border-line shadow-[0_30px_60px_-30px_rgba(42,27,62,.55)] -rotate-[3deg]">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/media/seller-dashboard.png"
                  alt=""
                  fill
                  sizes="45vw"
                  className="object-cover object-[45%_30%] scale-[1.6] origin-[30%_32%]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
