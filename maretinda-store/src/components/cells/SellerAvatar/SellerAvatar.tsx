import Image from 'next/image';

export const SellerAvatar = ({
	photo = '',
	size = 32,
	alt = '',
}: {
	photo?: string;
	size?: number;
	alt?: string;
}) => {
	return photo ? (
		<Image
			alt={alt}
			className="rounded-full"
			height={size}
			src={decodeURIComponent(photo)}
			style={{ height: size, width: size }}
			width={size}
		/>
	) : (
		<Image
			alt={alt}
			className="opacity-30 w-8 h-8 rounded-full"
			height={32}
			src="/images/placeholder.svg"
			width={32}
		/>
	);
};
