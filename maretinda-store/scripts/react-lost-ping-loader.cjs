/**
 * Backports one line of React to the copy Next 15.5 bundles.
 *
 * When streamed content arrives while React is in the middle of rendering a
 * navigation, the "it's here" ping was thrown away and the navigation never
 * finished: the answer had come, and the page simply didn't move. It hit
 * Continue to payment, the cart and the category filters. Next 16's React
 * records the ping instead, which is what this does.
 *
 * Remove this file, its entry in next.config.ts and its test once the storefront
 * is on Next 16.
 */
const DROPS_PING = /0 === \(executionContext & 2\) && prepareFreshStack\(root, 0\)/;
const RECORDS_PING =
	/0 === \(executionContext & 2\)\s*\?\s*prepareFreshStack\(root, 0\)\s*:\s*\(workInProgressRootPingedLanes \|= pingedLanes\)/;

module.exports = function reactLostPing(source) {
	if (RECORDS_PING.test(source)) return source;
	if (!DROPS_PING.test(source)) {
		throw new Error(
			"react-lost-ping-loader: React's pingSuspendedRoot no longer looks the way this backport expects. Check whether the bundled React already records pings during render, then update or remove scripts/react-lost-ping-loader.cjs.",
		);
	}
	return source.replace(
		DROPS_PING,
		'0 === (executionContext & 2) ? prepareFreshStack(root, 0) : (workInProgressRootPingedLanes |= pingedLanes)',
	);
};
