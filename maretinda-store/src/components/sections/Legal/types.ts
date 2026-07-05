// Shared content model for the Terms and Privacy legal pages.
// Content is transcribed from the official Maretinda legal documents so the
// rendered pages stay a single source of truth that is easy to amend later.

export type LegalBlock =
	| { type: 'p'; text: string }
	| { type: 'ul'; items: string[] }
	| { type: 'h3'; text: string }
	| { type: 'callout'; text: string }
	| { type: 'table'; columns: string[]; rows: string[][] };

export type LegalSection = {
	id: string;
	num: string;
	title: string;
	blocks: LegalBlock[];
};

export type LegalDoc = {
	key: string;
	// Short label used on the Buyer / Seller toggle.
	tab: string;
	// Full document title shown in the hero.
	title: string;
	subtitle: string;
	effective: string;
	intro: LegalBlock[];
	sections: LegalSection[];
};

export type LegalPageProps = {
	eyebrow: string;
	heading: string;
	tagline: string;
	docs: LegalDoc[];
};
