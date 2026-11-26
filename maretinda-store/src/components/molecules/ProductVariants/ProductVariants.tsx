'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { EASE_OUT, SPRING } from '@/components/motion';
import { type Choice, valueAvailability } from '@/lib/product-options';
import { cn } from '@/lib/utils';

/** Colours every browser knows by name, or written as a code; anything else stays a word. */
const NAMED = /^(black|white|red|blue|green|yellow|orange|purple|pink|gr[ae]y|brown|navy|beige|gold|silver|maroon|olive|teal|tan|violet|ivory|khaki|lavender|turquoise|indigo|coral|crimson|salmon|magenta|cyan|plum|chocolate)$/i;
const CODE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const LIGHT = /^(white|beige|ivory|yellow|silver|khaki|lavender|tan|gold|pink|cyan)$/i;

export const isPlaceholderOption = (title: string) => /^(default( option)?|title)$/i.test(title.trim());

export const ProductVariants = ({ product, choice, onPick }: { product: HttpTypes.StoreProduct; choice: Choice; onPick: (option: string, value: string) => void }) => {
	const options = (product.options ?? []).filter((o) => o.title && !isPlaceholderOption(o.title));
	if (!options.length) return null;

	return (
		<div className="flex flex-col gap-5">
			{options.map(({ id, title, values }) => {
				const name = title.toLowerCase();
				const list = (values ?? []).map((v) => v.value).filter((v): v is string => !!v);
				const swatches = /^colou?rs?$/i.test(title) && list.every((v) => NAMED.test(v) || CODE.test(v));
				return (
					<fieldset key={id}>
						<legend className="mb-2.5 flex items-center gap-1.5 text-[13.5px] text-[#737373]">
							{title}:
							<span className="relative inline-flex overflow-hidden font-semibold text-[#1B1B1B]">
								<AnimatePresence initial={false} mode="popLayout">
									<m.span animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} initial={{ opacity: 0, y: 12 }} key={choice[name]} transition={{ duration: 0.25, ease: EASE_OUT }}>
										{choice[name]}
									</m.span>
								</AnimatePresence>
							</span>
						</legend>
						<div aria-label={title} className="flex flex-wrap gap-2.5" role="radiogroup">
							{list.map((value) => {
								const on = choice[name] === value;
								const availability = valueAvailability(product.variants, choice, name, value);
								const out = availability === 'sold_out';
								const label = `${value}${out ? ', sold out' : ''}`;
								if (swatches) {
									return (
										<button
											aria-checked={on}
											aria-label={label}
											className="press relative flex h-11 w-11 items-center justify-center rounded-full"
											key={value}
											onClick={() => onPick(name, value)}
											role="radio"
											title={label}
											type="button"
										>
											{on && <m.span className="absolute inset-0 rounded-full ring-2 ring-inset ring-[#432C63]" layoutId={`ring-${id}`} transition={SPRING} />}
											<span
												className={cn('relative h-[34px] w-[34px] overflow-hidden rounded-full transition-transform duration-300', LIGHT.test(value) && 'border border-black/15', on ? 'scale-[0.94]' : 'hover:scale-105', out && 'opacity-45')}
												style={{ backgroundColor: value.toLowerCase().replace(/\s+/g, '') }}
											>
												{out && <span className="absolute left-1/2 top-[-10%] h-[120%] w-[1.5px] rotate-45 bg-[#8A8493]" />}
											</span>
										</button>
									);
								}
								return (
									<button
										aria-checked={on}
										aria-label={label}
										className={cn(
											'press relative min-w-[52px] rounded-full border px-4 py-2.5 text-[13.5px] font-semibold',
											on ? 'border-transparent text-white' : 'border-[#E3DDEA] bg-white text-[#1B1B1B] hover:border-[#432C63]',
											(out || availability === 'none') && !on && 'border-dashed text-[#B5AEBF]',
										)}
										key={value}
										onClick={() => onPick(name, value)}
										role="radio"
										type="button"
									>
										{on && <m.span className="absolute inset-0 rounded-full bg-[#432C63]" layoutId={`pill-${id}`} transition={SPRING} />}
										<span className={cn('relative', out && 'line-through decoration-1')}>{value}</span>
									</button>
								);
							})}
						</div>
					</fieldset>
				);
			})}
		</div>
	);
};
