import type { ReactNode } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MaskedText } from '@/components/motion';

/** The title of a page of the account area. */
export const AccountHeading = ({ title, note, aside }: { title: string; note?: ReactNode; aside?: ReactNode }) => (
	<div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
		<div>
			<h2 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-[#1B1B1B] lg:text-[34px]">
				<MaskedText play text={title} />
			</h2>
			{note && <p className="rise-in mt-1.5 text-[14px] text-[#737373]">{note}</p>}
		</div>
		{aside}
	</div>
);

/** What a page of the account area says while there is nothing in it. */
export const AccountEmpty = ({ icon, title, children, href, action }: { icon: ReactNode; title: string; children: ReactNode; href?: string; action?: string }) => (
	<div className="rise-in flex flex-col items-center px-4 py-12 text-center">
		<span className="pop-in mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F6F2FB] text-[#432C63]">{icon}</span>
		<h3 className="text-[17px] font-bold text-[#1B1B1B]">{title}</h3>
		<p className="mt-1 max-w-md text-[13.5px] leading-relaxed text-[#737373]">{children}</p>
		{href && (
			<LocalizedClientLink className="press mt-6 inline-flex h-11 items-center rounded-full bg-[#432C63] px-6 text-[13.5px] font-bold text-white hover:bg-[#372248]" href={href}>
				{action}
			</LocalizedClientLink>
		)}
	</div>
);
