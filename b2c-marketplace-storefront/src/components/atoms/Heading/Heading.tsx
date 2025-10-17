type Props = {
	label: string;
};

const Heading = ({ label }: Props) => {
	return (
		<h2 className="flex gap-4 font-lora heading-lg !font-bold text-primary before:w-5 before:h-10 before:content-[''] before:rounded-xs before:bg-brandPurple before:block">
			{label}
		</h2>
	);
};

export default Heading;
