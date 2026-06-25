import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiClock } from "react-icons/fi";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPost, posts, formatDate } from "@/lib/blog";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found — Maretinda" };
  return {
    title: `${post.title} — Maretinda Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main>
        {/* Header */}
        <section
          className="relative pt-[132px] pb-14 overflow-hidden"
          style={{ background: post.gradient }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 50% at 100% 0%, rgba(255,255,255,.08) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 max-w-[760px] mx-auto px-6">
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/70 hover:text-white transition-colors mb-6"
            >
              <FiArrowLeft size={14} /> Back to blog
            </Link>
            <span className="block text-[11px] font-bold uppercase tracking-widest text-brand-yellow mb-3">
              {post.category}
            </span>
            <h1
              className="font-display font-bold text-white leading-tight mb-4"
              style={{ fontSize: "clamp(1.9rem,3.5vw,2.6rem)", letterSpacing: "-0.02em" }}
            >
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-[13px] text-white/55">
              <span>{post.author} · {post.authorRole}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{formatDate(post.date)}</span>
              <span className="inline-flex items-center gap-1">
                <FiClock size={12} /> {post.readTime}
              </span>
            </div>
          </div>
        </section>

        {/* Body */}
        <article className="max-w-[760px] mx-auto px-6 py-14">
          {post.body.map((block, i) => {
            if (block.type === "heading") {
              return (
                <h2
                  key={i}
                  className="font-display font-bold text-[22px] text-[#1A1228] mt-9 mb-3"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "list") {
              return (
                <ul key={i} className="my-5 flex flex-col gap-2.5">
                  {block.items?.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[#3A3550] text-[15.5px] leading-relaxed"
                    >
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-purple-light flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-[#3A3550] text-[16px] leading-[1.8] mb-5">
                {block.text}
              </p>
            );
          })}

          {/* CTA */}
          <div
            className="mt-12 rounded-3xl p-8 text-center"
            style={{ background: "linear-gradient(135deg,#F6F4FB,#fff)", border: "1.5px solid rgba(67,44,99,.1)" }}
          >
            <h3 className="font-display font-bold text-[20px] text-[#1A1228] mb-2">
              Ready to start selling?
            </h3>
            <p className="text-[#6B6480] text-[14px] mb-5">
              Open your shop on Maretinda — your first month is free.
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-1.5 font-semibold text-[14px] px-6 py-3 rounded-full text-[#2A1B3E]"
              style={{ background: "linear-gradient(135deg,#FFC533,#F2B230)" }}
            >
              See plans &amp; pricing
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
