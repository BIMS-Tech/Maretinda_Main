// import { format } from 'date-fns';

import type { ReactNode } from 'react';

import { Button } from '@/components/atoms';

import { ProfileDetailsAccordionItems } from './ProfileDetailsAccordionItems';

type ProfileContent = {
	label: string;
	value: string;
};

export const ProfileDetailsAccordion = ({
	title,
	buttonText,
	onButtonClick,
	contents,
}: {
	title: string;
	buttonText: string;
	onButtonClick: () => void;
	contents: (ProfileContent | string | ReactNode)[];
}) => {
	return (
		<div className="shadow-[0px_4px_6px_-6px_rgba(0,_0,_0,_0.25)] border rounded-t-[23px] rounded-b-sm overflow-hidden border-black/15">
			<div className="flex flex-col sm:flex-row ms:items-center text-secondary border-b border-b-black/15 bg-brandPurpleLighten py-4 px-6 gap-5 md:gap-10 w-full">
				<div className="flex-1 w-full flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-4">
					<div className="flex justify-start lg:w-[22%]">
						<h2 className="label-lg text-black">{title}</h2>
					</div>
				</div>

				<div className="flex lg:justify-end items-center gap-4">
					<Button
						className="min-w-[90px] capitalize text-[13px] !font-medium p-2.5"
						onClick={onButtonClick}
					>
						{buttonText}
					</Button>
				</div>
			</div>
			<div className="py-2">
				<ul className="w-full divide-y">
					{contents.map((content, index) => {
						return (
							<ProfileDetailsAccordionItems
								content={content}
								// biome-ignore lint/suspicious/noArrayIndexKey: Index will not change on re-renders
								key={index}
							/>
						);
					})}
				</ul>
			</div>
		</div>
	);
};
