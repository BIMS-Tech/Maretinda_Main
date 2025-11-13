'use client';

import { useState } from 'react';

import { Button } from '@/components/atoms';
import { Modal, ReportSellerForm } from '@/components/molecules';
import type { SellerProps } from '@/types/seller';

export const SellerFooter = ({ seller }: { seller: SellerProps }) => {
	const [openModal, setOpenModal] = useState(false);
	return (
		<div className="flex justify-between items-start flex-col lg:flex-row">
			{/* <div className="flex gap-2 lg:gap-4 items-center label-sm lg:label-md text-secondary mb-4 lg:mb-0 justify-between w-full lg:justify-start lg:w-auto">
				{seller.verified && (
          <div className="flex items-center gap-2">
            <DoneIcon size={20} />
            Verified seller
          </div>
        )}
				<Divider square />
				<p>Joined {format(seller.created_at, 'yyyy-MM-dd')}</p>
				<Divider square />
				<p>sold {seller.sold}</p>
			</div> */}
			<Button
				className="w-[133px] py-3 flex justify-center !font-normal !text-black"
				onClick={() => setOpenModal(true)}
				size="large"
			>
				Report
			</Button>
			{openModal && (
				<Modal
					childrenClass="px-6 pt-6"
					heading="Report Seller"
					headingClass="!font-semibold max-h-[60px] pb-4 px-6 flex-row text-black"
					modalClass="max-w-[670px]"
					onClose={() => setOpenModal(false)}
				>
					<ReportSellerForm onClose={() => setOpenModal(false)} />
				</Modal>
			)}
		</div>
	);
};
