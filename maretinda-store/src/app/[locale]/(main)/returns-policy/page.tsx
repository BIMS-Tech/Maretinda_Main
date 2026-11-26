import type { Metadata } from 'next';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const metadata: Metadata = {
	description: 'How to cancel an order, return an item or get a refund on Maretinda.',
	title: 'Returns, refunds and cancellations',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className="flex flex-col gap-2">
		<h2 className="text-[19px] font-semibold text-[#1B1B1B]">{title}</h2>
		<div className="flex flex-col gap-2 text-[15px] leading-relaxed text-black/75">{children}</div>
	</section>
);

/** How returns, refunds and cancellations work, as the system runs them (returns policy, November 2026). */
export default function ReturnsPolicyPage() {
	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
			<p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#432C63]/70">Buyer protection</p>
			<h1 className="mt-2 font-lora text-[34px] font-bold text-[#432C63]">Returns, refunds and cancellations</h1>
			<p className="mt-3 text-[15px] leading-relaxed text-black/70">
				Every approved refund is sent by Maretinda&apos;s accounting team, not by the seller, so your money is protected.
			</p>

			<div className="mt-8 flex flex-col gap-8">
				<Section title="Cancelling an order">
					<p>
						<b>Cash on delivery or not yet paid:</b> cancel it yourself from the order page, free, until the seller starts
						preparing it.
					</p>
					<p>
						<b>Paid online:</b> press Request cancellation on the order page before it ships. We ask the seller to hold it, and
						refund what you paid less the payment processing fee, which the payment provider doesn&apos;t return. If the seller
						cancels instead, you get everything back.
					</p>
					<p>Orders already with the courier, and perishable goods, can&apos;t be cancelled unless the seller agrees.</p>
				</Section>

				<Section title="What you can return">
					<p>Within 7 days of the courier marking your parcel delivered, when the item:</p>
					<ul className="list-disc pl-5">
						<li>arrived damaged, broken or defective</li>
						<li>is the wrong product, size, colour or variation</li>
						<li>is missing parts, accessories or items</li>
						<li>is materially different from the listing, or counterfeit</li>
						<li>is food or a consumable past its expiry date</li>
					</ul>
					<p>And when the parcel never arrived or was lost in transit.</p>
					<p>
						Not covered: a change of mind or ordering the wrong size, damage from misuse, and opened personal care items,
						cosmetics, swimwear, underwear, food, custom-made and digital goods, unless they arrived damaged, expired or wrong.
					</p>
				</Section>

				<Section title="What to send with your request">
					<ul className="list-disc pl-5">
						<li>Clear photos of the problem, with the shipping waybill on the parcel in view.</li>
						<li>
							For a damaged, defective or incomplete item: an unedited unboxing video, from the sealed parcel and its waybill to
							checking the item.
						</li>
						<li>Your GCash, Maya or bank account (InstaPay) for the refund.</li>
					</ul>
					<p>Items you send back must be unused, with all packaging, tags, manuals and freebies.</p>
				</Section>

				<Section title="What happens next">
					<ol className="list-decimal pl-5">
						<li>
							<b>The seller answers within 48 hours:</b> they take it back, refund you without a return, or dispute it with
							proof. No answer in 48 hours means it is approved.
						</li>
						<li>
							<b>You send it back within 5 days</b> of approval and enter the courier and tracking number. What you paid to send
							it is added to your refund.
						</li>
						<li>
							<b>The seller checks it within 48 hours</b> of receiving it. Then we send your refund and email you the reference
							number, date and receipt.
						</li>
					</ol>
					<p>
						If the seller disputes your claim, you can escalate it to Maretinda from your return. We review both sides and
						decide within 7 days. You may then also contact the Department of Trade and Industry.
					</p>
				</Section>

				<Section title="How much and how fast">
					<p>
						For an item that was damaged, wrong, incomplete, not as described or lost: 100% of the item price, plus the original
						delivery fee when you return the whole order.
					</p>
					<p>Online payments are refunded within 7–14 business days of approval; cash on delivery within 3–5.</p>
					<p>
						If a delivery fails because of a wrong address, an unanswered phone or a refused parcel, a prepaid order is refunded
						less the delivery fee, the courier&apos;s return fee and the payment processing fee. Repeated failed cash-on-delivery
						orders mean cash on delivery is no longer offered on your account.
					</p>
				</Section>

				<p className="text-[14px] text-black/60">
					Questions? Write to support@maretinda.com. Start a return from{' '}
					<LocalizedClientLink className="text-[#432C63] underline" href="/user/orders">
						your orders
					</LocalizedClientLink>
					.
				</p>
			</div>
		</main>
	);
}
