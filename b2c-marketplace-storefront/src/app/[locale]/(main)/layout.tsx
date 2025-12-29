import { Footer, Header } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';
import { TalkJSProvider } from '@/providers/TalkJSProvider';

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const APP_ID = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
	const user = await retrieveCustomer();

	return (
		<TalkJSProvider appId={APP_ID} user={user}>
			<Header />
			{children}
			<Footer />
		</TalkJSProvider>
	);
}
