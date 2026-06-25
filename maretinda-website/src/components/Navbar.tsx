"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";

import { SELLER_LOGIN_URL, SELLER_REGISTER_URL } from "@/lib/site";

// Home-anchored hrefs so the links also work from /blogs, /contact, etc.
const links = [
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
        scrolled
          ? "bg-white/94 backdrop-blur-2xl border-b border-[rgba(67,44,99,.07)] shadow-[0_2px_20px_rgba(67,44,99,.09)]"
          : ""
      }`}
    >
      <div className="max-w-[1160px] mx-auto px-6 h-[68px] flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="relative flex-shrink-0 h-8 w-[148px]">
          <Image
            src="/Logo-maretinda.svg"
            alt="Maretinda"
            fill
            className={`object-contain object-left transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
            priority
          />
          <Image
            src="/Logo-maretinda-white.svg"
            alt="Maretinda"
            fill
            className={`object-contain object-left transition-opacity duration-300 ${scrolled ? "opacity-0" : "opacity-100"}`}
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-0.5 ml-auto items-center">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`text-[14px] font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${
                  scrolled
                    ? "text-[#5A5471] hover:text-brand-purple hover:bg-brand-purple-pale"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-3">
          <a
            href={SELLER_LOGIN_URL}
            className={`text-[14px] font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
              scrolled ? "text-[#5A5471] hover:bg-gray-100" : "text-white/80 hover:bg-white/10"
            }`}
          >
            Sign In
          </a>
          <a
            href={SELLER_REGISTER_URL}
            className="flex items-center gap-1.5 text-[14px] font-semibold px-5 py-2.5 rounded-full text-[#2A1B3E] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 3px 14px rgba(255,197,51,.35)" }}
          >
            Start Selling
            <FiArrowRight size={14} />
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ color: scrolled ? "#1A1228" : "white" }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden flex flex-col px-6 pb-6 pt-3 bg-white border-t border-gray-100 shadow-xl">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[15px] font-medium text-[#1A1228] px-4 py-3 rounded-xl hover:bg-brand-purple-pale hover:text-brand-purple transition-all"
            >
              {l.label}
            </a>
          ))}
          <a
            href={SELLER_REGISTER_URL}
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 font-semibold text-[15px] px-6 py-3 rounded-full text-[#2A1B3E]"
            style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}
          >
            Start Selling Free <FiArrowRight size={15} />
          </a>
        </div>
      )}
    </nav>
  );
}
