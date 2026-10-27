// Payment rails and couriers sellers actually get — same assets as the storefront footer.
const PAYMENT_LOGOS = [
  { src: "https://pay.giyapay.com/images/select-gcash.png", alt: "GCash" },
  { src: "https://pay.giyapay.com/images/select-instapay.png", alt: "InstaPay" },
  { src: "https://pay.giyapay.com/images/select-qrph.png", alt: "QR Ph" },
  { src: "https://pay.giyapay.com/images/select-mastercard-visa.png", alt: "Visa / Mastercard" },
  { src: "https://pay.giyapay.com/images/select-unionpay.png", alt: "UnionPay" },
  { src: "https://pay.giyapay.com/images/select-wechatpay.png", alt: "WeChat Pay" },
];

export default function Ticker() {
  return (
    <section aria-label="Payments and shipping" className="border-y border-line bg-white">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
        <p className="text-[13px] leading-snug text-muted md:max-w-[220px] flex-shrink-0">
          Buyers pay through <strong className="text-ink font-semibold">GiyaPay</strong>, or cash on delivery.
        </p>

        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          <div className="marquee flex items-center gap-4 w-max">
            {[...PAYMENT_LOGOS, ...PAYMENT_LOGOS].map((logo, i) => (
              <span
                key={i}
                aria-hidden={i >= PAYMENT_LOGOS.length}
                className="h-11 w-[104px] rounded-lg border border-line bg-white overflow-hidden flex items-center justify-center px-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.src} alt={i >= PAYMENT_LOGOS.length ? "" : logo.alt} className="max-h-8 max-w-full object-contain scale-[1.35]" loading="lazy" />
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[13px] text-muted">Ships with</span>
          <span className="h-10 w-[92px] rounded-lg bg-[#111] flex items-center justify-center px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/flying-tigers.png" alt="Flying Tigers Express" className="max-h-7 max-w-full object-contain" />
          </span>
        </div>
      </div>
    </section>
  );
}
