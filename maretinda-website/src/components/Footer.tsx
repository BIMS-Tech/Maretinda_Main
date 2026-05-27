"use client";

import Image from "next/image";
import {
  FiFacebook, FiInstagram, FiTwitter,
  FiArrowRight, FiMail, FiMapPin, FiPhone
} from "react-icons/fi";
import { RiTiktokLine } from "react-icons/ri";

const footerLinks = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#" },
    { label: "API Docs", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Vendors: [
    { label: "Vendor Portal", href: "#" },
    { label: "Success Stories", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "Webinars", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press Kit", href: "#" },
    { label: "Contact", href: "mailto:hello@maretinda.com" },
  ],
  Legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Vendor Agreement", href: "#" },
  ],
};

const socials = [
  { label: "Facebook",  icon: FiFacebook,   href: "#" },
  { label: "Instagram", icon: FiInstagram,  href: "#" },
  { label: "Twitter",   icon: FiTwitter,    href: "#" },
  { label: "TikTok",    icon: RiTiktokLine, href: "#" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#0D0A18" }} className="pt-16">
      <div className="max-w-[1160px] mx-auto px-6">

        {/* Newsletter bar */}
        <div
          className="rounded-3xl p-7 mb-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background:"linear-gradient(135deg,#2A1B3E,#432C63)", border:"1px solid rgba(155,128,210,.2)" }}
        >
          <div>
            <h4 className="font-display font-bold text-white text-[17px] mb-1">Get vendor tips in your inbox</h4>
            <p className="text-white/50 text-[13px]">Weekly insights on growing your online store in the Philippines.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[260px]">
              <FiMail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-[14px] text-white/80 outline-none placeholder-white/30"
                style={{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)" }}
              />
            </div>
            <button
              className="flex-shrink-0 flex items-center gap-1.5 font-semibold text-[13px] px-4 py-3 rounded-xl text-[#2A1B3E] transition-all duration-200 hover:opacity-90"
              style={{ background:"linear-gradient(135deg,#FFC533,#F2B230)" }}
            >
              Subscribe <FiArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 pb-14 border-b border-white/6">
          {/* Brand col */}
          <div>
            <div className="relative h-8 w-[148px] mb-5">
              <Image
                src="/Logo-maretinda-white.svg"
                alt="Maretinda"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-white/40 text-[13.5px] leading-[1.7] mb-5 max-w-[230px]">
              The Philippines&apos; most powerful platform for vendors to grow, sell, and succeed online.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mb-6">
              {[
                { icon: FiMail, text: "hello@maretinda.com" },
                { icon: FiPhone, text: "+63 2 8888 0000" },
                { icon: FiMapPin, text: "Makati City, Philippines" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-[13px] text-white/38">
                  <Icon size={12} className="text-brand-yellow/60 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="flex gap-2.5">
              {socials.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 transition-all duration-200 hover:text-white hover:-translate-y-0.5"
                  style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.07)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "#432C63";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "#432C63";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,.05)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,.07)";
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/28 mb-4">{title}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13.5px] text-white/42 transition-all duration-200 hover:text-white hover:pl-1 inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-5 text-[12.5px] text-white/25">
          <p>© 2025 Maretinda. All rights reserved. Made with ❤️ in the Philippines 🇵🇭</p>
          <p>Empowering Filipino entrepreneurs, one store at a time.</p>
        </div>
      </div>
    </footer>
  );
}
