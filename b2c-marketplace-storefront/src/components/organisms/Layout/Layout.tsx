import { UserNavigation } from '@/components/molecules/UserNavigation/UserNavigation';

export const Layout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<main className="max-w-7xl w-full mx-auto">
			<div className="container w-full">
				<div className="flex justify-center mt-4 mb-8 md:mb-12">
					<h1 className="heading-xl md:heading-2xl !font-bold text-black text-center capitalize font-lora">
						My Account
					</h1>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-7">
					<UserNavigation />
					{children}
				</div>
			</div>
		</main>
	);
};
