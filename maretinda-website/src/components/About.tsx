import Image from "next/image";
import { FiArrowUpRight } from "react-icons/fi";

import { STORE_URL } from "@/lib/site";

const shops = [
  {
    src: "/media/shop-streetwear.jpg",
    alt: "A man in sunglasses, a red beanie and a printed denim jacket",
    label: "Streetwear & local labels",
    note: "Small-batch drops, thrifted finds, homegrown brands.",
    className: "lg:col-span-5 aspect-[4/5]",
    position: "object-[50%_40%]",
  },
  {
    src: "/media/shop-home.png",
    alt: "A grey upholstered armchair with two cushions",
    label: "Home & living",
    note: "Furniture, kitchenware and the little things that make a home.",
    className: "lg:col-span-7 aspect-[4/5] lg:aspect-auto",
    position: "object-contain p-10 sm:p-16",
    sand: true,
  },
  {
    src: "/media/shop-accessories.jpg",
    alt: "Black and white portrait of a woman in a wide-brim hat",
    label: "Accessories & statement pieces",
    note: "Hats, jewelry, bags — the things people search for by name.",
    className: "lg:col-span-12 aspect-[4/5] sm:aspect-[21/9]",
    position: "object-[50%_35%]",
  },
];

export default function About() {
  return (
    <section id="sellers" className="bg-white py-20 lg:py-28">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-12 gap-y-6 lg:gap-x-10 items-end mb-12 lg:mb-16">
          <div className="col-span-12 lg:col-span-7" data-aos>
            <p className="eyebrow text-brand-purple">Who sells here</p>
            <h2
              className="font-display text-ink mt-5 leading-[1.02] tracking-[-0.015em]"
              style={{ fontSize: "clamp(34px, 4.4vw, 58px)" }}
            >
              One marketplace for the shops Filipinos already love.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:pb-2" data-aos>
            <p className="text-[16px] leading-[1.7] text-muted">
              Your products sit next to every other local shop on maretinda.com, in one cart,
              with one checkout. Buyers come for one thing and leave with three.
            </p>
            <a
              href={STORE_URL}
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold text-brand-purple hover:underline underline-offset-4"
            >
              See what&apos;s selling on maretinda.com <FiArrowUpRight size={15} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {shops.map((s) => (
            <a
              key={s.label}
              href={`${STORE_URL}/categories`}
              className={`group relative rounded-[24px] overflow-hidden ${s.sand ? "sand-stripes" : "bg-[#111]"} ${s.className}`}
              data-aos
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className={`transition-transform duration-700 ease-out group-hover:scale-[1.03] ${s.position.startsWith("object-contain") ? s.position : `object-cover ${s.position}`}`}
              />
              <div
                className={`absolute inset-x-0 bottom-0 p-5 sm:p-7 flex items-end justify-between gap-4 ${
                  s.sand ? "" : "bg-gradient-to-t from-black/70 via-black/25 to-transparent pt-24"
                }`}
              >
                <div>
                  <h3 className={`font-display text-[26px] sm:text-[32px] leading-[1.05] ${s.sand ? "text-ink" : "text-white"}`}>
                    {s.label}
                  </h3>
                  <p className={`mt-1.5 text-[14px] ${s.sand ? "text-[#3D3748]" : "text-white/80"}`}>{s.note}</p>
                </div>
                <span
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                    s.sand ? "bg-brand-purple text-white" : "bg-white text-ink group-hover:bg-brand-yellow"
                  }`}
                >
                  <FiArrowUpRight size={18} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
