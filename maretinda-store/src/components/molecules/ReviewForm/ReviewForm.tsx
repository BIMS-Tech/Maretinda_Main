'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { Button } from '@/components/atoms';
import { InteractiveStarRating } from '@/components/atoms/InteractiveStarRating/InteractiveStarRating';
import { createReview, type Order } from '@/lib/data/reviews';
import { cn } from '@/lib/utils';

import { type ReviewFormData, reviewSchema } from './schema';

interface Props {
	handleClose?: () => void;
	order: Order;
	productId?: string;
}

export const ReviewForm: React.FC<Props> = ({ ...props }) => {
	const methods = useForm<ReviewFormData>({
		defaultValues: {
			opinion: '',
			rating: 0,
			sellerId: '',
		},
		resolver: zodResolver(reviewSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form {...props} />
		</FormProvider>
	);
};

const Form: React.FC<Props> = ({ handleClose, order, productId }) => {
	const [error, setError] = useState<string>();
	const {
		watch,
		handleSubmit,
		register,
		setValue,
		formState: { errors },
	} = useFormContext();

	const submit = async (data: FieldValues) => {
		// Create product review if productId is provided, otherwise seller review
		const body = {
			customer_note: data.opinion,
			order_id: order.id,
			rating: data.rating,
			reference: productId ? 'product' : 'seller',
			reference_id: productId || order.seller.id,
		};

		const response = await createReview(body);

		if (response.error) {
			setError('error');
			return;
		}

		setError('');
		handleClose && handleClose();
	};

	const lettersCount = watch('opinion')?.length;
	const rating = watch('rating');

	return (
		<form onSubmit={handleSubmit(submit)}>
			<div className="space-y-4">
				<div className="max-w-full grid grid-cols-1 items-top gap-4 mb-8">
					<div>
						{/** biome-ignore lint/a11y/noLabelWithoutControl: no need */}
						<label className="label-md !font-medium text-black/40 block mb-2">
							Your rating*
						</label>
						<InteractiveStarRating
							error={!!errors.rating}
							onChange={(value) => setValue('rating', value)}
							value={rating}
						/>
						{errors.rating?.message && (
							<p className="label-sm text-negative mt-1">
								{(errors.rating as FieldError).message}
							</p>
						)}
					</div>

					<label
						className={cn(
							'label-md !font-medium text-black/40 block relative',
						)}
					>
						<p className={cn(error && 'text-negative', 'mb-2')}>
							Your review*
						</p>
						<textarea
							className={cn(
								'w-full px-4 py-3 h-32 border rounded-sm bg-component-secondary focus:border-primary focus:outline-none focus:ring-0 relative',
								error &&
									'border-negative focus:border-negative',
							)}
							placeholder={productId ? "Write your opinion about this product..." : "Write your opinion about this seller..."}
							{...register('opinion')}
						/>
						<div
							className={cn(
								'absolute right-4 label-medium text-secondary',
								errors.opinion?.message
									? 'bottom-8'
									: 'bottom-3 ',
							)}
						>
							{`${lettersCount} / 300`}
						</div>
						{errors.opinion?.message && (
							<p className="label-sm text-negative">
								{(errors.opinion as FieldError).message}
							</p>
						)}
					</label>
				</div>
				{error && <p className="label-md text-negative">{error}</p>}
				<div className="flex justify-end gap-2">
					<Button
						className="w-fit px-2 py-1 bg-white !text-[13px] rounded-[6px] border border-black/10 shadow-sm !font-medium"
						type="button"
					>
						Cancel
					</Button>
					<Button
						className="w-fit px-2 py-1 !text-[13px] !font-medium rounded-[6px]"
						type="submit"
					>
						Submit Review
					</Button>
				</div>
			</div>
		</form>
	);
};
