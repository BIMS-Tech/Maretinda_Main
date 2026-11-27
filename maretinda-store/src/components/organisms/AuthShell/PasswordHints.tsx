'use client';

import { validatePassword } from '@/lib/helpers/password';
import { useLanguage } from '@/providers/LanguageProvider';

const Hint = ({ met, label }: { met: boolean; label: string }) => (
	<span className={`flex items-center gap-1.5 text-[11.5px] transition-colors duration-300 ${met ? 'text-[#1F7A4D]' : 'text-[#ACACAC]'}`}>
		<span className={`inline-block h-1.5 w-1.5 rounded-full transition-[background-color,transform] duration-300 ${met ? 'scale-125 bg-[#1F7A4D]' : 'bg-[#DCDCDC]'}`} />
		{label}
	</span>
);

/** The password rule as a checklist that fills in while typing. */
export function PasswordHints({ password }: { password: string }) {
	const { t } = useLanguage();
	const h = t.auth.reset.hints;
	if (!password) return null;
	const { errors } = validatePassword(password);
	return (
		<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
			<Hint label={h.long} met={!errors.tooShort} />
			<Hint label={h.upper} met={!errors.noUpper} />
			<Hint label={h.lower} met={!errors.noLower} />
			<Hint label={h.digit} met={!errors.noDigitOrSymbol} />
		</div>
	);
}
