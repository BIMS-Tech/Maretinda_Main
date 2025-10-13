import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import footerLinks from '@/data/footerLinks';

export function Footer() {
	return (
		<footer className="bg-primary container">
			<div className="grid grid-cols-1 lg:grid-cols-3">
				{/* Customer Services Column */}
				<div className="p-6 border rounded-sm">
					<h2 className="heading-sm text-primary mb-3 uppercase">
						Customer services
					</h2>
					<nav
						aria-label="Customer services navigation"
						className="space-y-3"
					>
						{footerLinks.customerServices.map(({ label, path }) => (
							<LocalizedClientLink
								className="block label-md"
								href={path}
								key={label}
							>
								{label}
							</LocalizedClientLink>
						))}
					</nav>
				</div>

				{/* About Column */}
				<div className="p-6 border rounded-sm">
					<h2 className="heading-sm text-primary mb-3 uppercase">
						About
					</h2>
					<nav aria-label="About navigation" className="space-y-3">
						{footerLinks.about.map(({ label, path }) => (
							<LocalizedClientLink
								className="block label-md"
								href={path}
								key={label}
							>
								{label}
							</LocalizedClientLink>
						))}
					</nav>
				</div>

				{/* Connect Column */}
				<div className="p-6 border rounded-sm">
					<h2 className="heading-sm text-primary mb-3 uppercase">
						connect
					</h2>
					<nav
						aria-label="Social media navigation"
						className="space-y-3"
					>
						{footerLinks.connect.map(({ label, path }) => (
							<LocalizedClientLink
								className="block label-md"
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
			</div>

			<div className="py-6 border rounded-sm ">
				<p className="text-md text-secondary text-center ">
					© 2024 Fleek
				</p>
			</div>
		</footer>
	);
}
