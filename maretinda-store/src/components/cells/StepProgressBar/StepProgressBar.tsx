import { LuCheck, LuCircle } from 'react-icons/lu';

import { cn } from '@/lib/utils';

export const StepProgressBar = ({
	steps,
	currentStep,
}: {
	steps: string[];
	currentStep: number;
}) => {
	const length = steps.length || 0;

	return (
		<div className={`grid grid-cols-${length} h-[74px]`}>
			{steps.map((step, index) => (
				<div className="relative" key={step}>
					<p
						className={cn(
							'text-center text-sm sm:text-base text-primary',
							index <= currentStep
								? '!font-bold'
								: '!font-normal text-black/65',
						)}
					>
						{step}
					</p>
					<div className="absolute bottom-2 left-0 w-full flex items-center justify-center">
						<div
							className={cn(
								'absolute left-0 w-1/2 border',
								index <= currentStep
									? 'border-[#0043CE]'
									: 'border-[#C6C6C6]',
							)}
						/>
						<div
							className={cn(
								'absolute left-1/2 w-1/2 border',
								index + 1 <= currentStep
									? 'border-[#0043CE]'
									: 'border-[#C6C6C6]',
								currentStep === steps.length - 1
									? 'border-[#0043CE]'
									: '',
							)}
						/>
						<div
							className={cn(
								'flex items-center justify-center w-6 h-6 border rounded-full mx-auto z-10 bg-tertiary',
								index <= currentStep
									? 'bg-secondary border-[#0043CE]'
									: 'bg-secondary border-[#C6C6C6]',
								index + 1 <= currentStep &&
									'bg-[#0043CE] border-[#0043CE]',
							)}
						>
							{index + 1 <= currentStep ? (
								<LuCheck className="text-white" size={14} />
							) : (
								index <= currentStep && (
									<LuCircle
										className="bg-[#0043CE] rounded-full"
										size={5}
									/>
								)
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};
