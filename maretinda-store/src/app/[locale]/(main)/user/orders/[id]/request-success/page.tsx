import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { Layout } from '@/components/organisms';
import { account } from '@/lib/account-styles';

/** After asking for a return: what happens next, and where to follow it. */
export default async function RequestSuccessPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return (
		<Layout>
			<div className="md:col-span-3">
				<section
					className="rounded-2xl border border-[#432C63]/[0.08] bg-gradient-to-br from-[#F6F2FB] to-white px-6 py-9 text-center shadow-[0_4px_24px_rgba(67,44,99,0.08)] sm:px-10"
					data-testid="return-requested-page"
				>
					<p className={account.eyebrow}>Return</p>
					<h1 className="mt-2 font-serif text-[30px] leading-tight text-[#432C63] sm:text-[38px]">
						Your request is with the seller
					</h1>
					<ol className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-left text-[14px] leading-relaxed text-black/70">
						<li>
							<span className="font-semibold text-[#1B1B1B]">1. The seller answers within 48 hours.</span> With no
							answer, it is approved for you.
						</li>
						<li>
							<span className="font-semibold text-[#1B1B1B]">2. If the item goes back,</span> you send it within 5 days
							and add the tracking number on your return.
						</li>
						<li>
							<span className="font-semibold text-[#1B1B1B]">3. Maretinda sends your refund</span> to the account you
							gave, and emails you the reference.
						</li>
					</ol>
					<p className="mt-5 text-[13px] text-black/55">We email you at each step.</p>
					<div className="mt-7 flex flex-wrap justify-center gap-3">
						<LocalizedClientLink className={account.primaryButton} href={`/user/returns${id ? `?return=${id}` : ''}`}>
							Follow your return
						</LocalizedClientLink>
						<LocalizedClientLink className={account.outlineButton} href="/user/orders">
							Back to your orders
						</LocalizedClientLink>
					</div>
				</section>
			</div>
		</Layout>
	);
}
