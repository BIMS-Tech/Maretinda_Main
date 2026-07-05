import type { LegalDoc, LegalSection } from './types';

// Sections that are shared verbatim between the Buyer and Seller privacy policies.

const dataSubjectDefinitions = [
	'Personal data — refers to all types of personal information and sensitive personal information.',
	'Personal Information — refers to any information, whether recorded in a material form or not, from which the identity of an individual is apparent or can be reasonably and directly ascertained by the entity holding the information, or when put together with other information would directly and certainly identify an individual.',
];

const sensitivePersonalInfo =
	'Sensitive Personal Information — refers to personal information: (1) about an individual’s race, ethnic origin, marital status, age, color, and religious, philosophical, or political affiliations; (2) about an individual’s health, education, genetic or sexual life, or to any proceeding for any offense committed or alleged to have been committed; (3) issued by government agencies peculiar to an individual, including social security numbers, health records, licenses, and tax returns; and (4) specifically established by an executive order or act of Congress to be kept classified.';

const rightsSection = (id: string): LegalSection => ({
	id,
	num: '7',
	title: 'Your Data Protection Rights',
	blocks: [
		{
			type: 'p',
			text: 'We want to make sure that you are fully aware of all your data protection rights. As a data subject, you have the following rights under the DPA, which you may exercise at your discretion:',
		},
		{
			type: 'ul',
			items: [
				'The right to be informed — whether personal data pertaining to you will be, are being, or were processed.',
				'The right to access personal data — you may request access to your personal data, including its contents, the manner in which it was processed, and the date it was last processed or modified.',
				'The right to object — to the processing of your personal data, including processing for direct marketing, automated processing, or profiling.',
				'The right to erasure or blocking — to suspend, withdraw, or order the blocking, removal, or destruction of your personal data from our filing system.',
				'The right to lodge a complaint before the National Privacy Commission (NPC) — if you feel your rights have been violated or your personal data has been misused, maliciously disclosed, or improperly disposed of.',
				'The right to damages — to be indemnified for any damages sustained due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of personal data.',
			],
		},
	],
});

const securitySection = (id: string): LegalSection => ({
	id,
	num: '8',
	title: 'Security Measures',
	blocks: [
		{
			type: 'p',
			text: 'BIMS maintains appropriate organizational, physical, and technical measures, including maintaining records of processing activities and a data retention schedule, and designating accountable officers where appropriate. As an e-marketplace, we take necessary precautions to protect consumer data privacy and comply with minimum information security standards under applicable rules.',
		},
		{
			type: 'p',
			text: 'Specifically, we implement the following administrative, physical, and technical protections:',
		},
		{
			type: 'ul',
			items: [
				'TLS 1.2+ encryption for data in transit and AES-256 for data at rest;',
				'Role-based access controls, MFA, and password hashing (bcrypt);',
				'Secure APIs and token-based authentication;',
				'Audit logs, monitoring systems, and incident response procedures;',
				'PCI-DSS-compliant payment processing via third-party partners.',
			],
		},
	],
});

const retentionSection = (id: string, subjectLabel: string): LegalSection => ({
	id,
	num: '6',
	title: 'Data Storage and Retention',
	blocks: [
		{
			type: 'p',
			text: 'BIMS stores personal information in secure and encrypted cloud-based systems and implements appropriate administrative, technical, and organizational safeguards designed to protect personal data against unauthorized access, disclosure, alteration, loss, destruction, or other unlawful processing.',
		},
		{
			type: 'p',
			text: 'Personal information shall be retained only for as long as necessary to fulfill the purposes for which it was collected. Upon expiration of the applicable retention period, personal information shall be securely deleted or otherwise disposed of in accordance with BIMS’ data retention and disposal policies, unless a longer retention period is required by law or is reasonably necessary for ongoing investigations, litigation, audits, or dispute resolution.',
		},
		{
			type: 'p',
			text: 'Unless otherwise required by applicable law, BIMS’ general retention schedule is as follows:',
		},
		{
			type: 'table',
			columns: ['Record Type', 'Retention Period'],
			rows: [
				[
					`${subjectLabel} Account Information`,
					'As long as the account remains active and for a reasonable period thereafter to comply with legal obligations, resolve disputes, or enforce agreements.',
				],
				[
					'Transaction Records & Financial Documentation',
					'A minimum of five (5) to seven (7) years, or longer where required under accounting, taxation, or regulatory requirements.',
				],
				[
					'Refund & Dispute Resolution Records',
					'A minimum of three (3) years following resolution of the relevant transaction or dispute.',
				],
				[
					'System Logs',
					'Approximately thirty (30) to ninety (90) days for operational, security, and troubleshooting purposes.',
				],
				[
					'Audit Logs',
					'Up to seven (7) years to support internal controls, investigations, audits, regulatory compliance, and security monitoring.',
				],
				[
					'Backup Data',
					'Retained and securely purged in accordance with BIMS’ official backup, business continuity, and data retention policies.',
				],
			],
		},
	],
});

