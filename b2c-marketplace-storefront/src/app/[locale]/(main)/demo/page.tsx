import { Breadcrumbs } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CategoryCard } from '@/components/organisms';
import {
	categoryStructure,
	categoryThemes,
	primeCategories,
} from '@/data/categories';

export default function DemoPage() {
	const categories = Object.entries(primeCategories).map(
		([handle, name], index) => ({
			handle,
			id: index + 1,
			name,
			theme: categoryThemes[handle as keyof typeof categoryThemes],
		}),
	);

	const breadcrumbsItems = [
		{
			label: 'Home',
			path: '/',
		},
		{
			label: 'Multi-Category Demo',
			path: '/demo',
		},
	];

	return (
		<main className="container">
			<div className="hidden md:block mb-2">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>

			<div className="mb-8">
				<h1 className="heading-xl uppercase mb-4">
					Multi-Category Marketplace Demo
				</h1>
				<p className="text-gray-600 text-lg max-w-3xl">
					Experience our redesigned storefront with five distinct
					categories: Groceries, Food Items, Accessories, Shopping,
					and Fashion. Each category has its own theme, subcategories,
					and specialized features.
				</p>
			</div>

			{/* Main Categories Showcase */}
			<section className="mb-16">
				<h2 className="heading-lg mb-8">Main Categories</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{categories.map((category) => (
						<div className="space-y-4" key={category.id}>
							<CategoryCard category={category} />
							<div className="text-center">
								<p className="text-sm text-gray-600 mb-2">
									Features:
								</p>
								<div className="flex flex-wrap justify-center gap-2">
									{category.handle === 'groceries' && (
										<>
											<span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
												Same-day delivery
											</span>
											<span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
												Fresh guarantee
											</span>
											<span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
												Organic options
											</span>
										</>
									)}
									{category.handle === 'food' && (
										<>
											<span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
												Hot delivery
											</span>
											<span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
												Local chefs
											</span>
											<span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
												Ready in 30min
											</span>
										</>
									)}
									{category.handle === 'accessories' && (
										<>
											<span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
												Authentic
											</span>
											<span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
												Warranty
											</span>
											<span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
												Free returns
											</span>
										</>
									)}
									{category.handle === 'shopping' && (
										<>
											<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
												Express shipping
											</span>
											<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
												Tracking
											</span>
											<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
												Secure packaging
											</span>
										</>
									)}
									{category.handle === 'fashion' && (
										<>
											<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
												Trending
											</span>
											<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
												Size guide
											</span>
											<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
												Easy returns
											</span>
										</>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Color Themes Showcase */}
			<section className="mb-16">
				<h2 className="heading-lg mb-8">Category Color Themes</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
					{Object.entries(categoryThemes).map(([handle, theme]) => (
						<div
							className={`p-6 rounded-lg ${theme.bgClass} border`}
							key={handle}
							style={{ borderColor: theme.primary + '30' }}
						>
							<div className="text-center">
								<span className="text-4xl mb-3 block">
									{theme.icon}
								</span>
								<h3
									className={`font-bold ${theme.textClass} mb-2`}
								>
									{
										primeCategories[
											handle as keyof typeof primeCategories
										]
									}
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-center">
										<div
											className="w-4 h-4 rounded mr-2"
											style={{
												backgroundColor: theme.primary,
											}}
										></div>
										<span className={theme.textClass}>
											Primary
										</span>
									</div>
									<div className="flex items-center justify-center">
										<div
											className="w-4 h-4 rounded mr-2"
											style={{
												backgroundColor:
													theme.secondary,
											}}
										></div>
										<span className={theme.textClass}>
											Secondary
										</span>
									</div>
									<div className="flex items-center justify-center">
										<div
											className="w-4 h-4 rounded mr-2"
											style={{
												backgroundColor: theme.accent,
											}}
										></div>
										<span className={theme.textClass}>
											Accent
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Sub-Categories Demo */}
			<section className="mb-16">
				<h2 className="heading-lg mb-8">Sub-Category Structure</h2>
				<div className="space-y-8">
					{Object.entries(categoryStructure).map(
						([mainCategory, subCategories]) => {
							const theme =
								categoryThemes[
									mainCategory as keyof typeof categoryThemes
								];
							return (
								<div
									className={`p-6 rounded-xl ${theme.bgClass}`}
									key={mainCategory}
								>
									<div className="flex items-center mb-4">
										<span className="text-3xl mr-4">
											{theme.icon}
										</span>
										<h3
											className={`text-xl font-bold ${theme.textClass}`}
										>
											{
												primeCategories[
													mainCategory as keyof typeof primeCategories
												]
											}
										</h3>
									</div>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{Object.entries(subCategories).map(
											([handle, name]) => (
												<div
													className={`p-3 rounded-lg border ${theme.bgClass}`}
													key={handle}
													style={{
														backgroundColor:
															theme.primary +
															'08',
														borderColor:
															theme.primary +
															'30',
													}}
												>
													<span
														className={`text-sm font-medium ${theme.textClass}`}
													>
														{name}
													</span>
												</div>
											),
										)}
									</div>
								</div>
							);
						},
					)}
				</div>
			</section>

			{/* Navigation Demo */}
			<section className="mb-16">
				<h2 className="heading-lg mb-8">New URL Structure</h2>
				<div className="bg-gray-50 p-6 rounded-lg">
					<h4 className="font-bold mb-4">Example Routes:</h4>
					<div className="space-y-2 text-sm font-mono">
						<div>
							<span className="text-gray-500">/categories</span> -
							All categories overview
						</div>
						<div>
							<span className="text-gray-500">
								/categories/groceries
							</span>{' '}
							- Groceries main page
						</div>
						<div>
							<span className="text-gray-500">
								/categories/groceries/fresh-produce
							</span>{' '}
							- Fresh produce sub-category
						</div>
						<div>
							<span className="text-gray-500">
								/categories/food/ready-meals
							</span>{' '}
							- Ready meals sub-category
						</div>
						<div>
							<span className="text-gray-500">
								/categories/accessories/jewelry-watches
							</span>{' '}
							- Jewelry sub-category
						</div>
						<div>
							<span className="text-gray-500">
								/categories/shopping/electronics
							</span>{' '}
							- Electronics sub-category
						</div>
						<div>
							<span className="text-gray-500">
								/categories/fashion/mens-clothing
							</span>{' '}
							- Men's clothing sub-category
						</div>
					</div>
				</div>
			</section>

			{/* Quick Links */}
			<section className="mb-16">
				<h2 className="heading-lg mb-8">
					Quick Links - Try the New Structure
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<LocalizedClientLink
						className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
						href="/categories"
					>
						<h4 className="font-bold text-blue-800 mb-2">
							🏪 All Categories
						</h4>
						<p className="text-blue-600 text-sm">
							Browse the main categories page with new design
						</p>
					</LocalizedClientLink>

					<LocalizedClientLink
						className="p-4 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition-all"
						href="/categories/groceries"
					>
						<h4 className="font-bold text-green-800 mb-2">
							🍎 Groceries
						</h4>
						<p className="text-green-600 text-sm">
							Fresh groceries with same-day delivery
						</p>
					</LocalizedClientLink>

					<LocalizedClientLink
						className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-md transition-all"
						href="/categories/food"
					>
						<h4 className="font-bold text-orange-800 mb-2">
							🥘 Food Items
						</h4>
						<p className="text-orange-600 text-sm">
							Hot meals and local delicacies
						</p>
					</LocalizedClientLink>

					<LocalizedClientLink
						className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-all"
						href="/categories/accessories"
					>
						<h4 className="font-bold text-purple-800 mb-2">
							💎 Accessories
						</h4>
						<p className="text-purple-600 text-sm">
							Stylish accessories with quality guarantee
						</p>
					</LocalizedClientLink>

					<LocalizedClientLink
						className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
						href="/categories/shopping"
					>
						<h4 className="font-bold text-blue-800 mb-2">
							🛍️ Shopping
						</h4>
						<p className="text-blue-600 text-sm">
							Everything you need with fast shipping
						</p>
					</LocalizedClientLink>

					<LocalizedClientLink
						className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all"
						href="/categories/fashion"
					>
						<h4 className="font-bold text-gray-800 mb-2">
							👗 Fashion
						</h4>
						<p className="text-gray-600 text-sm">
							Latest trends and fashion accessories
						</p>
					</LocalizedClientLink>
				</div>
			</section>

			{/* Technical Features */}
			<section className="mb-16">
				<h2 className="heading-lg mb-8">Technical Features</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="bg-white border rounded-lg p-6">
						<h4 className="font-bold mb-4">
							🎨 Visual Enhancements
						</h4>
						<ul className="space-y-2 text-sm text-gray-600">
							<li>• Category-specific color themes</li>
							<li>• Enhanced hover animations</li>
							<li>• Responsive grid layouts</li>
							<li>• Icon + emoji combinations</li>
							<li>• Improved typography hierarchy</li>
						</ul>
					</div>

					<div className="bg-white border rounded-lg p-6">
						<h4 className="font-bold mb-4">
							⚡ Performance Features
						</h4>
						<ul className="space-y-2 text-sm text-gray-600">
							<li>• Lazy loading for images</li>
							<li>• Optimized React rendering</li>
							<li>• Minimal CSS with utilities</li>
							<li>• SEO-optimized meta tags</li>
							<li>• Mobile-first responsive design</li>
						</ul>
					</div>

					<div className="bg-white border rounded-lg p-6">
						<h4 className="font-bold mb-4">
							🔄 Backward Compatibility
						</h4>
						<ul className="space-y-2 text-sm text-gray-600">
							<li>• Legacy category support</li>
							<li>• Gradual migration path</li>
							<li>• Fallback handling</li>
							<li>• SEO preservation</li>
							<li>• Existing route support</li>
						</ul>
					</div>

					<div className="bg-white border rounded-lg p-6">
						<h4 className="font-bold mb-4">📱 User Experience</h4>
						<ul className="space-y-2 text-sm text-gray-600">
							<li>• Intuitive navigation</li>
							<li>• Clear visual hierarchy</li>
							<li>• Category-specific features</li>
							<li>• Accessible design</li>
							<li>• Touch-friendly interactions</li>
						</ul>
					</div>
				</div>
			</section>

			<div className="text-center py-8 border-t">
				<p className="text-gray-600 mb-4">
					This demo showcases the complete redesign of the Maretinda
					storefront for a multi-category marketplace.
				</p>
				<LocalizedClientLink
					className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-all"
					href="/"
				>
					Back to Homepage
				</LocalizedClientLink>
			</div>
		</main>
	);
}
