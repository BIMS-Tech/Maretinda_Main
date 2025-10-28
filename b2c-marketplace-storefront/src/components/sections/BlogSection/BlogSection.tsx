import Heading from '@/components/atoms/Heading/Heading';
import { BlogCard } from '@/components/organisms';
import type { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
	{
		author: 'Dela Cruz',
		category: 'ACCESSORIES',
		date: '2 months ago',
		excerpt:
			"Discover this season's most sophisticated accessories that blend timeless elegance with modern design.",
		href: '#',
		id: 1,
		image: '/images/blog/post-1.jpg',
		title: "Summer's Most Elegant Accessories",
	},
	{
		author: 'Dela Cruz',
		category: 'STYLE GUIDE',
		date: '3 days ago',
		excerpt:
			'From bold colors to nostalgic silhouettes, explore the must-have looks defining this season’s fashion narrative.',
		href: '#',
		id: 2,
		image: '/images/blog/post-2.jpg',
		title: 'The Season’s Hottest Trends',
	},
	{
		author: 'Dela Cruz',
		category: 'TRENDS',
		date: '1 week ago',
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
		<section className="container">
			<div className="mb-10">
				<Heading label="Feature Posts" seeAllText="See All Posts" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{blogPosts.map((post) => (
					<BlogCard key={post.id} post={post} />
				))}
			</div>
		</section>
	);
}
