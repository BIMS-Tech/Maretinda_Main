import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

import { ArrowRightIcon } from '@/icons';

type HeroProps = {
	image?: string; // Make image optional since we're not using it
	heading: string;
	paragraph: string;
	buttons: { label: string; path: string }[];
};

export const Hero = ({ heading, paragraph, buttons }: HeroProps) => {
	return (
		<section className="w-full container mt-5">
			{/* Beautiful Gradient Hero Banner */}
			<div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden">
				{/* Background Pattern */}
				<div className="absolute inset-0 bg-black/10">
					<div
						className="absolute inset-0"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
						}}
					/>
				</div>

				{/* Floating Elements */}
				<div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
				<div
					className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 rounded-full animate-pulse"
					style={{ animationDelay: '1s' }}
				/>
				<div
					className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse"
					style={{ animationDelay: '2s' }}
				/>

				{/* Content */}
				<div className="relative px-8 py-16 lg:px-16 lg:py-24">
					<div className="max-w-4xl mx-auto text-center text-white">
						{/* Category Icons */}
						<div className="flex justify-center gap-6 mb-8">
							<div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
								<span className="text-2xl">🍎</span>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
								<span className="text-2xl">🥘</span>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
								<span className="text-2xl">💎</span>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
								<span className="text-2xl">🛍️</span>
							</div>
							<div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
								<span className="text-2xl">👗</span>
							</div>
						</div>

						{/* Main Content */}
						<h1 className="font-bold mb-6 text-4xl lg:text-6xl leading-tight">
							{heading}
						</h1>
						<p className="text-xl lg:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
							{paragraph}
						</p>

						{/* Action Buttons */}
						{buttons.length && (
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								{buttons.map(({ label, path }, index) => (
									<Link
										className={`group inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
											index === 0
												? 'bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 shadow-lg'
												: 'bg-white/20 text-white border-2 border-white/30 hover:bg-white/30 hover:border-white/50 backdrop-blur-sm'
										}`}
										href={path}
										key={uuidv4()}
									>
										<span className="mr-2">{label}</span>
										<ArrowRightIcon
											className="group-hover:translate-x-1 transition-transform"
											color={
												index === 0
													? '#1f2937'
													: '#ffffff'
											}
										/>
									</Link>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Bottom Wave */}
				<div className="absolute bottom-0 left-0 w-full overflow-hidden">
					<svg
						className="relative block w-full h-12"
						preserveAspectRatio="none"
						viewBox="0 0 1200 120"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							className="fill-current text-white opacity-20"
							d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
						></path>
					</svg>
				</div>
			</div>
		</section>
	);
};
