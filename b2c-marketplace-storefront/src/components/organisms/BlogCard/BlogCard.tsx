import { ArrowLongRight } from '@medusajs/icons';
import { Avatar } from '@medusajs/ui';
import Image from 'next/image';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
	post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
	return (
		<LocalizedClientLink
			className="group relative min-h-[330px] md:min-h-[356px] lg:max-w-[405px]"
			href={post.href}
		>
			<div className="relative overflow-hidden h-full">
				<Image
					alt={post.title}
					className="object-cover max-h-[356px] h-full w-full group-hover:scale-110 ease-in-out duration-300 transition-all"
					height={356}
					priority
					src={decodeURIComponent(post.image)}
					width={400}
				/>
			</div>
			<div className="flex flex-col space-y-2 items-start justify-end p-4 bg-gradient-to-t from-black/90 to-white/5 text-tertiary absolute bottom-0 left-0 rounded-b-xs w-full h-full">
				<span className="text-sm !font-bold">{post.category}</span>
				<h3 className="heading-md font-lora !font-bold">
					{post.title}
				</h3>
				<div className="flex items-center justify-start gap-2.5">
					<Avatar
						className="w-7"
						fallback="M"
						size="small"
						src="https://avatars.githubusercontent.com/u/10656202?v=4"
					/>
					<span className="text-md !font-normal">
						{post.author}, {post.date}
					</span>
				</div>
				{/* <p className="text-md line-clamp-2">{post.excerpt}</p> */}
				<Button className="!mt-4 min-w-[12px] !font-medium label-md text-white px-3.5 py-2 bg-transparent hover:bg-action  hover:border-action gap-1.5 flex items-center rounded-[6px] transition-colors border border-white">
					Read More
					<ArrowLongRight width={20} />
				</Button>
			</div>
		</LocalizedClientLink>
	);
}
