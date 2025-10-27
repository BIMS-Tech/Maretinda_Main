import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

type Props = {
	label: string;
	seeAllText?: string;
};

const Heading = ({ label, seeAllText }: Props) => {
	return (
		<div className="flex items-center justify-between">
			<h2 className="flex gap-4 font-lora heading-lg !font-bold text-primary before:w-5 before:h-10 before:content-[''] before:rounded-xs before:bg-brandPurple before:block">
				{label}
			</h2>
			{seeAllText && (
				<LocalizedClientLink
					className="text-lg text-black underline underline-offset-4 hover:no-underline"
					href="/"
				>
					{seeAllText}
				</LocalizedClientLink>
			)}
		</div>
	);
};

export default Heading;
