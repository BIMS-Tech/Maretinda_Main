"use client";

import { useEffect } from "react";

// Adds `aos-animate` to [data-aos] elements as they scroll into view (styles in globals.css).
export default function AOSInit() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("aos-animate");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll<HTMLElement>("[data-aos]").forEach((el) => {
      // Siblings arrive one after another
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute("data-aos")) : [];
      const index = siblings.indexOf(el);
      if (index > 0) el.style.transitionDelay = `${Math.min(index, 6) * 90}ms`;
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
