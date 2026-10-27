import Image from "next/image";
import { FiFacebook, FiInstagram, FiArrowUpRight } from "react-icons/fi";
import { RiTiktokLine } from "react-icons/ri";

import {
  BIR_RSN,
  BIR_SEAL_SRC,
  CONTACT_EMAIL,
  HELP_CENTER_URL,
  OFFICE_ADDRESS,
  OPERATOR_NAME,
  PRIVACY_URL,
  SELLER_LOGIN_URL,
  SELLER_REGISTER_URL,
  SOCIAL_LINKS,
  STORE_URL,
  TERMS_URL,
} from "@/lib/site";

const columns = [
  {
    title: "Sell",
    links: [
      { label: "Start selling", href: SELLER_REGISTER_URL },
      { label: "Seller sign in", href: SELLER_LOGIN_URL },
      { label: "Seller panel", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Maretinda", href: "/#sellers" },
      { label: "Blog", href: "/blogs" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact us", href: "/contact" },
    ],
  },
  {
    title: "Shop",
    links: [
      { label: "maretinda.com", href: STORE_URL },
      { label: "Categories", href: `${STORE_URL}/categories` },
      { label: "Flash sales", href: `${STORE_URL}/flash-sale` },
      { label: "Help center", href: HELP_CENTER_URL },
    ],
  },
];

const socialIcons = { Facebook: FiFacebook, Instagram: FiInstagram, TikTok: RiTiktokLine } as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-footer text-white">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10 pt-16 pb-14">
          <div className="col-span-2 md:col-span-5 lg:col-span-4">
            <a href="/" className="relative block h-9 w-[160px]" aria-label="Maretinda for sellers — home">
              <Image src="/Logo-maretinda-white.svg" alt="Maretinda" fill className="object-contain object-left" />
            </a>
            <p className="mt-5 text-[14.5px] leading-[1.7] text-white/65 max-w-[340px]">
              The Philippine marketplace for local shops. Open yours, list your products, and sell
              to buyers nationwide.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href={SELLER_REGISTER_URL}
                className="inline-flex items-center h-10 px-5 rounded-full text-[13.5px] font-bold bg-brand-yellow text-brand-purple hover:bg-white transition-colors"
              >
                Start selling
              </a>
              <a
                href={STORE_URL}
                className="inline-flex items-center gap-1 h-10 px-5 rounded-full text-[13.5px] font-semibold border border-white/25 hover:border-white transition-colors"
              >
                Shop Maretinda <FiArrowUpRight size={14} />
              </a>
            </div>
            {SOCIAL_LINKS.length > 0 && (
              <div className="mt-6 flex items-center gap-4">
                {SOCIAL_LINKS.map(({ label, href }) => {
                  const Icon = socialIcons[label as keyof typeof socialIcons];
                  return (
                    <a key={label} href={href} aria-label={label} className="text-white/80 hover:text-brand-yellow transition-colors">
                      <Icon size={22} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h4 className="text-[15px] font-semibold text-white">{col.title}</h4>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[14.5px] text-white/70 hover:text-brand-yellow transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-12 lg:col-span-2">
            <h4 className="text-[15px] font-semibold text-white">Visit us</h4>
            <p className="mt-5 text-[14px] leading-[1.65] text-white/70">{OFFICE_ADDRESS}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-block text-[14px] text-white/70 hover:text-brand-yellow transition-colors break-all">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        {/* BIR registration */}
        <div className="border-t border-white/12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6">
            <h4 className="text-[17px] font-semibold">BIR Registered Business</h4>
            <p className="mt-3 text-[14.5px] leading-[1.7] text-white/70 max-w-[520px]">
              Maretinda is operated by {OPERATOR_NAME}, registered with the Bureau of Internal
              Revenue of the Philippines. Scan the QR code to verify our registration.
            </p>
            <p className="mt-4 text-[14px] font-semibold tracking-wide">RSN {BIR_RSN}</p>
          </div>
          <div className="lg:col-span-6 lg:justify-self-end w-full max-w-[460px]">
            <div className="rounded-2xl bg-white p-3 sm:p-4">
              <Image
                src={BIR_SEAL_SRC}
                alt={`BIR registered business seal for ${OPERATOR_NAME}, RSN ${BIR_RSN}, with verification QR code`}
                width={1540}
                height={480}
                sizes="460px"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/12 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13.5px] text-white/60">
          <p>
            © {year} Maretinda · Operated by {OPERATOR_NAME} All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href={PRIVACY_URL} className="hover:text-white transition-colors">Privacy Policy</a>
            <a href={TERMS_URL} className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
