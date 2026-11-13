'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/** A page failed to load; the header and footer stay, and the buyer can retry. */
export default function PageError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="max-w-[560px] mx-auto px-4 py-20 text-center">
			<h1 className="font-serif text-[30px] text-[#1B1B1B] mb-3">
				Something went wrong
			</h1>
			<p className="text-[14.5px] leading-relaxed text-[#737373] mb-7">
				This page could not be loaded. Your cart and orders are safe.
				Please try again, and if it keeps happening write to
				support@maretinda.com.
			</p>
			<div className="flex items-center justify-center gap-3">
				<button
					className="h-11 px-7 rounded-full text-[13.5px] font-bold text-white bg-[#432C63] hover:opacity-90"
					onClick={() => reset()}
					type="button"
				>
					Try again
				</button>
				<Link
					className="h-11 px-7 rounded-full text-[13.5px] font-semibold text-[#432C63] border border-[#DCDCDC] flex items-center"
					href="/"
				>
					Back to home
				</Link>
			</div>
			{error?.digest && (
				<p className="text-[12px] text-[#ACACAC] mt-6">
					Reference: {error.digest}
				</p>
			)}
		</main>
	);
}
