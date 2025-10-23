import { ChevronRight } from '@medusajs/icons';
import type { CustomArrowProps } from 'react-slick';

const NextButton = ({ onClick }: CustomArrowProps) => {
	return (
		<button
			className="arrow-button right-1 sm:right-8"
			onClick={onClick}
			type="button"
		>
			<ChevronRight />
		</button>
	);
};

export default NextButton;
