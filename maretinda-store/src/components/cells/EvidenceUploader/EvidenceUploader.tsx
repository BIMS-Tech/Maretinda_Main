'use client';

import { useState } from 'react';

export type Uploaded = { id: string; kind: 'photo' | 'video'; name: string };

/**
 * Photos (and the unboxing video when the claim needs one), uploaded as they
 * are picked so a slow connection shows progress per file.
 */
export const EvidenceUploader = ({
	value,
	onChange,
	needVideo,
}: {
	value: Uploaded[];
	onChange: (files: Uploaded[]) => void;
	needVideo: boolean;
}) => {
	const [busy, setBusy] = useState(0);
	const [error, setError] = useState('');

	const add = async (files: FileList | null) => {
		if (!files?.length) return;
		setError('');
		const added: Uploaded[] = [];
		for (const file of Array.from(files).slice(0, 8 - value.length)) {
			setBusy((n) => n + 1);
			try {
				const form = new FormData();
				form.append('file', file);
				const res = await fetch('/api/returns/evidence', { body: form, method: 'POST' });
				const json = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(json?.message || 'Upload failed');
				added.push({ id: json.evidence.id, kind: json.evidence.kind, name: file.name });
			} catch (e) {
				setError(`${file.name}: ${e instanceof Error ? e.message : 'upload failed'}`);
			} finally {
				setBusy((n) => n - 1);
			}
		}
		onChange([...value, ...added]);
	};

	const photos = value.filter((f) => f.kind === 'photo').length;
	const videos = value.filter((f) => f.kind === 'video').length;

	return (
		<div className="flex flex-col gap-2" data-testid="evidence-uploader">
			<p className="text-[14px] font-semibold text-[#1B1B1B]">Photos{needVideo ? ' and unboxing video' : ''}</p>
			<ul className="list-disc pl-5 text-[13px] leading-relaxed text-black/65">
				<li>Clear photos of the problem, with the shipping waybill on the parcel in view.</li>
				{needVideo && (
					<li>
						<b>An unedited unboxing video</b>: from the sealed parcel and its waybill, through opening it, to checking the item.
					</li>
				)}
			</ul>
			<label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-black/20 bg-white px-4 py-5 text-center text-[13px] text-black/60 hover:border-[#432C63]">
				<input
					accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
					className="sr-only"
					multiple
					onChange={(e) => {
						add(e.target.files);
						e.target.value = '';
					}}
					type="file"
				/>
				<span className="font-medium text-[#432C63]">{busy ? `Uploading ${busy}…` : 'Add photos or a video'}</span>
				<span>Photos up to 10 MB, a video up to 60 MB</span>
			</label>
			{value.length > 0 && (
				<ul className="flex flex-col gap-1 text-[13px]">
					{value.map((f) => (
						<li className="flex items-center justify-between rounded-md bg-black/[0.03] px-3 py-1.5" key={f.id}>
							<span className="truncate">
								{f.kind === 'video' ? 'Video' : 'Photo'}: {f.name}
							</span>
							<button className="text-[12px] text-red-600" onClick={() => onChange(value.filter((x) => x.id !== f.id))} type="button">
								Remove
							</button>
						</li>
					))}
				</ul>
			)}
			<p className="text-[12px] text-black/55">
				{photos} photo{photos === 1 ? '' : 's'}
				{needVideo ? `, ${videos} video${videos === 1 ? '' : 's'}` : ''} added.
			</p>
			{error && (
				<p className="text-[13px] text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
};
