'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Textarea } from '@/components/atoms';
import { cn } from '@/lib/utils';

import { SelectField } from '../SelectField/SelectField';

const reasonOptions = [
	{ hidden: true, label: '', value: '' },
	{
		label: 'Trademark, Copyright or DMCA Violation',
		value: 'Trademark, Copyright or DMCA Violation',
	},
];

const formSchema = z.object({
	comment: z.string().nonempty('Please add comment'),
	reason: z.string().nonempty('Please select reason'),
});

type FormData = z.infer<typeof formSchema>;

export const ReportSellerForm = ({ onClose }: { onClose: () => void }) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		clearErrors,
	} = useForm<FormData>({
		defaultValues: {
			comment: '',
			reason: '',
		},
		resolver: zodResolver(formSchema),
	});

	const onSubmit = (data: FormData) => {
		console.log('Form Data:', data);
	};

	return (
		<div>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="px-4 pb-2">
					<label className="label-sm">
						<p
							className={cn(
								errors?.reason && 'text-negative',
								'text-sm font-medium mb-4',
							)}
						>
							Reason<span className="text-red-500/50">*</span>
						</p>
						<SelectField
							options={reasonOptions}
							{...register('reason')}
							className={cn(
								errors?.reason && 'border-negative',
								'bg-white',
							)}
							selectOption={(value) => {
								setValue('reason', value);
								clearErrors('reason');
							}}
						/>
						{errors?.reason && (
							<p className="label-sm text-negative">
								{errors.reason.message}
							</p>
						)}
					</label>

					<label className="label-sm">
						<p
							className={cn(
								'mt-5 mb-4',
								errors?.comment && 'text-negative',
								'text-sm font-medium',
							)}
						>
							Comment
							<span className="text-red-500/50">*</span>
						</p>
						<Textarea
							rows={5}
							{...register('comment')}
							className={cn(
								errors.comment && 'border-negative',
								'bg-white focus:border-[#2563EB] focus:outline-none focus:ring-2',
							)}
						/>
						{errors?.comment && (
							<p className="label-sm text-negative">
								{errors.comment.message}
							</p>
						)}
					</label>
				</div>

				<div className="flex justify-end gap-2 px-4 pt-5">
					<Button
						className="w-fit px-2 py-1 bg-white border border-black/10 shadow-sm font-medium"
						onClick={onClose}
						type="button"
					>
						Cancel
					</Button>
					<Button
						className="w-fit px-2 py-1 font-medium"
						type="submit"
					>
						Report Seller
					</Button>
				</div>
			</form>
		</div>
	);
};
