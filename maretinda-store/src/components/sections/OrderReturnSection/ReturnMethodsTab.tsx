import { Card, Checkbox } from '@/components/atoms';
import { sellerAddressLines } from '@/lib/helpers/seller-address';

export const ReturnMethodsTab = ({
	shippingMethods,
	handleSetReturnMethod,
	returnMethod,
	seller,
}: {
	shippingMethods: any;
	handleSetReturnMethod: (method: any) => void;
	returnMethod: string;
	seller: any;
}) => {
	const noShippingMethods = !shippingMethods?.length || false;

	return (
		<>
			<div className="mb-8">
				<Card className="bg-secondary p-4">
					<p className="label-lg uppercase">Return methods</p>
				</Card>
				<Card className="flex items-center justify-between p-4">
					{noShippingMethods ? (
						<div className="py-4 text-center font-bold heading-md w-full">
							No shipping methods available
						</div>
					) : (
						<ul>
							{shippingMethods.map((method: any) => (
								<li
									className="flex items-center gap-4 my-2 cursor-pointer"
									key={method.id}
									onClick={() =>
										handleSetReturnMethod(method.id)
									}
								>
									<Checkbox
										checked={returnMethod === method.id}
									/>
									<span className="label-lg">
										{method.name}
									</span>
								</li>
							))}
						</ul>
					)}
				</Card>
			</div>
			<div>
				<Card className="bg-secondary p-4">
					<p className="label-lg uppercase">Shipping address</p>
				</Card>
				<Card className="p-4">
					<p className="label-lg">{seller.name}</p>
					{sellerAddressLines(seller).map((line) => (
						<p className="label-md" key={line}>
							{line}
						</p>
					))}
				</Card>
			</div>
		</>
	);
};
