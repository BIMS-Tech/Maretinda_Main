export const GIYAPAY_METHOD_TITLES: Record<string, string> = {
	GCASH: 'GCash',
	INSTAPAY: 'InstaPay',
	'MASTERCARD/VISA': 'Visa / Mastercard',
	QRPH: 'QR Ph',
	UNIONPAY: 'UnionPay',
	WECHATPAY: 'WeChat Pay',
};

/** Buyer-facing name for the method GiyaPay reports, e.g. MASTERCARD/VISA. */
export const giyapayMethodTitle = (gateway: string): string => {
	const method = gateway.trim().toUpperCase();
	return GIYAPAY_METHOD_TITLES[method] ?? method.replace(/\s*\/\s*/g, ' / ');
};
