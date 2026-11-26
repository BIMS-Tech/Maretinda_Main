import type { Metadata } from 'next';

import { sdk } from '@/lib/config';

export const metadata: Metadata = {
	robots: { follow: false, index: false },
	title: 'Check a document',
};

type Found = {
	number: string;
	document: 'invoice' | 'statement' | 'summary' | 'credit_note' | 'adjustment';
	official: boolean;
	issued_at: string;
	issuer: string | null;
	issuer_tin: string | null;
	total: number;
	credited: number;
	corrects: string | null;
};

const LABELS: Record<Found['document'], string> = {
	adjustment: 'Billing adjustment',
	credit_note: 'Credit note',
	invoice: 'Invoice',
	statement: 'Billing statement',
	summary: 'Order summary',
};

const peso = (n: number) =>
	new Intl.NumberFormat('en-PH', { currency: 'PHP', style: 'currency' }).format(n);

/**
 * What the QR code on a Maretinda document opens: whether it was really
 * issued here, by whom, when, and for how much. Never who it was sold to.
 */
export default async function VerifyInvoicePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const found = await sdk.client
		.fetch<{ document: Found }>(`/store/invoice-verify/${encodeURIComponent(id)}`, { cache: 'no-store' })
		.then((r) => r.document)
		.catch(() => null);

	const rows: [string, string][] = found
		? [
				['Document', LABELS[found.document] ?? 'Invoice'],
				['Number', found.number],
				['Issued by', [found.issuer, found.issuer_tin ? `TIN ${found.issuer_tin}` : null].filter(Boolean).join(', ')],
				[
					'Date',
					new Date(found.issued_at).toLocaleString('en-PH', {
						dateStyle: 'long',
						timeStyle: 'short',
						timeZone: 'Asia/Manila',
					}),
				],
				[found.corrects ? 'Credited' : 'Total', peso(found.total)],
				...(found.corrects ? ([['Corrects', found.corrects]] as [string, string][]) : []),
				...(found.credited ? ([['Credited since', `− ${peso(found.credited)}`]] as [string, string][]) : []),
			]
		: [];

	return (
		<main className="min-h-[60vh] py-10 md:py-16" style={{ backgroundColor: '#FAF8F5' }}>
			<div className="max-w-[520px] mx-auto px-4">
				<h1 className="font-serif text-[30px] text-[#1B1B1B] mb-6 text-center">Check a document</h1>
				<div className="bg-white rounded-2xl shadow-sm p-7" data-testid="verify-invoice" style={{ border: '1px solid #EDEAE3' }}>
					{found ? (
						<>
							<p className="text-[15px] font-semibold text-green-700">This document was issued through Maretinda.</p>
							{!found.official && (
								<p className="mt-2 text-[13.5px] text-[#737373]">
									It is not a BIR invoice: it says so on the document.
								</p>
							)}
							<dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[14px]">
								{rows.map(([label, value]) => (
									<div className="contents" key={label}>
										<dt className="text-[#737373]">{label}</dt>
										<dd className="text-[#1B1B1B] font-medium tabular-nums">{value}</dd>
									</div>
								))}
							</dl>
							<p className="mt-5 text-[12.5px] text-[#737373]">
								Check that these match the paper or PDF you have. If they don&apos;t, write to support@maretinda.com.
							</p>
						</>
					) : (
						<>
							<p className="text-[15px] font-semibold text-red-600">We can&apos;t find a document with this code.</p>
							<p className="mt-2 text-[13.5px] text-[#737373]">
								It wasn&apos;t issued through Maretinda, or the code was typed wrong. If someone gave you this document,
								write to support@maretinda.com.
							</p>
						</>
					)}
				</div>
			</div>
		</main>
	);
}
