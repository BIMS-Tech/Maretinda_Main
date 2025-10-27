import Image from 'next/image';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ArrowRightIcon } from '@/icons';
import type { Style } from '@/types/styles';
import Heading from "@/components/atoms/Heading/Heading";
import { ShopByStyleContainer } from "./ShopByStyleContainer";
import clsx from "clsx";

export const styles: Style[] = [
	{
		href: "/collections/gym",
		name: "GYM",
		description: "Black and White version of the PS5 coming out on sale.",
		imageUrl: "/images/shop-by-styles/gym.png",
	},
	{
		href: "/collections/party",
		name: "PARTY",
		description: "tandard dummy text ever since the 1500s, when an unkn",
		imageUrl: "/images/shop-by-styles/party.jpg",
	},
	{
		href: "/collections/casual",
		name: "CASUAL",
		description: "Amazon wireless speakers",
		imageUrl: "/images/shop-by-styles/casual.png",
	},
	{
		href: "/collections/formal",
		name: "FORMAL",
		description: "GUCCI INTENSE OUD EDP",
		imageUrl: "/images/shop-by-styles/formal.png",
	},
];

export function ShopByStyleSection() {
	return (
		<section className="bg-primary container">
			<div className="mb-12">
				<Heading label="Shop By Style" />
			</div>
			<div
				className={clsx([
					"flex flex-col gap-[26px] lg:gap-0 lg:grid",
					"grid-cols-[minmax(0,_580px)_minmax(290px,_1fr)_minmax(280px,_296px)]",
					"grid-rows-[329px_316px]",
				])}
			>
				{styles.map((style, index) => (
					<ShopByStyleContainer
						key={style.name}
						className={clsx([
							index === 0 && "hidden lg:block lg:mt-[2px] row-span-2",
							index === 1 && "lg:ml-[23px] col-span-2",
							index === 2 && "lg:ml-[23px] lg:mr-[19px] lg:mt-8",
							index === 3 && "hidden lg:block lg:mt-8",
						])}
						name={style.name}
						secondary={index >= 2}
						description={style.description}
						href={style.href}
						index={index}
						imageUrl={style.imageUrl}
					/>
				))}
			</div>
		</section>
	);
}
