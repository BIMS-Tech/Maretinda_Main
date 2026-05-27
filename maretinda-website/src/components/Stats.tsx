"use client";

import { useEffect, useRef, useState } from "react";
import { FiShoppingBag, FiPackage, FiUsers, FiMapPin } from "react-icons/fi";

interface StatItem { icon: typeof FiShoppingBag; target: number; label: string; suffix?: string; format?: "k" | "plain" }

const stats: StatItem[] = [
  { icon: FiShoppingBag, target: 2500,   label: "Active Vendors",   suffix: "+", format: "plain" },
  { icon: FiPackage,     target: 180,     label: "Products Listed",  suffix: "K+", format: "plain" },
  { icon: FiUsers,       target: 520,     label: "Happy Customers",  suffix: "K+", format: "plain" },
  { icon: FiMapPin,      target: 81,      label: "Provinces Served", format: "plain" },
];

function useCountUp(target: number, active: boolean) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const duration = 1800;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active]);

  return count;
}

function StatCard({ stat, active, delay }: { stat: StatItem; active: boolean; delay: number }) {
  const count = useCountUp(stat.target, active);
  const Icon = stat.icon;

  return (
    <div
      data-aos="zoom-in"
      data-aos-delay={String(delay)}
      className="flex flex-col items-center text-center py-10 px-8 border-r border-b border-white/8 last:border-r-0 [&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0 transition-all duration-300 hover:bg-white/8 group"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
        style={{ background:"linear-gradient(135deg,rgba(255,255,255,.15),rgba(255,255,255,.07))", border:"1px solid rgba(255,255,255,.12)" }}
      >
        <Icon size={22} className="text-brand-yellow" />
      </div>
      <div
        className="font-display text-white font-extrabold leading-none mb-2"
        style={{ fontSize:"clamp(2rem,3.5vw,2.75rem)" }}
      >
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div className="text-[13.5px] text-white/55 font-medium">{stat.label}</div>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-0 overflow-hidden">
      <div className="absolute inset-0"
        style={{ background:"linear-gradient(135deg,#1E1130 0%,#432C63 50%,#3D1A5E 100%)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage:"radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px)", backgroundSize:"28px 28px" }} />

      <div className="relative z-10 max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-white/8 rounded-2xl overflow-hidden my-8 lg:my-10">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} active={active} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}
