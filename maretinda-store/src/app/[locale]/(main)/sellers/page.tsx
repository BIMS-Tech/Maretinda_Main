import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { listSellers } from '@/lib/data/seller'
import type { SellerProps } from '@/types/seller'

export const metadata: Metadata = {
  title: 'Browse Sellers — Maretinda',
  description: 'Discover trusted Filipino sellers on Maretinda. Shop local brands and find great deals.',
}

export const revalidate = 300

const STRIPE = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)'
const BANNER_COLORS = ['#E8DEF7', '#E2D9C7', '#D9EAE2', '#F2D9E2', '#D9E5F0', '#F0E4CC', '#FFE2D2', '#D8EAD9']
const AVATAR_COLORS = ['#9B80D2', '#D9CFB8', '#5FA88B', '#D98AA1', '#7FA8C9', '#E8B87A', '#E26D5C', '#6BBF8A']

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#432C63">
      <circle cx="12" cy="12" r="12" />
      <path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#FFC533">
      <path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
    </svg>
  )
}

function SellerCard({ seller, index }: { seller: SellerProps; index: number }) {
  const bannerBg = BANNER_COLORS[index % BANNER_COLORS.length]
  const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length]

  return (
    <Link
      href={`/sellers/${seller.handle}`}
      className="rounded-2xl border bg-white overflow-hidden block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: '#EDEAE3' }}
    >
      {/* Banner */}
      <div
        className="h-20"
        style={{ backgroundColor: bannerBg, backgroundImage: STRIPE }}
      />

      {/* Card body */}
      <div className="px-4 pb-5 -mt-8">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full border-4 border-white overflow-hidden flex-shrink-0"
          style={{ backgroundColor: avatarBg }}
        >
          {seller.photo ? (
            <Image
              src={seller.photo}
              alt={seller.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-extrabold text-[22px]"
              style={{ backgroundColor: avatarBg }}
            >
              {seller.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + verified */}
        <div className="mt-3 flex items-center gap-1.5">
          <h4 className="text-[15px] font-extrabold text-[#1B1B1B] truncate">{seller.name}</h4>
          {seller.store_status === 'ACTIVE' && <VerifiedBadge />}
        </div>

        {seller.description ? (
          <p className="text-[12px] mt-1 line-clamp-2 leading-relaxed" style={{ color: '#737373' }}>
            {seller.description}
          </p>
        ) : (
          <p className="text-[12px] mt-1" style={{ color: '#ACACAC' }}>Filipino seller</p>
        )}

        {/* Stats */}
        <div className="mt-2.5 flex items-center gap-1 text-[11.5px]" style={{ color: '#737373' }}>
          <StarIcon />
          <span className="font-semibold text-[#1B1B1B]">New</span>
          <span className="mx-1 opacity-30">·</span>
          <span>Local seller</span>
        </div>

        {/* CTA */}
        <div
          className="mt-3 w-full h-9 rounded-full text-[12px] font-bold flex items-center justify-center gap-1.5 border transition-colors hover:border-[#432C63] hover:text-[#432C63]"
          style={{ backgroundColor: '#FAF8F5', borderColor: '#EDEAE3', color: '#1B1B1B' }}
        >
          Visit shop
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default async function SellersPage() {
  const { sellers, count } = await listSellers({ limit: 48 })

  return (
    <main className="w-full">
      {/* Hero banner */}
      <div
        className="w-full py-12 lg:py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2A1B3E 0%, #432C63 60%, #6B3F8C 100%)' }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: STRIPE }} />
        <div className="max-w-[1360px] mx-auto px-4 lg:px-6 relative">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/" className="text-white/50 text-[13px] hover:text-white/80 transition-colors">Home</Link>
            <span className="text-white/30 text-[13px]">/</span>
            <span className="text-white/80 text-[13px]">Sellers</span>
          </div>
          <h1 className="text-[32px] lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.05]">
            Browse Sellers
          </h1>
          <p className="mt-3 text-[15px] text-white/70 max-w-[520px]">
            Discover trusted Filipino sellers — from local artisans to established brands. Shop with confidence.
          </p>
          {count > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {count.toLocaleString('en-PH')} active sellers
            </div>
          )}
        </div>
      </div>

      {/* Sellers grid */}
      <div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
        {!sellers?.length ? (
          <div className="text-center py-20">
            <div className="text-[48px] mb-4">🏪</div>
            <h2 className="font-serif text-[26px] text-[#1B1B1B] mb-2">No sellers yet</h2>
            <p className="text-[14px] mb-6" style={{ color: '#737373' }}>
              Be the first to sell on Maretinda.
            </p>
            <Link
              href="/become-vendor"
              className="inline-flex items-center gap-2 h-11 px-7 rounded-full font-bold text-[13.5px] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#432C63' }}
            >
              Start selling
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#1B1B1B] tracking-tight">
                All sellers
              </h2>
              <span className="text-[13px]" style={{ color: '#737373' }}>{count} sellers</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sellers.map((seller: SellerProps, index: number) => (
                <SellerCard key={seller.id} seller={seller} index={index} />
              ))}
            </div>
          </>
        )}

        {/* Become a seller CTA */}
        <div
          className="mt-14 rounded-2xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: 'linear-gradient(135deg, #2A1B3E 0%, #432C63 100%)' }}
        >
          <div>
            <p className="text-[12px] font-bold tracking-[0.18em] uppercase text-white/60 mb-1">
              Grow your business
            </p>
            <h3 className="text-[22px] font-extrabold text-white">Want to sell on Maretinda?</h3>
            <p className="mt-1 text-[14px] text-white/70">
              Join thousands of Filipino sellers reaching customers nationwide.
            </p>
          </div>
          <Link
            href="/become-vendor"
            className="shrink-0 inline-flex items-center gap-2 h-12 px-8 rounded-full font-bold text-[14px] transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#FFC533', color: '#432C63' }}
          >
            Start selling
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  )
}
