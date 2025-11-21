import Image from 'next/image';
import { Fragment } from 'react';

import { Divider } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { convertToLocale } from '@/lib/helpers/money';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import { cn } from '@/lib/utils';

export const OrderProductListItem = ({
	item,
	currency_code,
	withDivider,
}: {
	item: any;
	currency_code: string;
	withDivider?: boolean;
}) => (
	<Fragment>
		<li className={cn('flex items-center')}>
			{/* <div className="w-[100px] h-[100px] relative rounded-sm overflow-hidden flex items-center justify-center">
				{item.thumbnail ? (
					<Image
						alt={item.title}
						className="object-cover object-center"
						height={100}
						src={item.thumbnail}
						width={100}
					/>
				) : (
					<Image
						alt={item.title}
						className="opacity-25"
						height={100}
						src={'/images/placeholder.svg'}
						width={100}
					/>
				)}
			</div> */}
			<div className="grid grid-cols-1 sm:grid-cols-5 w-full sm:gap-4">
				<div className="sm:col-span-2 flex items-center gap-4">
					<div className="min-w-[90px] h-[90px] relative rounded-sm overflow-hidden flex items-center justify-center">
						{item.thumbnail ? (
							<Image
								alt={item.title}
								className="object-cover object-center"
								height={90}
								src={getImageUrl(item.thumbnail)}
								width={90}
							/>
						) : (
							<Image
								alt={item.title}
								className="opacity-25"
								height={90}
								src={'/images/placeholder.svg'}
								width={90}
							/>
						)}
					</div>
					<div className="flex flex-col w-full">
						<p className="label-md !font-normal text-primary">
							{item.product_title}
						</p>
						<LocalizedClientLink
							className="heading-xs text-secondary"
							href={`/products/${item.variant?.product?.handle}`}
							target="_blank"
						>
							{item.variant?.product?.title}
						</LocalizedClientLink>
					</div>
				</div>
				<div className="flex flex-col justify-center">
					<p className="label-md !font-bold text-[#999]">
						{`Variant: `}
						<span className="text-primary">
							{item?.variant_title || item?.variant?.title}
						</span>
					</p>
				</div>
				<div className="flex flex-col justify-center sm:items-end">
					<p className="label-md !font-bold text-[#999]">
						{`Quantity: `}
						<span className="text-primary">{item?.quantity}</span>
					</p>
				</div>
				<div className="flex sm:justify-end label-md !font-bold text-primary sm:items-center">
					{convertToLocale({
						amount: item.unit_price,
						currency_code: currency_code,
					})}
				</div>
			</div>
		</li>
		{withDivider && <Divider className="my-6" />}
	</Fragment>
);
