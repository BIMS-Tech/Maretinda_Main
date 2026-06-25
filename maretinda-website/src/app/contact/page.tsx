"use client";

import { useState } from "react";
import {
  FiMail, FiPhone, FiMapPin, FiArrowRight, FiCheckCircle, FiSend,
} from "react-icons/fi";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SELLER_REGISTER_URL } from "@/lib/site";

const channels = [
  {
    icon: FiMail,
    label: "Email us",
    value: "hello@maretinda.com",
    href: "mailto:hello@maretinda.com",
  },
  {
    icon: FiPhone,
    label: "Call us",
    value: "+63 2 8888 0000",
    href: "tel:+63288880000",
  },
  {
    icon: FiMapPin,
    label: "Visit us",
    value: "Makati City, Philippines",
    href: undefined,
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // No backend yet — acknowledge locally so the form is usable.
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero header */}
        <section
          className="relative pt-[132px] pb-16 overflow-hidden"
          style={{ background: "linear-gradient(150deg,#2A1B3E,#432C63 60%,#5C3E88)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 50% at 0% 100%, rgba(255,197,51,.10) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 max-w-[1160px] mx-auto px-6 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-yellow bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full mb-4">
              Get in touch
            </span>
            <h1
              className="font-display font-bold text-white leading-tight mb-3"
              style={{ fontSize: "clamp(2rem,4vw,3rem)", letterSpacing: "-0.02em" }}
            >
              We&apos;d love to hear from you
            </h1>
            <p className="text-white/55 text-[15px] max-w-[520px] mx-auto leading-relaxed">
              Questions about selling, your account, or a partnership? Send us a
              message and our team will get back to you.
            </p>
          </div>
        </section>

        <div className="max-w-[1160px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10">
          {/* Contact channels */}
          <div>
            <h2 className="font-display font-bold text-[22px] text-[#1A1228] mb-5">
              Contact details
            </h2>
            <div className="flex flex-col gap-4 mb-8">
              {channels.map(({ icon: Icon, label, value, href }) => {
                const inner = (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-[rgba(67,44,99,.1)] transition-all duration-200 hover:border-brand-purple-light hover:-translate-y-0.5">
                    <span
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(67,44,99,.08)" }}
                    >
                      <Icon size={18} className="text-brand-purple" />
                    </span>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-wider text-[#9B85B5]">
                        {label}
                      </p>
                      <p className="text-[15px] font-medium text-[#1A1228]">{value}</p>
                    </div>
                  </div>
                );
                return href ? (
                  <a key={label} href={href}>
                    {inner}
                  </a>
                ) : (
                  <div key={label}>{inner}</div>
                );
              })}
            </div>

            <div
              className="rounded-2xl p-6"
              style={{ background: "linear-gradient(135deg,#F6F4FB,#fff)", border: "1.5px solid rgba(67,44,99,.1)" }}
            >
              <h3 className="font-display font-bold text-[17px] text-[#1A1228] mb-1.5">
                Want to start selling?
              </h3>
              <p className="text-[#6B6480] text-[13.5px] mb-4 leading-relaxed">
                Register your shop and start your free first month — no commission,
                no listing fees.
              </p>
              <a
                href={SELLER_REGISTER_URL}
                className="inline-flex items-center gap-1.5 font-semibold text-[13.5px] px-5 py-2.5 rounded-full text-[#2A1B3E]"
                style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}
              >
                Start selling <FiArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-[rgba(67,44,99,.1)] p-7 sm:p-9 bg-white">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <FiCheckCircle size={44} className="text-[#17A34A] mb-4" />
                <h2 className="font-display font-bold text-[22px] text-[#1A1228] mb-2">
                  Message sent
                </h2>
                <p className="text-[#6B6480] text-[14.5px] max-w-[360px]">
                  Thanks for reaching out. Our team typically replies within one
                  business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full name" name="name" type="text" placeholder="Juan dela Cruz" required />
                  <Field label="Email" name="email" type="email" placeholder="you@email.com" required />
                </div>
                <Field label="Subject" name="subject" type="text" placeholder="How can we help?" required />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#3A3550]">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Tell us a bit more…"
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-[#1A1228] outline-none border border-[rgba(67,44,99,.15)] focus:border-brand-purple transition-colors resize-y"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 inline-flex items-center justify-center gap-2 font-semibold text-[14.5px] py-3.5 rounded-full text-[#2A1B3E] transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 4px 16px rgba(255,197,51,.35)" }}
                >
                  Send message <FiSend size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-[#3A3550]">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl text-[14px] text-[#1A1228] outline-none border border-[rgba(67,44,99,.15)] focus:border-brand-purple transition-colors"
      />
    </div>
  );
}
