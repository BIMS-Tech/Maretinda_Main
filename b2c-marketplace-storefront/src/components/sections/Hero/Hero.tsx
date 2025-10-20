import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

import { ArrowRightIcon } from '@/icons';
import { ChevronLeft, ChevronRight } from "@medusajs/icons";
import Image from "next/image";

type HeroProps = {
	image?: string; // Make image optional since we're not using it
	heading: string;
	paragraph: string;
	buttons: { label: string; path: string }[];
};

export const Hero = ({ heading, paragraph, buttons }: HeroProps) => {
	return (
		<section className="w-full container mt-5 max-w-[1242px] sm:h-[620px]">
			{/* Beautiful Gradient Hero Banner */}
			<div className="relative rounded-2xl bg-brand overflow-hidden">
				{/* Background Images */}
				<Image
					src="/images/hero/black-friday-elements-assortment.png"
					width={562}
					height={316}
					alt="Gifts"
					className="hidden sm:block drag-none absolute top-[310px] left-[-68px]"
				/>
				<div className="hidden sm:block absolute top-[-61x] right-[91.87]">
					<Image
						src="/images/hero/shopping-bag.png"
						width={209.71}
						height={229.4}
						alt="Shopping Bag"
						className="w-[209.71] h-[229.4] drag-none -scale-y-100 rotate-[113.01deg]"
					/>
				</div>
				{/* Stars */}
				<Image
					src="/images/hero/star.svg"
					width={104}
					height={107.83}
					alt="Star"
					className="hidden sm:block object-fill drag-none absolute top-[65px] left-[89px]"
				/>
				<Image
					src="/images/hero/star.svg"
					width={74}
					height={90}
					alt="Star"
					className="hidden sm:block object-fill drag-none absolute top-[172.5px] right-[68px]"
				/>
				<Image
					src="/images/hero/star.svg"
					width={56}
					height={58.06}
					alt="Star"
					className="hidden sm:block object-fill drag-none absolute top-[468px] right-[198px]"
				/>

				{/* Background Pattern */}
				{/* <div className="absolute inset-0 bg-black/10">
					<div
						className="absolute inset-0"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
						}}
					/>
				</div> */}

				{/* Floating Elements */}
				<div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
				<div
					className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 rounded-full animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse"
					style={{ animationDelay: "2s" }}
				/>

				{/* Content */}
				<div className="relative px-8 pt-[53px] sm:pt-[173px] pb-[43px] sm:pb-[169.5px]">
					<div className="max-w-4xl mx-auto text-center text-brand-purple-900">
						{/* Main Content */}
						<h1
							className={`font-bold mb-[27px] sm:mb-8 text-[28px] sm:text-5xl leading-[100%] font-lora max-w-[734px] mx-auto tracking-normal sm:h-[122px]`}
						>
							{heading.toLocaleUpperCase()}
						</h1>
						<p className="text-[10px] sm:text-base mb-[39px] sm:mb-[16.5px] mx-auto leading-relaxed h-[67px] max-w-[815px]">
							{paragraph}
						</p>

						{/* Action Buttons */}
						{buttons.length && (
							<div className="flex flex-col sm:flex-row gap-[11px] sm:gap-6 justify-center items-center">
								{buttons.map(({ label, path }, index) => (
									<Link
										className={
											"group inline-flex items-center justify-center sm:px-8 py-[15px] sm:py-[10px] rounded-[6px] transition-all duration-300 bg-brand-cta-400 text-gray-900 hover:scale-105 shadow-lg w-[220px] sm:w-auto h-[45px] sm:h-auto"
										}
										href={path}
										key={uuidv4()}
									>
										<span className="text-xs sm:text-[14px] font-medium leading-5">
											{label}
										</span>
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Prev/Next Buttons */}
					<button
						type="button"
						className="w-9 sm:w-[49px] h-9 sm:h-[47.28px] bg-white rounded-full absolute py-[10.84px] pl-[10.95px] pr-[15.82px] sm:px-[17px] sm:pt-[16.5px] sm:pb-[15.78px] bottom-[53px] sm:top-[291px] left-1 sm:left-[40px] shadow-[0px_4px_4px_0px_#00000040]"
					>
						<ChevronLeft className="w-[8px] h-[14px] sm:w-[15px] sm:h-[15px]" />
					</button>
					<button
						type="button"
						className="w-9 sm:w-[49px] h-9 sm:h-[47.28px] bg-white rounded-full absolute py-[10.84px] pl-[10.95px] pr-[15.82px] sm:px-[17px] sm:pt-[16.5px] sm:pb-[15.78px] bottom-[53px] sm:top-[291px] right-2 sm:right-[51px] shadow-[0px_4px_4px_0px_#00000040]"
					>
						<ChevronRight className="w-[8px] h-[14px] sm:w-[15px] sm:h-[15px]" />
					</button>
				</div>
			</div>
		</section>
	);
};
