import clsx from "clsx";
import { ArrowLongRight } from "@medusajs/icons";
import Image from "next/image";

type Props = {
	name: string;
	description: string;
	href: string;
	className?: string;
	index: number;
	secondary?: boolean;
	imageUrl?: string;
};

export const ShopByStyleContainer = ({
	name,
	description,
	href,
	className,
	index,
	secondary = false,
	imageUrl = "",
}: Props) => {
	return (
		<div
			className={`relative text-brand-text rounded-xs bg-black ${className} overflow-hidden h-[283px] lg:h-auto`}
		>
			{secondary && (
				<div className="relative h-full w-full flex items-center justify-center">
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[196px] h-[196px] bg-[radial-gradient(#d9d9d9,_transparent)] opacity-90 rounded-full"></div>
					<div className="h-full w-full backdrop-blur-[90px]"></div>
				</div>
			)}
			{index === 0 && (
				<Image
					width={427}
					height={524}
					alt={name}
					src={imageUrl}
					className="absolute right-0 bottom-[-14px]"
				/>
			)}
			{index === 1 && (
				<Image
					width={432}
					height={286}
					alt={name}
					src={imageUrl}
					className="absolute top-0 right-[54px] transform -scale-x-100"
				/>
			)}
			{index === 2 && (
				<Image
					width={258}
					height={405}
					alt={name}
					src={imageUrl}
					className="absolute top-0 right-[-13px]"
				/>
			)}
			{index === 3 && (
				<Image
					width={228}
					height={260}
					alt={name}
					src={imageUrl}
					className="absolute top-6 right-[-37px]"
				/>
			)}
			<div
				className={clsx([
					"absolute",
					index === 0 && "left-8 bottom-[45px] max-w-[242px]",
					index === 1 && "left-6 bottom-[39px] max-w-[255px]",
					index === 2 && "left-[22px] bottom-[29px] max-w-[191px]",
					index === 3 && "left-[28px] bottom-[23px] max-w-[255px]",
				])}
			>
				<h3
					className={clsx([
						secondary
							? "font-semibold text-2xl leading-none"
							: "font-lora font-bold text-4xl leading-[46px]",
					])}
				>
					{name}
				</h3>
				<p
					className={clsx([
						secondary ? "mt-2" : "mt-4",
						"font-medium text-[14px]",
					])}
				>
					{description}
				</p>
				<a
					href={href}
					className="inline-flex gap-[6px] rounded-[6px] border-[1px] border-white py-[9px] px-4 mt-4 items-center"
				>
					Shop Now <ArrowLongRight color="white" width={15} height={15} />
				</a>
			</div>
		</div>
	);
};
