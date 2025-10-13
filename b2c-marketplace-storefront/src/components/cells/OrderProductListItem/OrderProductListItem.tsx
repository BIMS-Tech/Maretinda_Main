import Image from 'next/image';
import { Fragment } from 'react';

import { Divider } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { convertToLocale } from '@/lib/helpers/money';
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
		{withDivider && <Divider className="mt-4" />}
		<li className={cn('flex items-center', withDivider && 'mt-4')}>
			<div className="w-[66px] h-16 relative rounded-sm overflow-hidden flex items-center justify-center">
				{item.thumbnail ? (
					<Image
						alt={item.title}
						className="object-cover"
						height={66}
						src={item.thumbnail}
						width={66}
					/>
				) : (
					<Image
						alt={item.title}
						className="opacity-25"
						height={45}
						src={'/images/placeholder.svg'}
						width={45}
					/>
				)}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-5 w-full px-4 sm:gap-4">
				<div className="sm:col-span-2">
					<p className="label-md text-secondary">
						{item.product_title}
					</p>
					<LocalizedClientLink
						className="heading-xs text-primary"
						href={`/products/${item.variant?.product?.handle}`}
						target="_blank"
					>
						{item.variant?.product?.title}
					</LocalizedClientLink>
				</div>
				<div className="sm:col-span-2 flex flex-col justify-center">
					<p className="label-md text-secondary">
						{`Variant: `}
						<span className="text-primary">
							{item?.variant_title || item?.variant?.title}
						</span>
					</p>
				</div>
				<div className="flex sm:justify-end label-lg text-primary sm:items-center">
					{convertToLocale({
						amount: item.unit_price,
						currency_code: currency_code,
					})}
				</div>
			</div>
		</li>
	</Fragment>
);
