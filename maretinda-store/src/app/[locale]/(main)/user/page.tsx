import { redirect } from 'next/navigation';
import Link from 'next/link';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { Layout } from '@/components/organisms';
import { CartIcon, HouseIcon, SettingIcon } from '@/icons/navigation';
import { retrieveCustomer } from '@/lib/data/customer';
import { SELLER_PANEL_URL, SELLER_REGISTER_URL } from '@/lib/helpers/cross-links';
import { loginPath } from '@/lib/helpers/safe-return-to';


const quickLinks = [
	{
		description: 'Track your purchases and see past orders.',
		href: '/user/orders',
		icon: <CartIcon size={22} />,
		testId: 'dashboard-orders-link',
		title: 'Recent orders',
	},
	{
		description: 'Save delivery addresses for a faster checkout.',
		href: '/user/addresses',
		icon: <HouseIcon size={22} />,
		testId: 'dashboard-addresses-link',
		title: 'Addresses',
	},
	{
		description: 'Update your name, phone number and password.',
		href: '/user/settings',
		icon: <SettingIcon size={22} />,
		testId: 'dashboard-settings-link',
		title: 'Account details',
	},
];

const ArrowIcon = ({ className }: { className?: string }) => (
	<svg
		aria-hidden="true"
		className={className}
		fill="none"
		height="16"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth="2.2"
		viewBox="0 0 24 24"
		width="16"
	>
		<path d="M5 12h14M13 5l7 7-7 7" />
	</svg>
);

export default async function UserPage({
	searchParams,
}: {
	searchParams: Promise<{ returnTo?: string }>;
}) {
	const user = await retrieveCustomer();

	if (!user) {
		// Pages send signed-out shoppers here with ?returnTo=; keep it through login
		redirect(loginPath((await searchParams).returnTo));
	}

	return (
		<Layout>
			<div className="md:col-span-3 flex flex-col gap-5">
				<section className="rounded-2xl border border-[#432C63]/[0.08] bg-gradient-to-br from-[#F6F2FB] to-white px-6 py-7 sm:px-8 sm:py-9 shadow-[0_4px_24px_rgba(67,44,99,0.08)]">
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#432C63]/60">
						Dashboard
					</p>
					<h2 className="mt-2 font-lora text-3xl !font-bold text-[#432C63] break-words sm:text-4xl">
						{user.first_name
							? `Welcome, ${user.first_name}`
							: 'Welcome to Maretinda'}
					</h2>
					<p className="mt-3 max-w-xl text-base leading-relaxed text-black/65">
						Your account is ready to go. Pick up where you left off
						below.
					</p>
				</section>

				<nav
					aria-label="Account shortcuts"
					className="grid grid-cols-1 gap-4 lg:grid-cols-3"
				>
					{quickLinks.map((item) => (
						<LocalizedClientLink
							className="group flex items-center gap-4 rounded-2xl border border-[#432C63]/[0.08] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#432C63]/25 hover:shadow-[0_8px_24px_rgba(67,44,99,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#432C63] focus-visible:ring-offset-2 lg:flex-col lg:items-start lg:p-6"
							data-testid={item.testId}
							href={item.href}
							key={item.href}
						>
							<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#432C63]/[0.07] text-[#432C63] transition-colors duration-200 group-hover:bg-[#432C63] group-hover:text-white">
								{item.icon}
							</span>
							<span className="min-w-0 flex-1">
								<span className="block text-[17px] font-semibold text-[#432C63]">
									{item.title}
								</span>
								<span className="mt-1 block text-sm leading-relaxed text-black/60">
									{item.description}
								</span>
							</span>
							<ArrowIcon className="shrink-0 text-[#432C63]/40 transition duration-200 group-hover:translate-x-1 group-hover:text-[#432C63] lg:mt-auto" />
						</LocalizedClientLink>
					))}
				</nav>

				<section className="flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-[#2A1B3E] to-[#432C63] px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
							Sell on Maretinda
						</p>
						<h3 className="mt-2 text-xl font-bold text-white">
							Have something to sell?
						</h3>
						<p className="mt-1 max-w-lg text-sm leading-relaxed text-white/75">
							Open your own store and manage your products and
							orders from a seller dashboard. Your first month is
							free.
						</p>
					</div>
					<Link
						className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-[#FFC533] px-6 text-sm font-bold text-[#432C63] transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#432C63]"
						data-testid="dashboard-seller-link"
						href={SELLER_REGISTER_URL}
					>
						Become a Seller
						<ArrowIcon />
					</Link>
				</section>
			</div>
		</Layout>
	);
}
