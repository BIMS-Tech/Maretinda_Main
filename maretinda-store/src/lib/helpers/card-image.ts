import { getImageUrl } from './get-image-url';

/** Soft grounds for product pictures, the same one for a product every time. */
const GROUNDS = ['#F3EFF8', '#FBF3E2', '#EAF1EC', '#FAECE8', '#EAF0F8', '#F5F1EA'];
export const groundOf = (id: string) => GROUNDS[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % GROUNDS.length];

const safeDecode = (url: string) => {
	try {
		return decodeURIComponent(url);
	} catch {
		// A lone % in a file name isn't an escape
		return url;
	}
};

export const cardImage = (thumbnail: string | null | undefined) => (thumbnail ? getImageUrl(safeDecode(thumbnail)) : null);
