'use client';

import { Session } from '@talkjs/react';
import Talk from 'talkjs';
import { useCallback } from 'react';

type User = {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone?: string;
};

type TalkJSProviderProps = {
	appId?: string;
	user: User | null;
	children: React.ReactNode;
};

export function TalkJSProvider({ appId, user, children }: TalkJSProviderProps) {
	const syncUser = useCallback(() => {
		if (!user) return new Talk.User({ id: 'anonymous', name: 'Anonymous' });

		return new Talk.User({
			id: user.id,
			name: `${user.first_name} ${user.last_name}`,
			email: user.email,
			phone: user.phone,
			role: 'customer',
		});
	}, [user]);

	if (!appId || !user) {
		return <>{children}</>;
	}

	return (
		<Session appId={appId} syncUser={syncUser}>
			{children}
		</Session>
	);
}

