import sanitize from 'sanitize-html';

/**
 * Product and shop descriptions are written by sellers and rendered as HTML on
 * the storefront, so unfiltered they let any seller run script in a buyer's
 * session. Keep the formatting a rich-text editor produces and drop the rest.
 */
export const sanitizeSellerHtml = (html: string | null | undefined) =>
	sanitize(html ?? '', {
		allowedAttributes: {
			a: ['href', 'title', 'target', 'rel'],
			img: ['src', 'alt', 'width', 'height'],
		},
		allowedSchemes: ['http', 'https', 'mailto', 'tel'],
		allowedTags: [
			'a',
			'b',
			'blockquote',
			'br',
			'code',
			'div',
			'em',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'hr',
			'i',
			'img',
			'li',
			'ol',
			'p',
			'pre',
			's',
			'span',
			'strong',
			'sub',
			'sup',
			'table',
			'tbody',
			'td',
			'th',
			'thead',
			'tr',
			'u',
			'ul',
		],
		transformTags: {
			a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
		},
	});
