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
			<div className="flex flex-col space-y-1 items-start justify-end p-4 bg-gradient-to-t from-black/90 to-white/5 text-tertiary absolute bottom-0 left-0 rounded-b-xs w-full h-full">
				<span className="text-sm !font-bold">{post.category}</span>
				<h3 className="heading-md font-lora !font-bold">
					{post.title}
				</h3>
				<span className="text-md !font-normal">
					{post.author}, {post.date}
				</span>
				{/* <p className="text-md line-clamp-2">{post.excerpt}</p> */}
				<Button className="hidden group-hover:flex !mt-2.5 min-w-[12px] !font-medium label-md text-white px-0 py-0 bg-transparent hover:bg-transparent underline underline-offset-4 items-center">
					Read More...
				</Button>
			</div>
		</LocalizedClientLink>
	);
}
