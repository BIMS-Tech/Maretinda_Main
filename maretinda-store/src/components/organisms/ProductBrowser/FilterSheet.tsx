'use client';

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AnimatePresence, useDragControls } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';

import { SPRING_SOFT } from '@/components/motion';

/** Filters on a phone: a sheet that can be flicked away. */
export function FilterSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer: ReactNode }) {
	const drag = useDragControls();
	return (
		<AnimatePresence>
			{open && (
				<Dialog className="relative z-[90]" onClose={onClose} open static>
					<m.div
						animate={{ opacity: 1 }}
						aria-hidden="true"
						className="fixed inset-0 bg-[#1E1430]/45 backdrop-blur-[2px]"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
					/>
					<div className="fixed inset-x-0 bottom-0 flex justify-center">
						<m.div
							animate={{ y: 0 }}
							className="w-full max-w-lg"
							drag="y"
							dragConstraints={{ bottom: 0, top: 0 }}
							dragControls={drag}
							dragElastic={{ bottom: 0.6, top: 0 }}
							dragListener={false}
							exit={{ y: '100%' }}
							initial={{ y: '100%' }}
							onDragEnd={(_, info) => {
								if (info.offset.y > 140 || info.velocity.y > 600) onClose();
							}}
							transition={SPRING_SOFT}
						>
							<DialogPanel className="flex max-h-[88dvh] w-full flex-col rounded-t-[26px] bg-white shadow-2xl">
							<div className="cursor-grab touch-none px-5 pb-2 pt-3 active:cursor-grabbing" onPointerDown={(e) => drag.start(e)}>
								<div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-[#E3DDEA]" />
								<div className="flex items-center justify-between">
									<DialogTitle className="text-[18px] font-bold text-[#1B1B1B]">{title}</DialogTitle>
									<button aria-label="Close" className="press flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F2FB] text-[#432C63]" onClick={onClose} type="button">
										<svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width="15">
											<path d="M6 6l12 12M18 6L6 18" />
										</svg>
									</button>
								</div>
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
							<div className="border-t border-[#F0ECF4] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>
							</DialogPanel>
						</m.div>
					</div>
				</Dialog>
			)}
		</AnimatePresence>
	);
}
