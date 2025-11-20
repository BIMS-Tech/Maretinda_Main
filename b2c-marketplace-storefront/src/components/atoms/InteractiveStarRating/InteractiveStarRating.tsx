'use client';

import { useState } from 'react';

import { StarIcon } from '@/icons';
import { cn } from '@/lib/utils';

interface Props {
	onChange: (rating: number) => void;
	value?: number;
	error?: boolean;
}

export const InteractiveStarRating = ({
	onChange,
	value = 0,
	error,
}: Props) => {
	const [hoverRating, setHoverRating] = useState(0);

	return (
		<div
			className={cn('flex gap-1', error && 'text-negative')}
			onMouseLeave={() => setHoverRating(0)}
		>
			{[...Array(5)].map((_, index) => {
				const starNumber = index + 1;
				const isActive = hoverRating
					? starNumber <= hoverRating
					: starNumber <= value;

				return (
					<button
						className="p-1 hover:scale-110 transition-transform bg-transparent"
						key={index}
						onClick={() => onChange(starNumber)}
						onMouseEnter={() => setHoverRating(starNumber)}
						type="button"
					>
						<StarIcon
							className={cn(
								isActive
									? '[&>path]:fill-brandYellow'
									: '[&>path]:fill-gray-200',
							)}
							size={24}
						/>
					</button>
				);
			})}
		</div>
	);
};
