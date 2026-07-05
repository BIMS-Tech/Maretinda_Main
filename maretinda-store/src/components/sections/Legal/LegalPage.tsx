'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { LegalBlock, LegalDoc, LegalPageProps } from './types';

const PURPLE = '#432C63';
const YELLOW = '#FFC533';
const BORDER = '#EDEAE3';
const MUTED = '#6B6473';

function BlockRenderer({ block }: { block: LegalBlock }) {
	switch (block.type) {
		case 'p':
			return (
				<p className="text-[14.5px] leading-[1.75] mb-4" style={{ color: '#3A3540' }}>
					{block.text}
				</p>
			);
		case 'h3':
			return (
				<h3 className="text-[14px] font-extrabold mt-6 mb-2.5" style={{ color: PURPLE }}>
					{block.text}
				</h3>
			);
		case 'ul':
			return (
				<ul className="mb-4 space-y-2">
					{block.items.map((item, i) => (
						<li key={i} className="flex gap-3 text-[14.5px] leading-[1.7]" style={{ color: '#3A3540' }}>
							<span
								className="mt-[9px] flex-shrink-0 rounded-full"
								style={{ width: 5, height: 5, backgroundColor: YELLOW }}
							/>
							<span>{item}</span>
						</li>
					))}
				</ul>
			);
		case 'callout':
			return (
				<div
					className="mb-4 rounded-2xl px-5 py-4 flex gap-3"
					style={{ backgroundColor: '#F5F1FB', border: `1px solid ${BORDER}` }}
				>
					<svg
						width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE}
						strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
						className="mt-0.5 flex-shrink-0"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="16" x2="12" y2="12" />
						<line x1="12" y1="8" x2="12.01" y2="8" />
					</svg>
					<p className="text-[13.5px] leading-[1.7] font-medium" style={{ color: PURPLE }}>
						{block.text}
					</p>
				</div>
			);
		case 'table':
			return (
				<div className="mb-5 overflow-x-auto rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
					<table className="w-full border-collapse text-left" style={{ minWidth: 520 }}>
						<thead>
							<tr style={{ backgroundColor: '#FAF8F5' }}>
								{block.columns.map((col, i) => (
									<th
										key={i}
										className="px-4 py-3 text-[11.5px] font-bold uppercase tracking-wider"
										style={{ color: PURPLE, borderBottom: `1px solid ${BORDER}` }}
									>
										{col}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{block.rows.map((row, ri) => (
								<tr key={ri}>
									{row.map((cell, ci) => (
										<td
											key={ci}
											className="px-4 py-3 align-top text-[13px] leading-[1.6]"
											style={{
												color: ci === 0 ? PURPLE : '#3A3540',
												fontWeight: ci === 0 ? 700 : 400,
												borderBottom: ri === block.rows.length - 1 ? 'none' : `1px solid ${BORDER}`,
											}}
										>
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
		default:
			return null;
	}
}

function DocBody({ doc }: { doc: LegalDoc }) {
	return (
		<>
			<div className="mb-8">
				{doc.intro.map((block, i) => (
					<BlockRenderer key={i} block={block} />
				))}
			</div>
			{doc.sections.map((section) => (
				<section key={section.id} id={section.id} className="scroll-mt-28 mb-10">
					<div className="flex items-baseline gap-3 mb-4">
						<span
							className="flex-shrink-0 text-[13px] font-extrabold rounded-lg px-2.5 py-1"
							style={{ backgroundColor: '#F0EBF8', color: PURPLE }}
						>
							{section.num}
						</span>
						<h2 className="font-serif tracking-[-0.01em] text-[#1B1B1B]" style={{ fontSize: 'clamp(19px, 2.4vw, 24px)' }}>
							{section.title}
						</h2>
					</div>
					<div className="pl-0 sm:pl-[46px]">
						{section.blocks.map((block, i) => (
							<BlockRenderer key={i} block={block} />
						))}
					</div>
				</section>
			))}
		</>
	);
}

export function LegalPage({ eyebrow, heading, tagline, docs }: LegalPageProps) {
	const [activeKey, setActiveKey] = useState(docs[0]?.key ?? '');
	const [activeSection, setActiveSection] = useState('');
	const contentRef = useRef<HTMLDivElement>(null);

	const doc = useMemo(
		() => docs.find((d) => d.key === activeKey) ?? docs[0],
		[docs, activeKey],
	);

	// Scrollspy: highlight the TOC entry whose section is currently in view.
	useEffect(() => {
		setActiveSection(doc.sections[0]?.id ?? '');
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]) setActiveSection(visible[0].target.id);
			},
			{ rootMargin: '-96px 0px -70% 0px', threshold: 0 },
		);
		const nodes = doc.sections
			.map((s) => document.getElementById(s.id))
			.filter((n): n is HTMLElement => n !== null);
		nodes.forEach((n) => observer.observe(n));
		return () => observer.disconnect();
	}, [doc]);

	const handleTabChange = (key: string) => {
		setActiveKey(key);
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const scrollTo = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	return (
		<div style={{ backgroundColor: '#FAF8F5' }}>
			{/* Hero */}
			<div className="px-4 pt-14 pb-10 lg:pt-20 lg:pb-14 text-center" style={{ background: 'linear-gradient(135deg, #432C63 0%, #6B3FA0 100%)' }}>
				<div className="text-[12px] font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
					{eyebrow}
				</div>
				<h1 className="font-serif text-white tracking-[-0.02em] mb-4" style={{ fontSize: 'clamp(30px, 4.5vw, 50px)' }}>
					{heading}
				</h1>
				<p className="text-[15px] mb-8 max-w-[520px] mx-auto" style={{ color: 'rgba(255,255,255,0.70)' }}>
					{tagline}
				</p>

				{/* Buyer / Seller toggle */}
				{docs.length > 1 && (
					<div
						className="inline-flex p-1 rounded-full"
						style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
					>
						{docs.map((d) => {
							const active = d.key === activeKey;
							return (
								<button
									key={d.key}
									onClick={() => handleTabChange(d.key)}
									className="px-5 sm:px-7 py-2 rounded-full text-[13.5px] font-bold transition-all"
									style={{
										backgroundColor: active ? YELLOW : 'transparent',
										color: active ? PURPLE : 'rgba(255,255,255,0.75)',
									}}
								>
									{d.tab}
								</button>
							);
						})}
					</div>
				)}
			</div>

			<div className="max-w-[1080px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
				<div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
					{/* Sticky table of contents */}
					<aside className="hidden lg:block">
						<div className="sticky top-24">
							<div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: MUTED }}>
								On this page
							</div>
							<nav className="space-y-0.5 border-l" style={{ borderColor: BORDER }}>
								{doc.sections.map((s) => {
									const active = s.id === activeSection;
									return (
										<button
											key={s.id}
											onClick={() => scrollTo(s.id)}
											className="block w-full text-left text-[13px] leading-snug py-1.5 pl-4 -ml-px border-l-2 transition-colors"
											style={{
												borderColor: active ? PURPLE : 'transparent',
												color: active ? PURPLE : MUTED,
												fontWeight: active ? 700 : 500,
											}}
										>
											{s.num}. {s.title}
										</button>
									);
								})}
							</nav>
						</div>
					</aside>

					{/* Document */}
					<div ref={contentRef} className="min-w-0">
						<div
							className="rounded-3xl bg-white p-6 sm:p-9 lg:p-11"
							style={{ border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(67,44,99,0.04)' }}
						>
							{/* Document header */}
							<div className="pb-6 mb-8" style={{ borderBottom: `1px solid ${BORDER}` }}>
								<h2 className="font-serif text-[#1B1B1B] tracking-[-0.01em] mb-2" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>
									{doc.title}
								</h2>
								<p className="text-[14px] mb-4" style={{ color: MUTED }}>{doc.subtitle}</p>
								<span
									className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full"
									style={{ backgroundColor: '#F0EBF8', color: PURPLE }}
								>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
										<rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
									</svg>
									Effective {doc.effective}
								</span>
							</div>

							<DocBody doc={doc} />
						</div>

						{/* Footer note */}
						<div className="mt-8 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ backgroundColor: PURPLE }}>
							<div className="flex-1">
								<p className="text-white font-bold text-[14.5px] mb-0.5">Questions about this document?</p>
								<p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
									Reach our team and we&apos;ll be happy to help clarify.
								</p>
							</div>
							<a
								href="mailto:info@maretinda.com"
								className="h-10 px-5 rounded-full text-[13px] font-bold inline-flex items-center justify-center gap-2 flex-shrink-0 transition-opacity hover:opacity-90"
								style={{ backgroundColor: YELLOW, color: PURPLE }}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
								info@maretinda.com
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
