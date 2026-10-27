import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { posts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Maretinda",
  description:
    "Guides, tips, and updates to help Filipino sellers grow their business on Maretinda.",
};

export default function BlogIndex() {
  const [featured, ...rest] = posts;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero header */}
        <section className="bg-paper pt-[132px] pb-14 border-b border-line">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <p className="eyebrow text-brand-purple">Maretinda blog</p>
            <h1
              className="font-display text-ink mt-5 leading-[1.02] tracking-[-0.015em]"
              style={{ fontSize: "clamp(38px, 5vw, 64px)" }}
            >
              Stories &amp; guides for Filipino sellers.
            </h1>
            <p className="mt-4 text-muted text-[16px] max-w-[560px] leading-relaxed">
              Practical advice on pricing, growth, shipping, and everything else
              that helps your shop succeed.
            </p>
          </div>
        </section>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16">
          {/* Featured post */}
          <Link
            href={`/blogs/${featured.slug}`}
            className="group grid grid-cols-1 md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-[rgba(67,44,99,.1)] mb-12 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_44px_rgba(67,44,99,.16)]"
          >
            <div
              className="min-h-[220px] md:min-h-[300px] flex items-end p-8"
              style={{ background: featured.gradient }}
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 bg-white/12 border border-white/15 px-3 py-1 rounded-full">
                {featured.category}
              </span>
            </div>
            <div className="p-8 flex flex-col justify-center bg-white">
              <div className="flex items-center gap-3 text-[12.5px] text-[#8B85A0] mb-3">
                <span>{formatDate(featured.date)}</span>
                <span className="inline-flex items-center gap-1">
                  <FiClock size={12} /> {featured.readTime}
                </span>
              </div>
              <h2 className="font-display font-bold text-[24px] leading-snug text-[#1A1228] mb-3 group-hover:text-brand-purple transition-colors">
                {featured.title}
              </h2>
              <p className="text-[#6B6480] text-[14px] leading-relaxed mb-5">
                {featured.excerpt}
              </p>
              <span className="inline-flex items-center gap-1.5 text-brand-purple font-semibold text-[14px]">
                Read article
                <FiArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          {/* Rest of the grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blogs/${post.slug}`}
                className="group rounded-3xl overflow-hidden border border-[rgba(67,44,99,.1)] flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_36px_rgba(67,44,99,.14)]"
              >
                <div
                  className="h-[150px] flex items-end p-5"
                  style={{ background: post.gradient }}
                >
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-white/80 bg-white/12 border border-white/15 px-2.5 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1 bg-white">
                  <div className="flex items-center gap-3 text-[12px] text-[#8B85A0] mb-2.5">
                    <span>{formatDate(post.date)}</span>
                    <span className="inline-flex items-center gap-1">
                      <FiClock size={11} /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[18px] leading-snug text-[#1A1228] mb-2 group-hover:text-brand-purple transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[#6B6480] text-[13.5px] leading-relaxed mb-4 flex-1">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-brand-purple font-semibold text-[13.5px]">
                    Read more
                    <FiArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
