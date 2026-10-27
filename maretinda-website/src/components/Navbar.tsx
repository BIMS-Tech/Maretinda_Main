"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiMenu, FiX, FiArrowRight, FiArrowUpRight } from "react-icons/fi";

import { SELLER_LOGIN_URL, SELLER_REGISTER_URL, STORE_URL } from "@/lib/site";

// Home-anchored hrefs so the links also work from /blogs, /contact, etc.
const links = [
  { label: "Seller panel", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] bg-paper/95 backdrop-blur-md transition-[border-color] duration-200 border-b ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-[68px] flex items-center gap-6">
        <Link href="/" className="relative flex-shrink-0 h-8 w-[140px]" aria-label="Maretinda for sellers — home">
          <Image src="/Logo-maretinda.svg" alt="Maretinda" fill className="object-contain object-left" priority />
        </Link>
        <span className="hidden lg:inline text-[11px] font-semibold uppercase tracking-[0.16em] text-muted -ml-3 pl-3 border-l border-line">
          for sellers
        </span>

        <ul className="hidden md:flex gap-1 ml-auto items-center">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[14px] font-medium px-3 py-2 rounded-full text-[#3D3748] hover:text-brand-purple hover:bg-brand-purple/[.06] transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          <a
            href={STORE_URL}
            className="hidden lg:inline-flex items-center gap-1 text-[14px] font-medium px-3 py-2 text-[#3D3748] hover:text-brand-purple transition-colors"
          >
            Shop <FiArrowUpRight size={14} />
          </a>
          <a
            href={SELLER_LOGIN_URL}
            className="text-[14px] font-medium px-3 py-2 text-[#3D3748] hover:text-brand-purple transition-colors"
          >
            Sign in
          </a>
          <a
            href={SELLER_REGISTER_URL}
            className="ml-1 inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-[14px] font-bold bg-brand-yellow text-brand-purple hover:bg-brand-yellow-deep transition-colors"
          >
            Start selling <FiArrowRight size={14} />
          </a>
        </div>

        <button
          className="md:hidden ml-auto flex items-center justify-center w-10 h-10 rounded-full text-ink hover:bg-brand-purple/[.06]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden flex flex-col px-4 pb-6 pt-2 bg-paper border-t border-line">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[16px] font-medium text-ink px-2 py-3 border-b border-line"
            >
              {l.label}
            </a>
          ))}
          <a href={STORE_URL} className="text-[16px] font-medium text-ink px-2 py-3 border-b border-line inline-flex items-center gap-1">
            Shop on maretinda.com <FiArrowUpRight size={15} />
          </a>
          <a href={SELLER_LOGIN_URL} className="text-[16px] font-medium text-ink px-2 py-3">
            Sign in
          </a>
          <a
            href={SELLER_REGISTER_URL}
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 h-12 rounded-full text-[15px] font-bold bg-brand-yellow text-brand-purple"
          >
            Start selling <FiArrowRight size={15} />
          </a>
        </div>
      )}
    </nav>
  );
}
