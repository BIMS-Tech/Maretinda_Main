import { FiPlus, FiArrowUpRight } from "react-icons/fi";

import { CONTACT_EMAIL, HELP_CENTER_URL } from "@/lib/site";

const faqs = [
  {
    q: "What is Maretinda?",
    a: "Maretinda is a Philippine online marketplace at maretinda.com. Independent shops — from grocers to fashion labels — list their products there, and buyers check out from many shops in a single cart.",
  },
  {
    q: "Do I need technical skills to sell?",
    a: "No. You run everything from the seller panel in your browser: add products, update stock, process orders and reply to buyers. If you can post on Facebook Marketplace, you can sell on Maretinda.",
  },
  {
    q: "How do buyers pay me?",
    a: "Online payments go through GiyaPay, which accepts GCash, InstaPay, QR Ph, Visa, Mastercard, UnionPay and WeChat Pay. Buyers can also choose cash on delivery.",
  },
  {
    q: "Does Maretinda take a commission on my sales?",
    a: "No. Maretinda charges a flat monthly subscription instead of a cut of each sale, and there are no listing fees. Payment processing fees from the payment provider may apply.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — your first month is free on every plan. You can upgrade, downgrade or cancel from the Subscription page in your seller panel.",
  },
  {
    q: "How do deliveries work?",
    a: "You set your shipping options in the seller panel and hand orders to the courier. Flying Tigers Express is integrated today, with more couriers being added.",
  },
  {
    q: "Is Maretinda a registered business?",
    a: "Yes. Maretinda is operated by BIMS Technologies, Inc., which is registered with the Bureau of Internal Revenue of the Philippines. You can scan the QR code on the BIR seal in our footer to verify it.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-white py-20 lg:py-28">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 grid grid-cols-12 gap-y-10 lg:gap-x-10">
        <div className="col-span-12 lg:col-span-4" data-aos>
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow text-brand-purple">Questions</p>
            <h2
              className="font-display text-ink mt-5 leading-[1.02] tracking-[-0.015em]"
              style={{ fontSize: "clamp(34px, 4vw, 52px)" }}
            >
              Before you open your shop.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-muted">
              Can&apos;t find your answer? Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-purple font-semibold underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
            <a
              href={HELP_CENTER_URL}
              className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-bold text-brand-purple hover:underline underline-offset-4"
            >
              Visit the help center <FiArrowUpRight size={15} />
            </a>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 border-t border-ink/15">
          {faqs.map((faq, i) => (
            <details key={faq.q} className="group border-b border-ink/15" open={i === 0}>
              <summary className="flex items-center justify-between gap-6 py-6 cursor-pointer">
                <span className="text-[17px] sm:text-[19px] font-semibold text-ink tracking-[-0.01em] group-open:text-brand-purple">
                  {faq.q}
                </span>
                <span className="faq-icon flex-shrink-0 w-9 h-9 rounded-full border border-line flex items-center justify-center text-brand-purple transition-transform duration-200">
                  <FiPlus size={16} />
                </span>
              </summary>
              <p className="pb-7 pr-12 text-[15.5px] leading-[1.75] text-muted max-w-[680px]">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
