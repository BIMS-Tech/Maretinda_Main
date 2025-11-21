import Medusa from '@medusajs/js-sdk';

// Defaults to standard port for Medusa server
const MEDUSA_BACKEND_URL =
	process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

export const sdk = new Medusa({
	baseUrl: MEDUSA_BACKEND_URL,
	debug: process.env.NODE_ENV === 'development',
	publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_3ad019daf80f5cf6368abbb8bcae8f5694b15a8480728313ba87fd2e6eb02036',
});
