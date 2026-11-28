import { LuCheck } from 'react-icons/lu';

import { cn } from '@/lib/utils';

/**
 * Steps in a row: done ones filled in the brand purple with a tick, the
 * current one ringed, later ones grey, joined by a line that fills as the
 * order moves on. Reaching the last step counts as done.
 *
 * The steps share the width with flex, not with a grid-cols-N class built at
 * runtime: Tailwind only ships classes written out in full, so those vanished
 * and stacked the steps on top of each other.
 */
export const StepProgressBar = ({
	steps,
	currentStep,
}: {
	steps: string[];
	currentStep: number;
}) => {
	const finished = currentStep >= steps.length - 1;

	return (
		<ol
			aria-label="Order progress"
			className="flex w-full items-start"
			data-step={currentStep}
		>
			{steps.map((step, index) => {
				const done = index < currentStep || (finished && index === currentStep);
				const current = index === currentStep && !done;
				const reached = index <= currentStep;
				return (
					<li
						aria-current={current ? 'step' : undefined}
						className="relative flex flex-1 flex-col items-center text-center"
						key={step}
					>
						{index > 0 && (
							<span
								aria-hidden
								className={cn(
									'absolute right-1/2 top-[13px] h-0.5 w-full',
									reached ? 'bg-brandPurple' : 'bg-black/15',
								)}
							/>
						)}
						<span
							className={cn(
								'relative z-10 flex size-7 items-center justify-center rounded-full border-2 transition-colors',
								done
									? 'border-brandPurple bg-brandPurple text-white'
									: current
										? 'border-brandPurple bg-white'
										: 'border-black/20 bg-white',
							)}
						>
							{done ? (
								<LuCheck aria-hidden size={14} strokeWidth={3} />
							) : current ? (
								<span className="size-2.5 rounded-full bg-brandPurple" />
							) : null}
						</span>
						<span
							className={cn(
								'mt-2 px-1 text-[12px] leading-tight sm:text-sm',
								reached ? 'font-semibold text-brandPurple' : 'text-black/55',
							)}
						>
							{step}
						</span>
					</li>
				);
			})}
		</ol>
	);
};
