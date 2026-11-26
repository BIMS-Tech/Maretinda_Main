'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useOptimistic, useTransition } from 'react';

import { AnimatedNumber, AnimatedPeso, EASE_OUT, peso, SPRING_SOFT } from '@/components/motion';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { closeCartDrawer, notify, useCartFeedback } from '@/lib/cart-feedback';
import { deleteLineItem, updateLineItem } from '@/lib/data/cart';
import { cardImage } from '@/lib/helpers/card-image';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/LanguageProvider';

/** Every delivery option is free from here (backend lib/free-shipping). */
const FREE_SHIPPING_FROM = 499;

type Line = HttpTypes.StoreCartLineItem;
type Change = { id: string; quantity: number };

/** The cart, from anywhere. Changes show at once and settle when the shop answers. */
export function CartDrawer({ cart }: { cart: HttpTypes.StoreCart | null }) {
	const { t } = useLanguage();
	const s = t.cart;
	const { drawerOpen } = useCartFeedback();
	const pathname = usePathname();
	const router = useRouter();
	const { locale } = useParams<{ locale: string }>();
	const [, startTransition] = useTransition();
	const [lines, change] = useOptimistic<Line[], Change>(cart?.items ?? [], (current, { id, quantity }) =>
		quantity ? current.map((l) => (l.id === id ? { ...l, quantity } : l)) : current.filter((l) => l.id !== id),
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: closes when the page changes
	useEffect(() => closeCartDrawer(), [pathname]);

	const count = lines.reduce((n, l) => n + l.quantity, 0);
	const subtotal = lines.reduce((n, l) => n + Number(l.unit_price ?? 0) * l.quantity, 0);
	const toFree = Math.max(0, FREE_SHIPPING_FROM - subtotal);

	const setQuantity = (line: Line, quantity: number) =>
		startTransition(async () => {
			change({ id: line.id, quantity });
			try {
				if (quantity) await updateLineItem({ lineId: line.id, quantity });
				else await deleteLineItem(line.id);
			} catch {
				notify({ title: quantity > line.quantity ? s.noMoreStock : s.notUpdated, tone: 'error' });
			}
		});

	const go = (path: string) => {
		closeCartDrawer();
		router.push(`/${locale}${path}`);
	};

	return (
		<AnimatePresence>
			{drawerOpen && (
				<Dialog className="relative z-[100]" onClose={closeCartDrawer} open static>
					<m.div
						animate={{ opacity: 1 }}
						aria-hidden="true"
						className="fixed inset-0 bg-[#1E1430]/45 backdrop-blur-[3px]"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					/>
					<div className="fixed inset-y-0 right-0 flex max-w-full p-2 sm:p-3">
						<m.div animate={{ x: 0 }} className="h-full w-[min(430px,calc(100vw-16px))]" exit={{ x: '105%' }} initial={{ x: '105%' }} transition={SPRING_SOFT}>
							<DialogPanel className="flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_rgba(30,20,48,0.4)]" data-testid="cart-drawer">
								<div className="flex items-center justify-between px-6 pb-3 pt-5">
									<DialogTitle className="font-serif text-[26px] leading-none text-[#1B1B1B]">
										{s.yourCart} <span className="text-[#A39DAC]">(<AnimatedNumber duration={0.35} value={count} />)</span>
									</DialogTitle>
									<button aria-label={s.close} className="press flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F2FB] text-[#432C63]" onClick={closeCartDrawer} type="button">
										<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width="16"><path d="M6 6l12 12M18 6L6 18" /></svg>
									</button>
								</div>

								{lines.length > 0 && (
									<div className="mx-6 rounded-2xl bg-[#F8F5FB] px-4 py-3">
										<AnimatePresence initial={false} mode="wait">
											<m.p
												animate={{ opacity: 1, y: 0 }}
												className={cn('text-[12.5px] font-semibold', toFree ? 'text-[#5B4A7A]' : 'text-[#1F7A4D]')}
												exit={{ opacity: 0, y: -6 }}
												initial={{ opacity: 0, y: 6 }}
												key={toFree ? 'more' : 'free'}
												transition={{ duration: 0.2, ease: EASE_OUT }}
											>
												{toFree ? <><b className="tabular-nums">{peso(toFree)}</b> {s.moreForFree}</> : s.freeUnlocked}
											</m.p>
										</AnimatePresence>
										<div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7DFF1]">
											<m.div
												animate={{ scaleX: Math.min(1, subtotal / FREE_SHIPPING_FROM) }}
												className={cn('h-full origin-left rounded-full transition-colors duration-500', toFree ? 'bg-[#FFC533]' : 'bg-[#1F7A4D]')}
												initial={{ scaleX: 0 }}
												transition={{ delay: 0.15, duration: 0.8, ease: EASE_OUT }}
											/>
										</div>
									</div>
								)}

								<ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-6 py-4">
									<AnimatePresence initial={false} mode="popLayout">
										{lines.map((line, i) => (
											<m.li
												animate={{ opacity: 1, x: 0 }}
												className="flex gap-3.5 rounded-[18px] bg-[#FBFAFC] p-3"
												exit={{ opacity: 0, scale: 0.94, x: 60, transition: { duration: 0.22, ease: EASE_OUT } }}
												initial={{ opacity: 0, x: 36 }}
												key={line.id}
												layout
												transition={{ ...SPRING_SOFT, delay: 0.08 + i * 0.05, layout: SPRING_SOFT }}
											>
												<LocalizedClientLink className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#F1EDF6]" href={`/products/${line.product_handle ?? ''}`} tabIndex={-1}>
													<Image alt={line.product_title ?? ''} className="object-contain p-1.5" fill sizes="76px" src={cardImage(line.thumbnail ?? null) || '/images/placeholder.svg'} />
												</LocalizedClientLink>
												<div className="flex min-w-0 flex-1 flex-col">
													<div className="flex items-start justify-between gap-2">
														<p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1B1B1B]">{line.product_title}</p>
														<button
															aria-label={`${s.remove} ${line.product_title}`}
															className="press -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#A39DAC] hover:bg-[#FCEDED] hover:text-[#C43131]"
															onClick={() => setQuantity(line, 0)}
															type="button"
														>
															<svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24" width="15"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
														</button>
													</div>
													{line.variant_title && !/default/i.test(line.variant_title) && <p className="truncate text-[12px] text-[#8A8493]">{line.variant_title}</p>}
													<div className="mt-auto flex items-center justify-between pt-2">
														<div className="flex items-center rounded-full bg-white shadow-[0_0_0_1px_#EDE8F2]">
															<Step label={s.less} off={line.quantity <= 1} onClick={() => setQuantity(line, line.quantity - 1)} sign="−" />
															<span className="relative flex h-8 w-6 items-center justify-center overflow-hidden text-[13px] font-bold tabular-nums">
																<AnimatePresence initial={false} mode="popLayout">
																	<m.span animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} initial={{ opacity: 0, y: 14 }} key={line.quantity} transition={{ duration: 0.22, ease: EASE_OUT }}>
																		{line.quantity}
																	</m.span>
																</AnimatePresence>
															</span>
															<Step label={s.more} onClick={() => setQuantity(line, line.quantity + 1)} sign="+" />
														</div>
														<AnimatedPeso className="text-[14px] font-bold text-[#432C63]" value={Number(line.unit_price ?? 0) * line.quantity} />
													</div>
												</div>
											</m.li>
										))}
									</AnimatePresence>
									{lines.length === 0 && (
										<m.li animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col items-center justify-center pb-10 text-center" initial={{ opacity: 0, y: 12 }} transition={{ delay: 0.15, duration: 0.4, ease: EASE_OUT }}>
											<span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6F2FB] text-[#432C63]">
												<svg aria-hidden="true" fill="none" height="27" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="27"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.050 2.050h2l2.660 12.420a2 2 0 0 0 2 1.580h9.780a2 2 0 0 0 1.950-1.570l1.650-7.430H5.120" /></svg>
											</span>
											<p className="text-[15px] font-bold text-[#1B1B1B]">{s.empty}</p>
											<p className="mt-1 max-w-[240px] text-[13px] text-[#737373]">{s.emptyDesc}</p>
											<button className="press mt-5 h-11 rounded-full bg-[#432C63] px-6 text-[13.5px] font-bold text-white" onClick={() => go('/search')} type="button">{s.exploreProducts}</button>
										</m.li>
									)}
								</ul>

								{lines.length > 0 && (
									<div className="border-t border-[#F0ECF4] px-6 pb-6 pt-4">
										<div className="mb-4 flex items-baseline justify-between">
											<span className="text-[13.5px] text-[#737373]">{s.subtotal}</span>
											<AnimatedPeso className="text-[24px] font-extrabold text-[#1B1B1B]" fromZero value={subtotal} />
										</div>
										<button className="press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248]" data-testid="drawer-checkout" onClick={() => go('/checkout?step=address')} type="button">
											{s.checkout}
											<svg aria-hidden="true" className="arrow" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="15"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
										</button>
										<button className="mt-2 h-10 w-full text-[13px] font-semibold text-[#432C63] underline-offset-4 hover:underline" onClick={() => go('/cart')} type="button">{s.viewCart}</button>
									</div>
								)}
							</DialogPanel>
						</m.div>
					</div>
				</Dialog>
			)}
		</AnimatePresence>
	);
}

const Step = ({ sign, label, onClick, off }: { sign: string; label: string; onClick: () => void; off?: boolean }) => (
	<button aria-label={label} className="press flex h-8 w-8 items-center justify-center rounded-full text-[16px] font-semibold text-[#432C63] hover:bg-[#F6F2FB] disabled:opacity-30" disabled={off} onClick={onClick} type="button">
		{sign}
	</button>
);
