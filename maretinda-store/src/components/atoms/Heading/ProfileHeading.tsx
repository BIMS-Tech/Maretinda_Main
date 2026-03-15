import { Heading } from '@medusajs/ui';

import { Button, Card } from '@/components/atoms';
import { cn } from '@/lib/utils';

type Props = {
	className?: string;
	title: string;
	buttonText: string;
	onButtonClick?: () => void;
};
export const ProfileHeading = ({
	className,
	title,
	buttonText,
	onButtonClick,
}: Props) => {
	return (
		<Card
			className={cn(
				'bg-brand',
				'py-4 px-[34px]',
				'flex justify-between items-center',
				'border-[1px] border-b-0 border-solid border-[#00000026]',
				'rounded-t-[23px] rounded-b-none',
				'shadow-[0px_4px_8px_0px_#00000014,_0px_2px_4px_0px_#00000014,_0px_0px_0px_1px_#00000014]',
				className,
			)}
		>
			<Heading
				className="font-semibold text-black text-[20px]"
				level="h2"
			>
				{title}
			</Heading>
			<Button
				className="font-medium text-[13px] py-[10.5px] px-[16.5px]"
				onClick={onButtonClick}
			>
				{buttonText}
			</Button>
		</Card>
	);
};