const introBlocks = (subject: string) =>
	[
		{
			type: 'p' as const,
			text: `Maretinda (“BIMS,” “we,” “us,” or “our”) recognizes the importance of protecting the privacy of ${subject}. This Privacy Policy explains how we collect, use, store, disclose, and protect information relating to you.`,
		},
		{
			type: 'p' as const,
			text: 'This Privacy Policy shall be read together with the Terms and Conditions. By using the Platform, you acknowledge and consent to the collection and processing of personal information in accordance with this Privacy Policy and applicable laws.',
		},
		{
			type: 'p' as const,
			text: 'We follow the data privacy principles of transparency, legitimate purpose, and proportionality, and provide the information required to be disclosed to data subjects under Philippine law, including the recipients of data, the purpose, and the retention period [Republic Act No. 10173, the Data Privacy Act of 2012 (“DPA”)]. As an e-marketplace, we also comply with minimum information security standards required by law (Republic Act No. 11967, the Internet Transactions Act of 2023).',
		},
	];

const buyerPrivacy: LegalDoc = {
	key: 'buyer',
	tab: 'For Buyers',
	title: 'User Privacy Policy',
	subtitle:
		'How Maretinda collects, uses, and protects the personal information of Buyers.',
	effective: 'June 23, 2026',
	intro: introBlocks('users (“Buyers” or “you”) who access, browse, purchase goods, or otherwise use the Platform'),
	sections: [
		{
			id: 'collect',
			num: '2',
			title: 'Information We Collect',
			blocks: [
				{
					type: 'p',
					text: 'Data subject — refers to an individual whose personal information is processed. For purposes of this Privacy Policy, the Buyers are the data subjects.',
				},
				{ type: 'ul', items: dataSubjectDefinitions },
				{ type: 'p', text: sensitivePersonalInfo },
				{ type: 'p', text: 'We may collect the following categories of information:' },
				{ type: 'h3', text: 'Buyer Account Data' },
				{
					type: 'ul',
					items: [
						'Full name;',
						'Username;',
						'Email address;',
						'Mobile number;',
						'Password and authentication credentials;',
						'Profile information voluntarily provided by the user.',
					],
				},
				{ type: 'h3', text: 'Order / Transaction Data' },
				{
					type: 'ul',
					items: [
						'Order details;',
						'Payment confirmations;',
						'Messages to Sellers;',
						'Refund requests;',
						'Purchase history;',
						'Dispute records;',
						'Delivery and shipping information.',
					],
				},
				{ type: 'h3', text: 'Technical Information' },
				{
					type: 'ul',
					items: [
						'IP address;',
						'Browser logs;',
						'Device information;',
						'Operating system;',
						'Platform usage logs;',
						'Cookies and similar technologies.',
					],
				},
				{ type: 'h3', text: 'Communications Information' },
				{
					type: 'ul',
					items: [
						'Customer support inquiries;',
						'Feedback and reviews;',
						'Messages submitted through the Platform.',
					],
				},
			],
		},
		{
			id: 'purposes',
			num: '3',
			title: 'Purposes of Processing',
			blocks: [
				{
					type: 'p',
					text: 'Processing — refers to any operation or set of operations performed upon personal information, including collection, recording, organization, storage, updating, retrieval, consultation, use, consolidation, blocking, erasure, or destruction of data. We process user information for legitimate business purposes, including:',
				},
				{
					type: 'ul',
					items: [
						'Creating and maintaining user accounts;',
						'Facilitating purchases and transactions;',
						'Processing payments and refunds;',
						'Delivering products and services;',
						'Providing customer support;',
						'Sending transactional notifications and updates;',
						'Monitoring compliance with the Terms and Conditions;',
						'Preventing fraud, abuse, unauthorized transactions, and security breaches;',
						'Investigating complaints, disputes, and violations;',
						'Improving Platform functionality and user experience;',
						'Complying with legal and regulatory obligations.',
					],
				},
			],
		},
		{
			id: 'disclosure',
			num: '4',
			title: 'Disclosure of Information',
			blocks: [
				{
					type: 'p',
					text: 'We may disclose buyer information only as necessary for declared purposes:',
				},
				{
					type: 'ul',
					items: [
						'Sellers / Merchants you transact with — order and delivery details needed to fulfill your purchase. As a default, we share delivery data with the Seller, and the Seller shares it with its chosen courier.',
						'Third-party service providers (e.g., payment gateways, logistics, hosting, marketing, security) acting under our instructions.',
						'Compliance, law enforcement, and competent authorities when required by law, lawful process, or subpoena under the conditions set by the Internet Transactions Act of 2023.',
						'Finance & Accounting Team for reconciliation, compliance, refunds, and settlements.',
						'Fraud investigations and legal claims, consistent with permissible processing for legitimate interests and legal claims.',
					],
				},
			],
		},
		{
			id: 'monitoring',
			num: '5',
			title: 'Monitoring and Enforcement',
			blocks: [
				{
					type: 'p',
					text: 'Consistent with the Buyer Terms and Conditions, BIMS may process information necessary to:',
				},
				{
					type: 'ul',
					items: [
						'Detect fraudulent activities;',
						'Investigate policy violations;',
						'Enforce Platform rules;',
						'Resolve disputes;',
						'Protect the rights, property, and safety of Buyers, Sellers, and the Company.',
					],
				},
			],
		},
		retentionSection('retention', 'Buyer'),
		rightsSection('rights'),
		securitySection('security'),
		{
			id: 'children',
			num: '9',
			title: 'Children’s Privacy',
			blocks: [
				{
					type: 'p',
					text: 'The Maretinda platform is intended for users who are at least eighteen (18) years old. Any personal information inadvertently collected from minors will be promptly deleted upon discovery, unless retention is required by law.',
				},
			],
		},
		{
			id: 'relationship',
			num: '10',
			title: 'Relationship with the Terms and Conditions',
			blocks: [
				{
					type: 'p',
					text: 'This Privacy Policy complements and forms part of the contractual framework governing Platform use. Information collected under this Privacy Policy may be processed as reasonably necessary to administer accounts, facilitate transactions, investigate violations, resolve disputes, prevent fraud, and enforce rights and obligations under the User Terms and Conditions.',
				},
			],
		},
		{
			id: 'amendments',
			num: '11',
			title: 'Amendments',
			blocks: [
				{
					type: 'p',
					text: 'BIMS reserves the right to amend this Privacy Policy at any time. Changes will be posted with an updated “Last Updated” date. Updated versions shall become effective upon publication on the Platform unless otherwise required by law.',
				},
			],
		},
		{
			id: 'contact',
			num: '12',
			title: 'Contact Information',
			blocks: [
				{ type: 'p', text: 'For any privacy-related questions or requests, contact us at:' },
				{ type: 'callout', text: 'Email: info@maretinda.com' },
			],
		},
	],
};

