import { Badge } from '@medusajs/ui';

const PaymentTest = ({ className }: { className?: string }) => {
	return (
		<Badge className={className} color="orange">
			<span className="font-semibold px-4">Attention:</span> For testing
			purposes only.
		</Badge>
	);
};

export default PaymentTest;
