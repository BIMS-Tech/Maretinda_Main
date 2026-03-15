import { Text } from '@medusajs/ui';
import Image from 'next/image';
import Link from 'next/link';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import footerLinks from '@/data/footerLinks';
import {
	ApplePayIcon,
	FacebookIcon,
	GoogplePayIcon,
	InstagramIcon,
	LinkedinIcon,
	MastercardIcon,
	PaypalIcon,
	VisaIcon,
	XIcon,
} from '@/icons';

export function Footer() {
	return (
		<footer className="bg-tertiary">
			<div className="!max-w-7xl mx-auto container">
				<div className="flex flex-col md:flex-row gap-5 md:gap-20">
					<div className="py-7 md:max-w-[270px]">
						<Image
							alt="Logo"
							className="object-contain mb-5"
							height={47}
							priority
							src="/Logo-maretinda-white.svg"
							width={200}
						/>
						<Text className="text-base text-tertiary">
							We have clothes that suits your style and which
							you’re proud to wear. From women to men.
						</Text>
						<div className="flex items-center justify-start gap-6 mt-9">
							<LocalizedClientLink href="">
								<FacebookIcon color="#FFF" />
							</LocalizedClientLink>
							<LocalizedClientLink href="">
								<XIcon color="#FFF" />
							</LocalizedClientLink>
							<LocalizedClientLink href="">
								<InstagramIcon color="#FFF" />
							</LocalizedClientLink>
							<LocalizedClientLink href="">
								<LinkedinIcon color="#FFF" />
							</LocalizedClientLink>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
						{/* About Column */}
						<div className="py-7">
							<h2 className="heading-footer text-tertiary mb-5">
								Company
							</h2>
							<nav
								aria-label="About navigation"
								className="space-y-3"
							>
								{footerLinks.about.map(({ label, path }) => (
									<LocalizedClientLink
										className="block text-lg !font-normal text-tertiary"
										href={path}
										key={label}
									>
										{label}
									</LocalizedClientLink>
								))}
							</nav>
						</div>

						{/* Buyer Column */}
						<div className="py-7">
							<h2 className="heading-footer text-tertiary mb-5">
								Buyer
							</h2>
							<nav
								aria-label="Social media navigation"
								className="space-y-3"
							>
								{footerLinks.buyer.map(({ label, path }) => (
									<LocalizedClientLink
										className="block text-lg !font-normal text-tertiary"
										href={path}
										key={label}
										rel="noopener noreferrer"
										target="_blank"
									>
										{label}
									</LocalizedClientLink>
								))}
							</nav>
						</div>

						{/* Seller Column */}
						<div className="py-7">
							<h2 className="heading-footer text-tertiary mb-5">
								Seller
							</h2>
							<nav
								aria-label="Social media navigation"
								className="space-y-3"
							>
								{footerLinks.seller.map(({ label, path }) => (
									<LocalizedClientLink
										className="block text-lg !font-normal text-tertiary"
										href={path}
										key={label}
										rel="noopener noreferrer"
										target="_blank"
									>
										{label}
									</LocalizedClientLink>
								))}
							</nav>
						</div>

						{/* Support Column */}
						<div className="py-7">
							<h2 className="heading-footer text-tertiary mb-5">
								Support
							</h2>
							<nav
								aria-label="Social media navigation"
								className="space-y-3"
							>
								<Text className="block text-lg !font-normal text-tertiary">
									111 Bijoy sarani, Dhaka, DH 1515,
									Bangladesh.
								</Text>
								<Link
									className="block text-lg !font-normal text-tertiary"
									href="mailto:maretinda@gmail.com"
									rel="noopener noreferrer"
									target="_blank"
								>
									maretinda@gmail.com
								</Link>
								<Link
									className="block text-lg !font-normal text-tertiary"
									href="tel:+88015-88888-9999"
									rel="noopener noreferrer"
									target="_blank"
								>
									+88015-88888-9999
								</Link>
							</nav>
						</div>
					</div>
				</div>

				<div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between mt-20 gap-5 pb-2 lg:pb-0">
					<p className="text-md text-tertiary text-center ">
						© 2026 Maretinda, All Rights Reserved
					</p>
					<div className="flex items-center gap-3 justify-end">
						<VisaIcon />
						<MastercardIcon />
						<PaypalIcon />
						<ApplePayIcon />
						<GoogplePayIcon />
					</div>
				</div>
			</div>
		</footer>
	);
}
