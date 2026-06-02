import { UserNavigation } from '@/components/molecules/UserNavigation/UserNavigation';
import { retrieveCustomer } from '@/lib/data/customer';

export const Layout = async ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const user = await retrieveCustomer();

	return (
		<main className="max-w-7xl w-full mx-auto">
			<div className="container w-full">
				<div className="flex flex-col items-center mt-6 mb-10 md:mb-14 gap-3">
					<h1 className="heading-xl md:heading-2xl !font-bold text-black text-center capitalize font-lora">
						My Account
					</h1>
					<span className="h-[3px] w-12 rounded-full bg-brandPurple block" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-7">
					<UserNavigation user={user} />
					{children}
				</div>
			</div>
		</main>
	);
};
