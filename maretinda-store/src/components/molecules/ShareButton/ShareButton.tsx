'use client';

import { useEffect, useRef, useState } from 'react';

import {
	FacebookIcon,
	LinkedinIcon,
	LinkIcon,
	MailIcon,
	MessengerIcon,
	PinterestIcon,
	ShareIcon,
	TelegramIcon,
	TickHeavyIcon,
	ViberIcon,
	WhatsappIcon,
	XIcon,
} from '@/icons';
import { buildShareTargets, buildShareUrl } from '@/lib/helpers/share';
import { cn } from '@/lib/utils';

const ICONS: Record<
	string,
	(props: { color?: string; size?: number }) => React.JSX.Element
> = {
	email: MailIcon,
	facebook: FacebookIcon,
	linkedin: LinkedinIcon,
	messenger: MessengerIcon,
	pinterest: PinterestIcon,
	telegram: TelegramIcon,
	viber: ViberIcon,
	whatsapp: WhatsappIcon,
	x: XIcon,
};

export const ShareButton = ({
	title,
	price,
	image,
	variantParams,
	className,
}: {
	title: string;
	price?: string;
	/** Absolute product image URL, used for the Pinterest pin. */
	image?: string;
	/** Selected variant options, preserved on the shared link. */
	variantParams?: Record<string, string>;
	className?: string;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Close the popover on outside click or Escape.
	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsOpen(false);
		};

		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen]);

	// Reset the "Copied" confirmation so the button is reusable.
	useEffect(() => {
		if (!isCopied) return;

		const timeout = setTimeout(() => setIsCopied(false), 2000);

		return () => clearTimeout(timeout);
	}, [isCopied]);

	const handleShare = async () => {
		const url = buildShareUrl(variantParams);

		// On mobile the OS share sheet covers Messenger, Viber, Instagram and
		// everything else the user actually has installed, so prefer it.
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ text: title, title, url });
				return;
			} catch (error) {
				// AbortError just means the user dismissed the sheet.
				if ((error as Error)?.name === 'AbortError') return;
			}
		}

		setIsOpen((open) => !open);
	};

	const handleCopy = async () => {
		const url = buildShareUrl(variantParams);

		try {
			await navigator.clipboard.writeText(url);
			setIsCopied(true);
		} catch {
			setIsCopied(false);
		}
	};

	const shareTargets = buildShareTargets({
		image,
		price,
		title,
		url: buildShareUrl(variantParams),
	});

	return (
		<div className="relative" ref={containerRef}>
			<button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				aria-label={`Share ${title}`}
				className={cn(
					'w-[46px] h-[46px] rounded-sm flex items-center justify-center border border-black bg-transparent transition-colors hover:bg-black/5 active:bg-black/10',
					className,
				)}
				onClick={handleShare}
				type="button"
			>
				<ShareIcon size={20} />
			</button>

			{isOpen && (
				<div
					aria-label="Share this product"
					className="absolute right-0 bottom-[calc(100%+8px)] z-30 w-[232px] rounded-xl border border-black/10 bg-primary p-2 shadow-lg"
					role="menu"
				>
					<button
						className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-primary transition-colors hover:bg-black/5"
						onClick={handleCopy}
						role="menuitem"
						type="button"
					>
						<span className="flex h-6 w-6 shrink-0 items-center justify-center">
							{isCopied ? (
								<TickHeavyIcon color="#10B981" size={18} />
							) : (
								<LinkIcon size={18} />
							)}
						</span>
						{isCopied ? 'Link copied' : 'Copy link'}
					</button>

					<div className="my-1 h-px w-full bg-black/[0.08]" />

					{shareTargets.map(({ id, label, href, color }) => {
						const Icon = ICONS[id];

						return (
							<a
								className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-primary transition-colors hover:bg-black/5"
								href={href}
								key={id}
								onClick={() => setIsOpen(false)}
								rel="noopener noreferrer"
								role="menuitem"
								target="_blank"
							>
								<span
									className="flex h-6 w-6 shrink-0 items-center justify-center"
									style={{ color }}
								>
									<Icon color="currentColor" size={18} />
								</span>
								Share on {label}
							</a>
						);
					})}
				</div>
			)}
		</div>
	);
};
