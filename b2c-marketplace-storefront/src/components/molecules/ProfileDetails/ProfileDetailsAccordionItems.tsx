'use client';

import { isString } from 'lodash';
import type { ReactNode } from 'react';

import { Card } from '@/components/atoms';

type ProfileContent = {
	label: string;
	value: string;
};

export const ProfileDetailsAccordionItems = ({
	content,
}: {
	content: ProfileContent | string | ReactNode;
}) => {
	const isProfileContent = (value: unknown): value is ProfileContent => {
		return (
			typeof value === 'object' &&
			value != null &&
			'label' in value &&
			'value' in value &&
			// biome-ignore lint/suspicious/noExplicitAny: Value can be anything
			typeof (value as any).label === 'string' &&
			// biome-ignore lint/suspicious/noExplicitAny: Value can be anything
			typeof (value as any).value === 'string'
		);
	};

	return (
		<Card className="border-0 p-0 rounded-none">
			<div className="flex flex-col sm:flex-row ms:items-center w-full hover:bg-component-secondary/40 p-4 px-6 gap-5 md:gap-10 transition-all duration-300">
				<div className="flex-1 w-full flex flex-col gap-1.5 lg:gap-4 text-black text-base">
					{isProfileContent(content) ? (
						<div className="">
							<p className="label-md !font-normal capitalize">
								{content.label}
							</p>
							<p className="label-lg font-bold">
								{content.value}
							</p>
						</div>
					) : isString(content) ? (
						<p className="label-lg !font-normal">{content}</p>
					) : (
						content
					)}
				</div>
			</div>
		</Card>
	);
};
