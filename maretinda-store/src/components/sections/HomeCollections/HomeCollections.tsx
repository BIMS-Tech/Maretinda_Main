import Image from 'next/image';
import Link from 'next/link';

import { listCollections } from '@/lib/data/collections';

export const HomeCollections = async () => {
	const { collections } = await listCollections();

	const visible = collections.filter((c) => {
		const url = c.metadata?.image_url as string | undefined;
		return url && url.startsWith('https://');
	});

	if (visible.length === 0) return null;

	return (
		<section className="w-full">
			<div className="flex flex-wrap gap-4 justify-center">
				{visible.map((collection) => {
					const imageUrl = collection.metadata?.image_url as string;
					return (
						<Link
							key={collection.id}
							href={`/collections/${collection.handle}`}
							className="group relative overflow-hidden rounded-xl w-[220px] h-[260px] flex-shrink-0 bg-gray-100"
						>
							<Image
								src={imageUrl}
								alt={collection.title}
								fill
								className="object-cover transition-transform duration-300 group-hover:scale-105"
								unoptimized
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
							<div className="absolute bottom-0 left-0 right-0 p-4">
								<p className="text-white font-semibold text-lg leading-tight">
									{collection.title}
								</p>
								<p className="text-white/80 text-sm mt-1 group-hover:underline">
									Shop now
								</p>
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	);
};
