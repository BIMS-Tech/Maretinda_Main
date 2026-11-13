'use client';

/** Shown when the whole page fails to render. Carries its own styles: the site's may not have loaded. */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en">
			<body
				style={{
					alignItems: 'center',
					backgroundColor: '#FAF8F5',
					color: '#1B1B1B',
					display: 'flex',
					fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
					justifyContent: 'center',
					margin: 0,
					minHeight: '100vh',
					padding: 24,
				}}
			>
				<div style={{ maxWidth: 440, textAlign: 'center' }}>
					<h1 style={{ fontSize: 26, margin: '0 0 12px' }}>
						Something went wrong
					</h1>
					<p style={{ color: '#737373', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
						The page could not be loaded. Your cart and orders are
						safe. Please try again, and if it keeps happening write
						to support@maretinda.com.
					</p>
					<button
						onClick={() => reset()}
						style={{
							backgroundColor: '#432C63',
							border: 0,
							borderRadius: 999,
							color: '#fff',
							cursor: 'pointer',
							fontSize: 14,
							fontWeight: 700,
							padding: '12px 28px',
						}}
						type="button"
					>
						Try again
					</button>
					{error?.digest && (
						<p style={{ color: '#ACACAC', fontSize: 12, marginTop: 20 }}>
							Reference: {error.digest}
						</p>
					)}
				</div>
			</body>
		</html>
	);
}
