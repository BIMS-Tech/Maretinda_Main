'use client';

import { type ReactNode, useEffect, useState } from 'react';

/** Off for the first page, so nothing delays it; on for every page opened after. */
let visited = false;

export function PageEnter({ children }: { children: ReactNode }) {
	const [animate] = useState(() => visited);
	useEffect(() => {
		visited = true;
	}, []);
	return <div className={animate ? 'page-enter' : undefined}>{children}</div>;
}
