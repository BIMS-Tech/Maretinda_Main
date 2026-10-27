import { FiArrowRight } from "react-icons/fi";

import { SELLER_REGISTER_URL } from "@/lib/site";

const steps = [
  {
    title: "Register your shop",
    desc: "Create a seller account at seller.maretinda.com with your shop name and business details.",
  },
  {
    title: "List what you sell",
    desc: "Add products with photos, variants, prices and stock, then set how you ship.",
  },
  {
    title: "Take orders on maretinda.com",
    desc: "Buyers check out with GiyaPay or cash on delivery. You get the order in your panel, pack it, and hand it to the courier.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="plum-stripes text-white py-20 lg:py-28 overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-12 gap-y-6 lg:gap-x-10 items-end">
          <div className="col-span-12 lg:col-span-7" data-aos>
            <p className="eyebrow text-white/75">How it works</p>
            <h2
              className="font-display mt-5 leading-[1.02] tracking-[-0.015em]"
              style={{ fontSize: "clamp(34px, 4.4vw, 58px)" }}
            >
              From sign-up to <span className="text-brand-yellow italic">first order</span>, in three steps.
            </h2>
          </div>
        </div>

        <ol className="mt-14 lg:mt-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/15 rounded-[24px] overflow-hidden">
          {steps.map((s, i) => (
            <li key={s.title} className="bg-[#341F4E] p-7 sm:p-9 flex flex-col" data-aos>
              <span className="font-display text-brand-yellow leading-none" style={{ fontSize: "clamp(64px, 7vw, 96px)" }}>
                {i + 1}
              </span>
              <h3 className="mt-8 text-[20px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-white/72">{s.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5 justify-between" data-aos>
          <p className="text-[15px] text-white/75 max-w-[520px]">
            Stuck on a step? The help center on maretinda.com walks through each one, and our team
            answers seller questions by email.
          </p>
          <a
            href={SELLER_REGISTER_URL}
            className="inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded-full text-[15px] font-bold bg-brand-yellow text-brand-purple hover:bg-white transition-colors flex-shrink-0"
          >
            Register your shop <FiArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
