"use client";

import { useEffect } from "react";

export default function AOSInit() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("aos-animate");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    const elements = document.querySelectorAll("[data-aos]");
    const timers: ReturnType<typeof setTimeout>[] = [];

    elements.forEach((el) => {
      const delay = parseInt(el.getAttribute("data-aos-delay") || "0", 10);
      observer.observe(el);
      if (delay) {
        const orig = observer.observe.bind(observer);
        const timer = setTimeout(() => orig(el), delay);
        timers.push(timer);
      }
    });

    /* cursor glow */
    const handleMouseMove = (e: MouseEvent) => {
      const glow = document.getElementById("cursorGlow");
      if (glow) {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      id="cursorGlow"
      className="fixed pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(155,128,210,.13) 0%, transparent 70%)",
        transition: "left .05s, top .05s",
      }}
    />
  );
}
