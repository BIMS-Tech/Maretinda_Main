/** Whose sign-in an accepted password is, when it opens no shopper account. */
export type SignInAccount = {
	kind: 'seller' | 'applicant' | 'unfinished' | 'other';
	email: string | null;
	first_name?: string | null;
	shop_name?: string | null;
	application_status?: string | null;
	can_shop: boolean;
	existing_shopper?: boolean;
};

export type LoginResult =
	| { ok: true }
	| { ok: false; reason: 'invalid' | 'too_many' | 'failed' | 'existing_shopper' }
	| { ok: false; reason: 'no_shopper_account'; account: SignInAccount };

export type SignUpResult =
	| { ok: true }
	| { ok: false; reason: 'exists' | 'too_many' | 'captcha' | 'failed' };
