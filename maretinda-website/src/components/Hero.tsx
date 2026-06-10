"use client";

import { useEffect, useRef } from "react";
import { FiArrowRight, FiPlayCircle } from "react-icons/fi";
import Typewriter from "./Typewriter";

export default function Hero() {
  const particleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = particleRef.current;
    if (!container) return;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 22; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 3 + 1;
      p.className = "particle";
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        animation-duration:${Math.random() * 14 + 9}s;
        animation-delay:${Math.random() * 12}s;
        opacity:${Math.random() * 0.4 + 0.1};
      `;
      container.appendChild(p);
      particles.push(p);
    }
    return () => particles.forEach((p) => p.remove());
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "#1E1130" }}
    >
      {/* Mesh gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 50% -5%, rgba(108,48,200,.55) 0%, transparent 55%),
            radial-gradient(ellipse 55% 70% at -10% 85%, rgba(67,44,99,.85) 0%, transparent 55%),
            radial-gradient(ellipse 45% 55% at 105% 55%, rgba(92,62,136,.5) 0%, transparent 55%),
            #1E1130
          `,
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.045) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Orbs */}
      <div
        className="absolute rounded-full float-orb pointer-events-none"
        style={{ width:520, height:520, top:-120, right:-80,
          background:"radial-gradient(circle, rgba(255,197,51,.12), transparent 70%)",
          filter:"blur(70px)" }}
      />
      <div
        className="absolute rounded-full float-orb-slow pointer-events-none"
        style={{ width:380, height:380, bottom:-40, left:-60,
          background:"radial-gradient(circle, rgba(155,128,210,.22), transparent 70%)",
          filter:"blur(65px)" }}
      />
      <div
        className="absolute rounded-full float-orb-rev pointer-events-none"
        style={{ width:260, height:260, top:"38%", left:"42%",
          background:"radial-gradient(circle, rgba(124,58,237,.18), transparent 70%)",
          filter:"blur(50px)" }}
      />

      {/* Particles */}
      <div ref={particleRef} className="absolute inset-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-[1160px] mx-auto px-6 pt-28 pb-20 w-full">
        <div className="max-w-[780px] mx-auto text-center">

          {/* Headline */}
          <h1
            data-aos="fade-up"
            data-aos-delay="80"
            className="font-display text-white tracking-tight mb-4"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.25rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em" }}
          >
            Your Business,
            <br />
            <Typewriter />
          </h1>

          {/* Sub */}
          <p
            data-aos="fade-up"
            data-aos-delay="160"
            className="text-white/65 mx-auto mb-9 leading-relaxed"
            style={{ fontSize: "clamp(1rem, 1.6vw, 1.125rem)", maxWidth: 580 }}
          >
            Maretinda is the Philippines&apos; most powerful e-commerce platform —
            built to help sellers launch, scale, and dominate the digital market
            with tools that actually deliver results.
          </p>

          {/* CTA buttons */}
          <div
            data-aos="fade-up"
            data-aos-delay="240"
            className="flex items-center justify-center gap-3 flex-wrap mb-12"
          >
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 font-semibold text-[15px] px-8 py-3.5 rounded-full text-[#2A1B3E] transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,197,51,.5)]"
              style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)", boxShadow: "0 4px 18px rgba(255,197,51,.38)" }}
            >
              Start Selling Free
              <FiArrowRight size={16} />
            </a>
            <a
              href="#about"
              className="inline-flex items-center gap-2 font-medium text-[15px] px-8 py-3.5 rounded-full text-white/88 border border-white/22 hover:bg-white/8 hover:border-white/40 transition-all duration-200"
            >
              <FiPlayCircle size={16} />
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <div
            data-aos="fade-up"
            data-aos-delay="320"
            className="flex items-center justify-center gap-4"
          >
            <div className="flex">
              {["T","M","J","A","R"].map((letter, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[12px] border-2 border-[rgba(255,255,255,.35)]"
                  style={{
                    background: ["#5C3E88","#9B80D2","#432C63","#2A1B3E","#F2B230"][i],
                    marginLeft: i === 0 ? 0 : -9,
                    boxShadow: "0 2px 8px rgba(0,0,0,.35)",
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-white/60 text-[14px]">
              <strong className="text-white font-semibold">2,500+</strong> sellers already growing
            </p>
          </div>
        </div>

        {/* Floating stat chips */}
        <div
          data-aos="zoom-in"
          data-aos-delay="440"
          className="hidden lg:flex justify-center gap-4 mt-14"
        >
          {[
            { label: "Total GMV", value: "₱2.5B+" },
            { label: "Uptime", value: "99.9%" },
            { label: "Avg. Setup", value: "< 1 hr" },
            { label: "Satisfaction", value: "4.9 ★" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center px-6 py-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,.06)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,.1)",
              }}
            >
              <span className="text-white font-bold text-[18px] font-display">{s.value}</span>
              <span className="text-white/50 text-[12px] mt-0.5 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
        <div
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          style={{ background: "rgba(255,255,255,.05)" }}
        >
          <div className="w-1 h-2 rounded-full bg-white/50 scroll-bob" />
        </div>
      </div>
    </section>
  );
}
