import { StarIcon } from '@/icons';

import tailwindConfig from '../../../../tailwind.config';

export const StarRating = ({
	rate,
	starSize = 20,
	disabled,
}: {
	rate: number;
	starSize?: number;
	disabled?: boolean;
}) => {
	return (
		<div className="flex">
			{[...Array(Math.floor(rate))].map((_, i) => {
				const starColor =
					i < Math.floor(rate)
						? disabled
							? tailwindConfig.theme.extend.colors.disabled
							: tailwindConfig.theme.extend.colors.brand.cta
						: tailwindConfig.theme.extend.colors.action.on.tertiary;
				return <StarIcon color={starColor} key={i} size={starSize} />;
			})}
		</div>
	);
};
