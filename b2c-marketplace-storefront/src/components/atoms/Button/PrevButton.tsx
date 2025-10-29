import { ChevronLeft } from '@medusajs/icons';
import type { CustomArrowProps } from 'react-slick';

const PrevButton = ({ onClick }: CustomArrowProps) => {
	return (
		<button
			className="arrow-button arrow-left left-1 sm:left-8"
			onClick={onClick}
			type="button"
		>
			<ChevronLeft />
		</button>
	);
};

export default PrevButton;
