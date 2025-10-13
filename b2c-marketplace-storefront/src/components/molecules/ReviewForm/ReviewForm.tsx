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
import { createReview, type Order, Review } from '@/lib/data/reviews';
import { cn } from '@/lib/utils';

import { type ReviewFormData, reviewSchema } from './schema';

interface Props {
	handleClose?: () => void;
	seller: Order;
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

const Form: React.FC<Props> = ({ handleClose, seller }) => {
	const [error, setError] = useState<string>();
	const {
		watch,
		handleSubmit,
		register,
		setValue,
		formState: { errors },
	} = useFormContext();

	const submit = async (data: FieldValues) => {
		const body = {
			customer_note: data.opinion,
			order_id: seller.id,
			rating: data.rating,
			reference: 'seller',
			reference_id: seller.seller.id,
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
			<div className="px-4 space-y-4">
				<div className="max-w-full grid grid-cols-1 items-top gap-4 mb-4">
					<div>
						<label className="label-sm block mb-2">Rating</label>
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

					<label className={cn('label-sm block relative')}>
						<p className={cn(error && 'text-negative')}>
							Your opinion
						</p>
						<textarea
							className={cn(
								'w-full px-4 py-3 h-32 border rounded-sm bg-component-secondary focus:border-primary focus:outline-none focus:ring-0 relative',
								error &&
									'border-negative focus:border-negative',
							)}
							placeholder="Write your opinion about this seller..."
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
				<Button className="w-full">SUBMIT REVIEW</Button>
			</div>
		</form>
	);
};
