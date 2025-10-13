import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export default function ResetPasswordLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<header>
				<div className="relative w-full py-2 lg:px-8 px-4">
					<div className="flex items-center justify-center pl-4 lg:pl-0 w-full">
						<LocalizedClientLink
							className="text-2xl font-bold"
							href="/"
						>
							<Image
								alt="Logo"
								height={40}
								priority
								src="/Logo.png"
								width={126}
							/>
						</LocalizedClientLink>
					</div>
				</div>
			</header>
			{children}
		</>
	);
}
