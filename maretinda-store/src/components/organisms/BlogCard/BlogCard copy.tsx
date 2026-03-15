import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ArrowRightIcon } from '@/icons';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';

import tailwindConfig from '../../../../tailwind.config';

interface BlogCardProps {
	post: BlogPost;
	index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
	return (
		<LocalizedClientLink
			className={cn(
				'group block border border-secondary p-1 rounded-sm relative',
				index > 0 && 'hidden lg:block',
			)}
			href={post.href}
		>
			<div className="relative overflow-hidden rounded-xs h-full">
				<Image
					alt={post.title}
					className="object-cover max-h-[356px] h-full w-full"
					height={356}
					priority
					src={decodeURIComponent(post.image)}
					width={400}
				/>
			</div>
			<div className="p-4 bg-tertiary text-tertiary absolute bottom-0 left-1 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-b-xs w-[calc(100%-8px)]">
				<h3 className="heading-sm">{post.title}</h3>
				<p className="text-md line-clamp-2">{post.excerpt}</p>
				<div className="flex items-center gap-4 uppercase label-md mt-[26px]">
					Read more{' '}
					<ArrowRightIcon
						color={tailwindConfig.theme.extend.colors.tertiary}
						size={20}
					/>
				</div>
			</div>
		</LocalizedClientLink>
	);
}