const sellerPrivacy: LegalDoc = {
	key: 'seller',
	tab: 'For Sellers',
	title: 'Seller Privacy Policy',
	subtitle:
		'How Maretinda collects, uses, and protects the information of merchants, vendors, and business partners.',
	effective: 'June 23, 2026',
	intro: introBlocks('merchants, vendors, and business partners (“Sellers” or “you”) who sell products or services through the Platform'),
	sections: [
		{
			id: 'collect',
			num: '2',
			title: 'Information We Collect',
			blocks: [
				{
					type: 'p',
					text: 'Data subject — refers to an individual whose personal information is processed. For purposes of this Privacy Policy, the Sellers are the data subjects.',
				},
				{ type: 'ul', items: dataSubjectDefinitions },
				{ type: 'p', text: sensitivePersonalInfo },
				{ type: 'p', text: 'We may collect the following categories of information:' },
				{ type: 'h3', text: 'Seller Registration and Business Data' },
				{
					type: 'ul',
					items: [
						'Seller name;',
						'Business name;',
						'Business registration documents;',
						'Tax identification information;',
						'Government-issued identification;',
						'Business addresses and contact details.',
					],
				},
				{ type: 'h3', text: 'Financial Information' },
				{
					type: 'ul',
					items: [
						'Bank account information;',
						'Payout details;',
						'Commission records;',
						'Transaction histories;',
						'Financial reconciliation records.',
					],
				},
				{ type: 'h3', text: 'Operational Information' },
				{
					type: 'ul',
					items: [
						'Product listings;',
						'Inventory information;',
						'Pricing data;',
						'Fulfillment records;',
						'Customer service interactions;',
						'Seller performance metrics.',
					],
				},
				{ type: 'h3', text: 'Technical Information' },
				{
					type: 'ul',
					items: [
						'Device information;',
						'Login records;',
						'Platform activity logs;',
						'IP addresses;',
						'Browser information.',
					],
				},
			],
		},
		{
			id: 'purposes',
			num: '3',
			title: 'Purposes of Processing',
			blocks: [
				{
					type: 'p',
					text: 'Processing — refers to any operation or set of operations performed upon personal information, including collection, recording, organization, storage, updating, retrieval, consultation, use, consolidation, blocking, erasure, or destruction of data. Seller information may be processed to:',
				},
				{
					type: 'ul',
					items: [
						'Verify Seller identity and eligibility;',
						'Administer Seller accounts;',
						'Facilitate product listings and transactions;',
						'Process commissions, fees, and payouts;',
						'Monitor marketplace integrity;',
						'Investigate customer complaints;',
						'Resolve disputes;',
						'Detect fraud and prohibited conduct;',
						'Enforce Seller Terms and Conditions;',
						'Comply with accounting, taxation, legal, and regulatory obligations;',
						'Improve Platform services and operational efficiency.',
					],
				},
			],
		},
		{
			id: 'disclosure',
			num: '4',
			title: 'Disclosure of Information',
			blocks: [
				{
					type: 'p',
					text: 'We may disclose Seller information only as necessary for declared purposes:',
				},
				{
					type: 'ul',
					items: [
						'Customers you transact with, to facilitate order fulfillment, customer support, returns, and transaction-related communications.',
						'Third-party service providers (e.g., payment gateways, logistics, hosting, marketing, security) acting under our instructions.',
						'Compliance, law enforcement, and competent authorities when required by law, lawful process, or subpoena under the conditions set by the Internet Transactions Act of 2023.',
						'Finance & Accounting Team for reconciliation, compliance, refunds, and settlements.',
						'Fraud investigations and legal claims, consistent with permissible processing for legitimate interests and legal claims.',
						'Other professionals, including auditors, legal counsel, consultants, and compliance professionals engaged by BIMS.',
					],
				},
			],
		},
		{
			id: 'monitoring',
			num: '5',
			title: 'Seller Monitoring and Compliance',
			blocks: [
				{
					type: 'p',
					text: 'To maintain marketplace integrity and protect consumers, BIMS may process Seller information to:',
				},
				{
					type: 'ul',
					items: [
						'Assess compliance with Seller Terms and Conditions;',
						'Monitor fulfillment performance;',
						'Review customer complaints;',
						'Investigate fraudulent or unlawful conduct;',
						'Conduct audits and compliance reviews;',
						'Evaluate account risk and security concerns.',
					],
				},
			],
		},
		retentionSection('retention', 'Seller'),
		rightsSection('rights'),
		securitySection('security'),
		{
			id: 'relationship',
			num: '9',
			title: 'Relationship with the Terms and Conditions',
			blocks: [
				{
					type: 'p',
					text: 'This Privacy Policy complements and forms part of the contractual framework governing Platform use. Information collected under this Privacy Policy may be processed as reasonably necessary to administer accounts, facilitate transactions, investigate violations, resolve disputes, prevent fraud, and enforce rights and obligations under the Terms and Conditions.',
				},
			],
		},
		{
			id: 'amendments',
			num: '10',
			title: 'Amendments',
			blocks: [
				{
					type: 'p',
					text: 'BIMS reserves the right to amend this Privacy Policy at any time. Changes will be posted with an updated “Last Updated” date. Updated versions shall become effective upon publication on the Platform unless otherwise required by law.',
				},
			],
		},
		{
			id: 'contact',
			num: '11',
			title: 'Contact Information',
			blocks: [
				{ type: 'p', text: 'For any privacy-related questions or requests, contact us at:' },
				{ type: 'callout', text: 'Email: info@maretinda.com' },
			],
		},
	],
};

export const privacyDocs: LegalDoc[] = [buyerPrivacy, sellerPrivacy];
