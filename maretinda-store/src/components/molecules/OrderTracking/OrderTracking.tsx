import { getAuthHeaders } from '@/lib/data/cookies';

type Tracking = {
	courier: string | null;
	parcels: { tracking_number: string; tracking_url: string | null }[];
	delivered_at: string | null;
	return_until: string | null;
};

const day = (d: string) =>
	new Date(d).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', timeZone: 'Asia/Manila', year: 'numeric' });

async function fetchTracking(orderId: string): Promise<Tracking | null> {
	try {
		const res = await fetch(
			`${process.env.MEDUSA_BACKEND_URL}/store/account/orders/${encodeURIComponent(orderId)}/tracking`,
			{
				cache: 'no-store',
				headers: {
					...(await getAuthHeaders()),
					'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
				},
			},
		);
		return res.ok ? await res.json() : null;
	} catch {
		return null;
	}
}

/** The parcel's tracking number and link, and the last day to ask for a return. */
export const OrderTracking = async ({ orderId }: { orderId: string }) => {
	const tracking = await fetchTracking(orderId);
	if (!tracking || (!tracking.parcels.length && !tracking.delivered_at)) return null;

	const returnOpen = tracking.return_until && new Date(tracking.return_until) > new Date();

	return (
		<div className="flex flex-col gap-1.5 text-[13px] text-primary" data-testid="order-tracking">
			{tracking.parcels.map((p) => (
				<p key={p.tracking_number}>
					{tracking.courier ? `${tracking.courier} tracking` : 'Tracking'}:{' '}
					<span className="font-semibold">{p.tracking_number}</span>
					{p.tracking_url && (
						<>
							{' · '}
							<a className="underline font-medium" href={p.tracking_url} rel="noreferrer" target="_blank">
								Track parcel
							</a>
						</>
					)}
				</p>
			))}
			{tracking.delivered_at && (
				<p className="text-secondary">
					Delivered {day(tracking.delivered_at)}.
					{tracking.return_until &&
						(returnOpen
							? ` You can ask for a return until ${day(tracking.return_until)}.`
							: ' The return period has ended.')}
				</p>
			)}
		</div>
	);
};
