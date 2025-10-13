import { BlogCard } from '@/components/organisms';
import type { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
	{
		category: 'ACCESSORIES',
		excerpt:
			"Discover this season's most sophisticated accessories that blend timeless elegance with modern design.",
		href: '#',
		id: 1,
		image: '/images/blog/post-1.jpg',
		title: "Summer's Most Elegant Accessories",
	},
	{
		category: 'STYLE GUIDE',
		excerpt:
			'From bold colors to nostalgic silhouettes, explore the must-have looks defining this season’s fashion narrative.',
		href: '#',
		id: 2,
		image: '/images/blog/post-2.jpg',
		title: 'The Season’s Hottest Trends',
	},
	{
		category: 'TRENDS',
		excerpt:
			'Explore the latest minimalist outerwear pieces that combine functionality with clean aesthetics.',
		href: '#',
		id: 3,
		image: '/images/blog/post-3.jpg',
		title: 'Minimalist Outerwear Trends',
	},
];

export function BlogSection() {
	return (
		<section className="bg-tertiary container">
			<div className="flex items-center justify-between mb-12">
				<h2 className="heading-lg text-tertiary">STAY UP TO DATE</h2>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3">
				{blogPosts.map((post, index) => (
					<BlogCard index={index} key={post.id} post={post} />
				))}
			</div>
		</section>
	);
}
